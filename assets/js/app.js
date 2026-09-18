/* =========================================================
   UBnux
   MAIN APPLICATION CONTROLLER
   File: assets/js/app.js

   RESPONSIBILITY
   ---------------------------------------------------------
   • Application startup
   • Cache-first loading
   • API initialization
   • Background refresh
   • Search / Filter / Sort coordination
   • Loader management
   • Module initialization
   • Rendering coordination
   • Pagination
   • District / Category changes
   • Search debounce
   • Mobile menu
   • Modal coordination
   • Error handling
   • Network handling
   • Public application API
   ========================================================= */

(function (window, document) {

  "use strict";


  /* =======================================================
     NAMESPACE
  ======================================================= */

  window.UBnux =
    window.UBnux ||
    window.ZilaBiz ||
    {};

  window.ZilaBiz =
    window.UBnux;

  const App =
    window.UBnux;


  /* =======================================================
     CONFIGURATION
  ======================================================= */

  const CONFIG =
    window.UBNux_CONFIG ||
    window.ZILABIZ_CONFIG ||
    {};

  const API =
    App.api ||
    window.UBnuxAPI ||
    window.ZilaBizAPI ||
    null;


  /* =======================================================
     DEFAULT VALUES
  ======================================================= */

  const DEFAULT_PAGE_SIZE =
    Number(
      CONFIG.BUSINESS_PAGE_SIZE
    ) ||
    18;

  const SEARCH_DEBOUNCE =
    Number(
      CONFIG.SEARCH_DEBOUNCE
    );

  const SEARCH_DELAY =
    Number.isFinite(
      SEARCH_DEBOUNCE
    )
      ? SEARCH_DEBOUNCE
      : 50;

  const MINIMUM_LOADER_TIME =
    Number(
      CONFIG.MINIMUM_LOADER_TIME
    ) ||
    350;

  const API_TIMEOUT =
    Number(
      CONFIG.API_TIMEOUT
    ) ||
    15000;

  const DEFAULT_DISTRICT =
    String(
      CONFIG.DEFAULT_DISTRICT ||
      "ALL"
    );

  const DEFAULT_CATEGORY =
    String(
      CONFIG.DEFAULT_CATEGORY ||
      "ALL"
    );

  const DEFAULT_SORT =
    String(
      CONFIG.DEFAULT_SORT ||
      "featured"
    );


  /* =======================================================
     INTERNAL FLAGS
  ======================================================= */

  let isInitializing =
    false;

  let isRefreshing =
    false;

  let startupStartedAt =
    0;

  let searchTimer =
    null;

  let booted =
    false;

  let eventHandlersAttached =
    false;

  let modulesInitialized =
    false;

  let lastInitializationError =
    null;


  /* =======================================================
     DOM HELPERS
  ======================================================= */

  function $(selector) {

    if (
      typeof selector !== "string"
    ) {

      return null;

    }

    return document.querySelector(
      selector
    );

  }


  function byId(id) {

    if (!id) {

      return null;

    }

    return document.getElementById(
      id
    );

  }


  function all(selector) {

    if (
      typeof selector !== "string"
    ) {

      return [];

    }

    return Array.from(
      document.querySelectorAll(
        selector
      )
    );

  }


  /* =======================================================
     SAFE NUMBER
  ======================================================= */

  function toNumber(
    value,
    fallback = 0
  ) {

    const number =
      Number(value);

    return Number.isFinite(number)
      ? number
      : fallback;

  }


  /* =======================================================
     LOADER
  ======================================================= */

  function showPageLoader(
    message
  ) {

    const loader =
      byId("pageLoader");

    const text =
      byId("loaderText");

    if (text) {

      text.textContent =
        message ||
        "Loading...";

    }

    if (!loader) {

      return;

    }

    loader.classList.remove(
      "hidden"
    );

    loader.removeAttribute(
      "hidden"
    );

    loader.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "ubnux-loading"
    );

  }


  function hidePageLoader() {

    const loader =
      byId("pageLoader");

    if (!loader) {

      return;

    }

    loader.classList.add(
      "hidden"
    );

    loader.setAttribute(
      "hidden",
      "hidden"
    );

    loader.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "ubnux-loading"
    );

  }


  function updateLoaderText(
    message
  ) {

    const text =
      byId("loaderText");

    if (!text) {

      return;

    }

    text.textContent =
      message ||
      "Loading...";

  }


  async function hideLoaderAfterMinimumTime() {

    const elapsed =
      Date.now() -
      startupStartedAt;

    const remaining =
      Math.max(
        0,
        MINIMUM_LOADER_TIME -
        elapsed
      );

    if (remaining > 0) {

      await new Promise(
        function (resolve) {

          setTimeout(
            resolve,
            remaining
          );

        }
      );

    }

    hidePageLoader();

  }


  /* =======================================================
     TOAST
  ======================================================= */

  function showToast(
    message,
    type = "info"
  ) {

    const toast =
      byId("toast");

    const toastMessage =
      byId("toastMessage");

    const toastIcon =
      byId("toastIcon");

    if (!toast) {

      return;

    }

    if (toastMessage) {

      toastMessage.textContent =
        message ||
        "";

    }

    if (toastIcon) {

      const icons = {

        success: "✓",
        error: "!",
        warning: "!",
        info: "i"

      };

      toastIcon.textContent =
        icons[type] ||
        icons.info;

    }

    toast.classList.remove(
      "success",
      "error",
      "warning",
      "info"
    );

    toast.classList.add(
      type
    );

    toast.classList.add(
      "show"
    );

    clearTimeout(
      toast.__ubnuxTimer
    );

    toast.__ubnuxTimer =
      setTimeout(
        function () {

          toast.classList.remove(
            "show"
          );

        },
        3500
      );

  }


  /* =======================================================
     API URL
  ======================================================= */

  function getApiUrl() {

    try {

      if (
        API &&
        typeof API.getApiUrl ===
        "function"
      ) {

        return API.getApiUrl();

      }

    } catch (error) {

      console.warn(
        "[UBnux] Could not read API URL:",
        error
      );

    }

    return String(
      CONFIG.API_URL ||
      CONFIG.apiUrl ||
      ""
    );

  }


  /* =======================================================
     API CONFIGURATION CHECK
  ======================================================= */

  function validateApiConfiguration() {

    const url =
      getApiUrl();

    if (!url) {

      console.error(
        "[UBnux] API URL is missing."
      );

      return false;

    }

    if (
      url.indexOf(
        "googleusercontent.com"
      ) !== -1
    ) {

      console.error(
        "[UBnux] Invalid Google Apps Script URL:",
        url
      );

      return false;

    }

    return true;

  }


  /* =======================================================
     API CALL WITH TIMEOUT
  ======================================================= */

  async function withApiTimeout(
    promise,
    timeout = API_TIMEOUT
  ) {

    let timer = null;

    try {

      return await Promise.race([

        promise,

        new Promise(
          function (_, reject) {

            timer =
              setTimeout(
                function () {

                  reject(
                    new Error(
                      "API request timed out."
                    )
                  );

                },
                timeout
              );

          }
        )

      ]);

    } finally {

      if (timer) {

        clearTimeout(
          timer
        );

      }

    }

  }


  /* =======================================================
     INITIAL DATA NORMALIZER
  ======================================================= */

  function normalizeInitialData(
    response
  ) {

    if (!response) {

      return {

        success: false,

        districts: [],

        categories: [],

        businesses: [],

        businessMeta: null

      };

    }


    /*
      API.js already returns normalized data:

      {
        success,
        districts,
        categories,
        businesses,
        businessMeta
      }

      But this function also supports:

      {
        success,
        data: {
          districts,
          categories,
          businesses,
          businessMeta
        }
      }
    */

    const source =
      response.data &&
      typeof response.data === "object" &&
      !Array.isArray(
        response.data
      )
        ? response.data
        : response;


    const districts =
      Array.isArray(
        source.districts
      )
        ? source.districts
        : [];


    const categories =
      Array.isArray(
        source.categories
      )
        ? source.categories
        : [];


    const businesses =
      Array.isArray(
        source.businesses
      )
        ? source.businesses
        : [];


    const businessMeta =
      source.businessMeta &&
      typeof source.businessMeta ===
      "object"
        ? source.businessMeta
        : null;


    return {

      success:
        response.success !== false,

      message:
        response.message ||
        "",

      districts,

      categories,

      businesses,

      businessMeta

    };

  }


  /* =======================================================
     SET INITIAL DATA INTO APPLICATION STATE
  ======================================================= */

  function setInitialData(
    response,
    options = {}
  ) {

    const data =
      normalizeInitialData(
        response
      );


    /* -----------------------------------------------------
       DISTRICTS
    ----------------------------------------------------- */

    if (
      typeof App.setDistricts ===
      "function"
    ) {

      App.setDistricts(
        data.districts
      );

    }


    /* -----------------------------------------------------
       CATEGORIES
    ----------------------------------------------------- */

    if (
      typeof App.setCategories ===
      "function"
    ) {

      App.setCategories(
        data.categories
      );

    }


    /* -----------------------------------------------------
       BUSINESSES
    ----------------------------------------------------- */

    if (
      typeof App.setBusinesses ===
      "function"
    ) {

      App.setBusinesses(
        data.businesses
      );

    }


    /* -----------------------------------------------------
       BUSINESS META
    ----------------------------------------------------- */

    if (
      typeof App.setBusinessMeta ===
      "function"
    ) {

      App.setBusinessMeta(
        data.businessMeta
      );

    }


    /* -----------------------------------------------------
       CACHE STATE
    ----------------------------------------------------- */

    if (
      typeof App.setCacheState ===
      "function"
    ) {

      App.setCacheState(
        Boolean(
          options.fromCache
        )
      );

    }


    return data;

  }


  /* =======================================================
     GET CURRENT STATE
  ======================================================= */

  function getState() {

    if (
      typeof App.getState ===
      "function"
    ) {

      return App.getState();

    }

    return {};

  }


  /* =======================================================
     APPLY FILTERS
  ======================================================= */

  function applyCurrentFilters(
    options = {}
  ) {

    try {

      let result = [];


      if (
        App.filters &&
        typeof App.filters.applyFilters ===
        "function"
      ) {

        result =
          App.filters.applyFilters(
            options
          );

      } else if (
        typeof App.applyFiltersInternal ===
        "function"
      ) {

        result =
          App.applyFiltersInternal(
            options
          );

      }


      return Array.isArray(
        result
      )
        ? result
        : [];

    } catch (error) {

      console.error(
        "[UBnux] Filter error:",
        error
      );

      return [];

    }

  }


  /* =======================================================
     RESET PAGINATION
  ======================================================= */

  function resetPagination() {

    if (
      typeof App.setPage ===
      "function"
    ) {

      App.setPage(1);

      return;

    }

    if (
      typeof App.updateState ===
      "function"
    ) {

      App.updateState({

        page: 1

      });

    }

  }


  /* =======================================================
     RENDER ALL DATA
  ======================================================= */

  function renderAllData(
    options = {}
  ) {

    try {

      /*
       * Render district UI
       */

      if (
        App.district &&
        typeof App.district.render ===
        "function"
      ) {

        App.district.render();

      }


      /*
       * Render category UI
       */

      if (
        App.categories &&
        typeof App.categories.render ===
        "function"
      ) {

        App.categories.render();

      }


      /*
       * Apply filters
       */

      applyCurrentFilters(
        options
      );


      /*
       * Render businesses
       */

      if (
        App.businesses &&
        typeof App.businesses.renderCurrentPage ===
        "function"
      ) {

        App.businesses.renderCurrentPage(
          options
        );

      } else if (
        App.businesses &&
        typeof App.businesses.render ===
        "function"
      ) {

        App.businesses.render(
          options
        );

      }


      return true;

    } catch (error) {

      console.error(
        "[UBnux] Render error:",
        error
      );

      return false;

    }

  }


  /* =======================================================
     RENDER FILTERED DATA
  ======================================================= */

  function renderFilteredData(
    options = {}
  ) {

    try {

      resetPagination();

      applyCurrentFilters(
        options
      );


      if (
        App.businesses &&
        typeof App.businesses.renderCurrentPage ===
        "function"
      ) {

        App.businesses.renderCurrentPage(
          options
        );

      } else if (
        App.businesses &&
        typeof App.businesses.render ===
        "function"
      ) {

        App.businesses.render(
          options
        );

      }

      return true;

    } catch (error) {

      console.error(
        "[UBnux] Filtered render error:",
        error
      );

      return false;

    }

  }


  /* =======================================================
     SEARCH
  ======================================================= */

  function handleSearchInput(
    event
  ) {

    const input =
      event &&
      event.target
        ? event.target
        : byId("searchInput");

    if (!input) {

      return;

    }

    const value =
      String(
        input.value ||
        ""
      );


    if (
      typeof App.setSearch ===
      "function"
    ) {

      App.setSearch(
        value
      );

    } else if (
      typeof App.updateState ===
      "function"
    ) {

      App.updateState({

        search:
          value

      });

    }


    const clearButton =
      byId(
        "clearSearchButton"
      );

    if (clearButton) {

      clearButton.hidden =
        value.trim().length === 0;

    }


    clearTimeout(
      searchTimer
    );


    searchTimer =
      setTimeout(
        function () {

          renderFilteredData({

            reason:
              "search"

          });

        },
        SEARCH_DELAY
      );

  }


  function clearSearch() {

    const input =
      byId(
        "searchInput"
      );

    if (input) {

      input.value =
        "";

    }


    if (
      typeof App.setSearch ===
      "function"
    ) {

      App.setSearch(
        ""
      );

    }


    const clearButton =
      byId(
        "clearSearchButton"
      );

    if (clearButton) {

      clearButton.hidden =
        true;

    }


    clearTimeout(
      searchTimer
    );


    renderFilteredData({

      reason:
        "clear-search"

    });


    if (input) {

      try {

        input.focus();

      } catch (_) {}

    }

  }


  /* =======================================================
     DISTRICT CHANGE
  ======================================================= */

  function handleDistrictChange(
    event
  ) {

    const value =
      event &&
      event.target
        ? event.target.value
        : DEFAULT_DISTRICT;


    if (
      typeof App.setDistrict ===
      "function"
    ) {

      App.setDistrict(
        value
      );

    }


    if (
      typeof App.setSelectedDistrict ===
      "function"
    ) {

      App.setSelectedDistrict(
        value
      );

    }


    renderFilteredData({

      reason:
        "district-change"

    });

  }


  /* =======================================================
     CATEGORY CHANGE
  ======================================================= */

  function handleCategoryChange(
    event
  ) {

    const value =
      event &&
      event.target
        ? event.target.value
        : DEFAULT_CATEGORY;


    if (
      typeof App.setCategory ===
      "function"
    ) {

      App.setCategory(
        value
      );

    }


    if (
      typeof App.setSelectedCategory ===
      "function"
    ) {

      App.setSelectedCategory(
        value
      );

    }


    renderFilteredData({

      reason:
        "category-change"

    });

  }


  /* =======================================================
     SORT CHANGE
  ======================================================= */

  function handleSortChange(
    event
  ) {

    const value =
      event &&
      event.target
        ? event.target.value
        : DEFAULT_SORT;


    if (
      typeof App.setSort ===
      "function"
    ) {

      App.setSort(
        value
      );

    }


    renderFilteredData({

      reason:
        "sort-change"

    });

  }


  /* =======================================================
     RESET FILTERS
  ======================================================= */

  function resetAllFilters() {

    clearTimeout(
      searchTimer
    );


    const searchInput =
      byId(
        "searchInput"
      );

    if (searchInput) {

      searchInput.value =
        "";

    }


    const clearButton =
      byId(
        "clearSearchButton"
      );

    if (clearButton) {

      clearButton.hidden =
        true;

    }


    if (
      typeof App.resetFilters ===
      "function"
    ) {

      App.resetFilters();

    } else if (
      typeof App.updateState ===
      "function"
    ) {

      App.updateState({

        search: "",

        district:
          DEFAULT_DISTRICT,

        selectedDistrict:
          DEFAULT_DISTRICT,

        category:
          DEFAULT_CATEGORY,

        selectedCategory:
          DEFAULT_CATEGORY,

        sort:
          DEFAULT_SORT,

        page: 1

      });

    }


    const districtFilter =
      byId(
        "districtFilter"
      );

    if (districtFilter) {

      districtFilter.value =
        DEFAULT_DISTRICT;

    }


    const categoryFilter =
      byId(
        "categoryFilter"
      );

    if (categoryFilter) {

      categoryFilter.value =
        DEFAULT_CATEGORY;

    }


    const sortFilter =
      byId(
        "sortFilter"
      );

    if (sortFilter) {

      sortFilter.value =
        DEFAULT_SORT;

    }


    renderAllData({

      reason:
        "reset-filters"

    });


    showToast(
      "Filters reset.",
      "success"
    );

  }


  /* =======================================================
     LOAD MORE
  ======================================================= */

  function handleLoadMore() {

    if (
      App.businesses &&
      typeof App.businesses.loadMore ===
      "function"
    ) {

      App.businesses.loadMore();

      return;

    }


    if (
      typeof App.loadNextPage ===
      "function"
    ) {

      App.loadNextPage();

    }


    if (
      App.businesses &&
      typeof App.businesses.renderCurrentPage ===
      "function"
    ) {

      App.businesses.renderCurrentPage();

    }

  }


  /* =======================================================
     MOBILE MENU
  ======================================================= */

  function toggleMobileMenu() {

    const button =
      byId(
        "menuButton"
      );

    const menu =
      document.querySelector(
        ".main-nav"
      ) ||
      document.querySelector(
        ".nav-menu"
      ) ||
      document.querySelector(
        "[data-mobile-menu]"
      );


    document.body.classList.toggle(
      "mobile-menu-open"
    );


    if (button) {

      const expanded =
        document.body.classList.contains(
          "mobile-menu-open"
        );

      button.setAttribute(
        "aria-expanded",
        String(
          expanded
        )
      );

    }


    if (menu) {

      menu.classList.toggle(
        "mobile-open"
      );

    }

  }


  function closeMobileMenu() {

    document.body.classList.remove(
      "mobile-menu-open"
    );


    const button =
      byId(
        "menuButton"
      );

    if (button) {

      button.setAttribute(
        "aria-expanded",
        "false"
      );

    }


    all(
      ".mobile-open"
    ).forEach(
      function (element) {

        element.classList.remove(
          "mobile-open"
        );

      }
    );

  }


  /* =======================================================
     NAVIGATION
  ======================================================= */

  function handleNavigation(
    event
  ) {

    const link =
      event.target.closest(
        "a[href]"
      );

    if (!link) {

      return;

    }


    const href =
      link.getAttribute(
        "href"
      );


    if (
      !href ||
      href === "#" ||
      href.startsWith(
        "javascript:"
      )
    ) {

      return;

    }


    if (
      href.startsWith(
        "#"
      )
    ) {

      const target =
        document.querySelector(
          href
        );

      if (target) {

        event.preventDefault();

        closeMobileMenu();

        try {

          target.scrollIntoView({

            behavior:
              "smooth",

            block:
              "start"

          });

        } catch (_) {

          target.scrollIntoView();

        }

      }

    }

  }


  /* =======================================================
     DISTRICT MODAL
  ======================================================= */

  function openDistrictModal() {

    if (
      App.district &&
      typeof App.district.open ===
      "function"
    ) {

      App.district.open();

      return;

    }


    const modal =
      byId(
        "districtModal"
      );

    if (!modal) {

      return;

    }

    modal.classList.add(
      "show"
    );

    modal.removeAttribute(
      "hidden"
    );

    document.body.classList.add(
      "modal-open"
    );

  }


  function closeDistrictModal() {

    if (
      App.district &&
      typeof App.district.close ===
      "function"
    ) {

      App.district.close();

      return;

    }


    const modal =
      byId(
        "districtModal"
      );

    if (!modal) {

      return;

    }

    modal.classList.remove(
      "show"
    );

    modal.setAttribute(
      "hidden",
      "hidden"
    );

    document.body.classList.remove(
      "modal-open"
    );

  }


  /* =======================================================
     DISTRICT DETECTION
  ======================================================= */

  async function detectLocation() {

    if (
      App.location &&
      typeof App.location.detect ===
      "function"
    ) {

      return App.location.detect();

    }


    if (
      App.location &&
      typeof App.location.detectDistrict ===
      "function"
    ) {

      return App.location.detectDistrict();

    }


    if (
      typeof App.detectDistrictByLocation ===
      "function"
    ) {

      return App.detectDistrictByLocation();

    }


    showToast(
      "Location detection is not available.",
      "warning"
    );

    return null;

  }


  /* =======================================================
     SAVE DISTRICT
  ======================================================= */

  function saveDistrict() {

    if (
      App.district &&
      typeof App.district.saveDistrict ===
      "function"
    ) {

      const result =
        App.district.saveDistrict();

      return result;

    }


    const select =
      byId(
        "districtModalSelect"
      );

    if (!select) {

      return;

    }


    const value =
      select.value ||
      DEFAULT_DISTRICT;


    if (
      typeof App.setDistrict ===
      "function"
    ) {

      App.setDistrict(
        value
      );

    }


    if (
      typeof App.setSelectedDistrict ===
      "function"
    ) {

      App.setSelectedDistrict(
        value
      );

    }


    closeDistrictModal();

    renderFilteredData({

      reason:
        "district-save"

    });

  }


  /* =======================================================
     BACKGROUND REFRESH
  ======================================================= */

  async function backgroundRefresh() {

    if (isRefreshing) {

      return null;

    }


    if (
      !API ||
      typeof API.refreshInitialData !==
      "function"
    ) {

      return null;

    }


    isRefreshing =
      true;


    if (
      typeof App.setRefreshing ===
      "function"
    ) {

      App.setRefreshing(
        true
      );

    }


    try {

      const response =
        await withApiTimeout(
          API.refreshInitialData()
        );


      const data =
        setInitialData(
          response,
          {
            fromCache:
              false
          }
        );


      renderAllData({

        reason:
          "background-refresh",

        background:
          true

      });


      if (
        typeof App.setInitialized ===
        "function"
      ) {

        App.setInitialized(
          true
        );

      }


      return data;

    } catch (error) {

      console.warn(
        "[UBnux] Background refresh failed:",
        error
      );

      return null;

    } finally {

      isRefreshing =
        false;


      if (
        typeof App.setRefreshing ===
        "function"
      ) {

        App.setRefreshing(
          false
        );

      }

    }

  }


  /* =======================================================
     LOAD CACHED DATA
  ======================================================= */

  async function loadCachedData() {

    if (
      !API ||
      typeof API.getInitialDataFast !==
      "function"
    ) {

      return {

        usedCache:
          false,

        data:
          null

      };

    }


    try {

      const result =
        await withApiTimeout(
          API.getInitialDataFast()
        );


      if (
        !result
      ) {

        return {

          usedCache:
            false,

          data:
            null

        };

      }


      /*
       * IMPORTANT:
       *
       * getInitialDataFast() returns:
       *
       * {
       *   data: normalizedData,
       *   fromCache: true/false
       * }
       */

      const data =
        normalizeInitialData(
          result.data
        );


      if (
        result.fromCache === true
      ) {

        setInitialData(
          data,
          {
            fromCache:
              true
          }
        );


        renderAllData({

          reason:
            "cache"

        });


        return {

          usedCache:
            true,

          data

        };

      }


      /*
       * If fromCache is false,
       * getInitialDataFast() has already
       * fetched fresh API data.
       *
       * DO NOT call API again here.
       */

      setInitialData(
        data,
        {
          fromCache:
            false
        }
      );


      renderAllData({

        reason:
          "initial-api"

      });


      return {

        usedCache:
          false,

        data

      };

    } catch (error) {

      console.warn(
        "[UBnux] Cache/fast load failed:",
        error
      );

      return {

        usedCache:
          false,

        data:
          null,

        error

      };

    }

  }


  /* =======================================================
     FETCH INITIAL DATA
  ======================================================= */

  async function fetchInitialData() {

    if (
      !API ||
      typeof API.getInitialData !==
      "function"
    ) {

      throw new Error(
        "UBnux API module is not available."
      );

    }


    updateLoaderText(
      "Loading latest data..."
    );


    const response =
      await withApiTimeout(
        API.getInitialData()
      );


    const data =
      setInitialData(
        response,
        {
          fromCache:
            false
        }
      );


    renderAllData({

      reason:
        "api"

    });


    return data;

  }


  /* =======================================================
     INITIAL ERROR STATE
  ======================================================= */

  function showInitialErrorState(
    error
  ) {

    lastInitializationError =
      error;


    const message =
      error &&
      error.message
        ? error.message
        : "Unable to load data.";


    console.error(
      "[UBnux] Initial data error:",
      error
    );


    const businessGrid =
      byId(
        "businessGrid"
      );

    if (businessGrid) {

      businessGrid.innerHTML = `

        <div
          class="ubnux-api-error"
          role="alert"
        >

          <div class="ubnux-api-error-icon">
            !
          </div>

          <h3>
            Unable to load businesses
          </h3>

          <p>
            ${escapeHtml(
              message
            )}
          </p>

          <button
            type="button"
            id="retryApiButton"
            class="btn btn-primary"
          >
            Try Again
          </button>

        </div>

      `;

    }


    const emptyState =
      byId(
        "emptyState"
      );

    if (emptyState) {

      emptyState.hidden =
        true;

    }


    const retryButton =
      byId(
        "retryApiButton"
      );

    if (retryButton) {

      retryButton.addEventListener(
        "click",
        function () {

          initializeApp(
            true
          );

        }
      );

    }


    showToast(
      "Unable to load data. Please try again.",
      "error"
    );

  }


  /* =======================================================
     HTML ESCAPE
  ======================================================= */

  function escapeHtml(
    value
  ) {

    const string =
      String(
        value == null
          ? ""
          : value
      );


    return string
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );

  }


  /* =======================================================
     MODULE INITIALIZATION
  ======================================================= */

  function initializeModules() {

    if (modulesInitialized) {

      return true;

    }


    try {

      /*
       * District module
       */

      if (
        App.district &&
        typeof App.district.init ===
        "function"
      ) {

        App.district.init();

      }


      /*
       * Category module
       */

      if (
        App.categories &&
        typeof App.categories.init ===
        "function"
      ) {

        App.categories.init();

      }


      /*
       * Business module
       */

      if (
        App.businesses &&
        typeof App.businesses.init ===
        "function"
      ) {

        App.businesses.init();

      }


      /*
       * Modal module
       */

      if (
        App.modal &&
        typeof App.modal.init ===
        "function"
      ) {

        App.modal.init();

      }


      /*
       * Location module
       */

      if (
        App.location &&
        typeof App.location.init ===
        "function"
      ) {

        App.location.init();

      }


      /*
       * Filters module
       */

      if (
        App.filters &&
        typeof App.filters.init ===
        "function"
      ) {

        App.filters.init();

      }


      modulesInitialized =
        true;


      return true;

    } catch (error) {

      console.error(
        "[UBnux] Module initialization failed:",
        error
      );

      return false;

    }

  }


  /* =======================================================
     EVENT LISTENERS
  ======================================================= */

  function setupEventListeners() {

    if (eventHandlersAttached) {

      return;

    }


    /* -----------------------------------------------------
       SEARCH
    ----------------------------------------------------- */

    const searchInput =
      byId(
        "searchInput"
      );

    if (searchInput) {

      searchInput.addEventListener(
        "input",
        handleSearchInput
      );

    }


    /* -----------------------------------------------------
       CLEAR SEARCH
    ----------------------------------------------------- */

    const clearSearchButton =
      byId(
        "clearSearchButton"
      );

    if (clearSearchButton) {

      clearSearchButton.addEventListener(
        "click",
        clearSearch
      );

    }


    /* -----------------------------------------------------
       DISTRICT FILTER
    ----------------------------------------------------- */

    const districtFilter =
      byId(
        "districtFilter"
      );

    if (districtFilter) {

      districtFilter.addEventListener(
        "change",
        handleDistrictChange
      );

    }


    /* -----------------------------------------------------
       CATEGORY FILTER
    ----------------------------------------------------- */

    const categoryFilter =
      byId(
        "categoryFilter"
      );

    if (categoryFilter) {

      categoryFilter.addEventListener(
        "change",
        handleCategoryChange
      );

    }


    /* -----------------------------------------------------
       SORT FILTER
    ----------------------------------------------------- */

    const sortFilter =
      byId(
        "sortFilter"
      );

    if (sortFilter) {

      sortFilter.addEventListener(
        "change",
        handleSortChange
      );

    }


    /* -----------------------------------------------------
       RESET FILTERS
    ----------------------------------------------------- */

    const resetFiltersButton =
      byId(
        "resetFiltersButton"
      );

    if (resetFiltersButton) {

      resetFiltersButton.addEventListener(
        "click",
        resetAllFilters
      );

    }


    /* -----------------------------------------------------
       LOAD MORE
    ----------------------------------------------------- */

    const loadMoreButton =
      byId(
        "loadMoreButton"
      );

    if (loadMoreButton) {

      loadMoreButton.addEventListener(
        "click",
        handleLoadMore
      );

    }


    /* -----------------------------------------------------
       DISTRICT BUTTON
    ----------------------------------------------------- */

    const districtButton =
      byId(
        "districtButton"
      );

    if (districtButton) {

      districtButton.addEventListener(
        "click",
        openDistrictModal
      );

    }


    /* -----------------------------------------------------
       CLOSE DISTRICT MODAL
    ----------------------------------------------------- */

    const closeDistrictModalButton =
      byId(
        "closeDistrictModal"
      );

    if (closeDistrictModalButton) {

      closeDistrictModalButton.addEventListener(
        "click",
        closeDistrictModal
      );

    }


    /* -----------------------------------------------------
       DETECT LOCATION
    ----------------------------------------------------- */

    const detectLocationButton =
      byId(
        "detectLocationButton"
      );

    if (detectLocationButton) {

      detectLocationButton.addEventListener(
        "click",
        detectLocation
      );

    }


    /* -----------------------------------------------------
       SAVE DISTRICT
    ----------------------------------------------------- */

    const saveDistrictButton =
      byId(
        "saveDistrictButton"
      );

    if (saveDistrictButton) {

      saveDistrictButton.addEventListener(
        "click",
        saveDistrict
      );

    }


    /* -----------------------------------------------------
       MOBILE MENU
    ----------------------------------------------------- */

    const menuButton =
      byId(
        "menuButton"
      );

    if (menuButton) {

      menuButton.addEventListener(
        "click",
        toggleMobileMenu
      );

    }


    /* -----------------------------------------------------
       NAVIGATION
    ----------------------------------------------------- */

    document.addEventListener(
      "click",
      handleNavigation
    );


    /* -----------------------------------------------------
       ESCAPE KEY
    ----------------------------------------------------- */

    document.addEventListener(
      "keydown",
      function (event) {

        if (
          event.key ===
          "Escape"
        ) {

          closeDistrictModal();

          closeMobileMenu();


          if (
            App.modal &&
            typeof App.modal.closeAll ===
            "function"
          ) {

            App.modal.closeAll();

          }

        }

      }
    );


    /* -----------------------------------------------------
       CLICK OUTSIDE DISTRICT MODAL
    ----------------------------------------------------- */

    const districtModal =
      byId(
        "districtModal"
      );

    if (districtModal) {

      districtModal.addEventListener(
        "click",
        function (event) {

          if (
            event.target ===
            districtModal
          ) {

            closeDistrictModal();

          }

        }
      );

    }


    /* -----------------------------------------------------
       ONLINE / OFFLINE
    ----------------------------------------------------- */

    window.addEventListener(
      "online",
      function () {

        showToast(
          "Internet connection restored.",
          "success"
        );

      }
    );


    window.addEventListener(
      "offline",
      function () {

        showToast(
          "You are offline.",
          "warning"
        );

      }
    );


    /* -----------------------------------------------------
       VISIBILITY CHANGE
    ----------------------------------------------------- */

    document.addEventListener(
      "visibilitychange",
      function () {

        if (
          document.visibilityState !==
          "visible"
        ) {

          return;

        }


        /*
         * Do not automatically refresh
         * every time the tab becomes visible.
         *
         * This avoids unnecessary API calls.
         */

      }
    );


    eventHandlersAttached =
      true;

  }


  /* =======================================================
     SYNC CONTROLS WITH STATE
  ======================================================= */

  function syncControlsFromState() {

    const state =
      getState();


    /* -----------------------------------------------------
       SEARCH
    ----------------------------------------------------- */

    const searchInput =
      byId(
        "searchInput"
      );

    if (searchInput) {

      const value =
        String(
          state.search ||
          ""
        );

      if (
        searchInput.value !==
        value
      ) {

        searchInput.value =
          value;

      }

    }


    const clearSearchButton =
      byId(
        "clearSearchButton"
      );

    if (clearSearchButton) {

      clearSearchButton.hidden =
        String(
          state.search ||
          ""
        ).trim().length === 0;

    }


    /* -----------------------------------------------------
       DISTRICT
    ----------------------------------------------------- */

    const district =
      state.district ||
      DEFAULT_DISTRICT;


    const districtFilter =
      byId(
        "districtFilter"
      );

    if (districtFilter) {

      districtFilter.value =
        district;

    }


    const districtModalSelect =
      byId(
        "districtModalSelect"
      );

    if (districtModalSelect) {

      districtModalSelect.value =
        district;

    }


    /* -----------------------------------------------------
       CATEGORY
    ----------------------------------------------------- */

    const category =
      state.category ||
      DEFAULT_CATEGORY;


    const categoryFilter =
      byId(
        "categoryFilter"
      );

    if (categoryFilter) {

      categoryFilter.value =
        category;

    }


    /* -----------------------------------------------------
       SORT
    ----------------------------------------------------- */

    const sort =
      state.sort ||
      DEFAULT_SORT;


    const sortFilter =
      byId(
        "sortFilter"
      );

    if (sortFilter) {

      sortFilter.value =
        sort;

    }

  }


  /* =======================================================
     INITIALIZE APP
  ======================================================= */

  async function initializeApp(
    forceRefresh = false
  ) {

    if (isInitializing) {

      return false;

    }


    isInitializing =
      true;

    startupStartedAt =
      Date.now();


    showPageLoader(
      forceRefresh
        ? "Refreshing data..."
        : "Loading UBnux..."
    );


    try {

      /* ---------------------------------------------------
         API CONFIG
      --------------------------------------------------- */

      if (
        !validateApiConfiguration()
      ) {

        throw new Error(
          "API configuration is invalid."
        );

      }


      /* ---------------------------------------------------
         MODULES
      --------------------------------------------------- */

      initializeModules();


      /* ---------------------------------------------------
         EVENTS
      --------------------------------------------------- */

      setupEventListeners();


      /* ---------------------------------------------------
         SYNC DEFAULT CONTROLS
      --------------------------------------------------- */

      syncControlsFromState();


      /* ---------------------------------------------------
         FORCE REFRESH
      --------------------------------------------------- */

      if (forceRefresh) {

        updateLoaderText(
          "Fetching latest data..."
        );


        const data =
          await fetchInitialData();


        syncControlsFromState();


        if (
          typeof App.setError ===
          "function"
        ) {

          App.setError(
            null
          );

        }


        if (
          typeof App.setInitialized ===
          "function"
        ) {

          App.setInitialized(
            true
          );

        }


        lastInitializationError =
          null;


        return data;

      }


      /* ---------------------------------------------------
         CACHE-FIRST / FAST INITIAL LOAD
      --------------------------------------------------- */

      const fastResult =
        await loadCachedData();


      /* ---------------------------------------------------
         CACHE AVAILABLE
      --------------------------------------------------- */

      if (
        fastResult &&
        fastResult.usedCache
      ) {

        syncControlsFromState();


        if (
          typeof App.setInitialized ===
          "function"
        ) {

          App.setInitialized(
            true
          );

        }


        if (
          typeof App.setError ===
          "function"
        ) {

          App.setError(
            null
          );

        }


        lastInitializationError =
          null;


        /*
         * Hide loader quickly.
         */

        await hideLoaderAfterMinimumTime();


        /*
         * Refresh in background.
         */

        if (
          CONFIG.BACKGROUND_REFRESH !==
          false &&
          API &&
          typeof API.refreshInitialData ===
          "function"
        ) {

          backgroundRefresh();

        }


        return fastResult.data;

      }


      /* ---------------------------------------------------
         FRESH DATA WAS ALREADY FETCHED
         BY getInitialDataFast()
      --------------------------------------------------- */

      if (
        fastResult &&
        fastResult.data
      ) {

        syncControlsFromState();


        if (
          typeof App.setInitialized ===
          "function"
        ) {

          App.setInitialized(
            true
          );

        }


        if (
          typeof App.setError ===
          "function"
        ) {

          App.setError(
            null
          );

        }


        lastInitializationError =
          null;


        await hideLoaderAfterMinimumTime();


        return fastResult.data;

      }


      /* ---------------------------------------------------
         FALLBACK: DIRECT API FETCH
      --------------------------------------------------- */

      const data =
        await fetchInitialData();


      syncControlsFromState();


      if (
        typeof App.setInitialized ===
        "function"
      ) {

        App.setInitialized(
          true
        );

      }


      if (
        typeof App.setError ===
        "function"
      ) {

        App.setError(
          null
        );

      }


      lastInitializationError =
        null;


      return data;

    } catch (error) {

      console.error(
        "[UBnux] initializeApp failed:",
        error
      );


      lastInitializationError =
        error;


      if (
        typeof App.setError ===
        "function"
      ) {

        App.setError(
          error
        );

      }


      /*
       * If state already contains businesses,
       * keep them visible.
       */

      const state =
        getState();


      const hasExistingData =
        Array.isArray(
          state.businesses
        ) &&
        state.businesses.length > 0;


      if (!hasExistingData) {

        showInitialErrorState(
          error
        );

      } else {

        showToast(
          "Latest data could not be refreshed. Existing data is shown.",
          "warning"
        );

      }


      return false;

    } finally {

      await hideLoaderAfterMinimumTime();


      isInitializing =
        false;

    }

  }


  /* =======================================================
     RETRY
  ======================================================= */

  async function retryInitialization() {

    return initializeApp(
      true
    );

  }


  /* =======================================================
     REFRESH
  ======================================================= */

  async function refreshApp() {

    return initializeApp(
      true
    );

  }


  /* =======================================================
     DEBUG INFORMATION
  ======================================================= */

  function getDebugInfo() {

    const state =
      getState();


    return {

      version:
        "UBnux App Controller",

      booted,

      initialized:
        Boolean(
          state.initialized
        ),

      initializing:
        isInitializing,

      refreshing:
        isRefreshing,

      apiUrl:
        getApiUrl(),

      apiAvailable:
        Boolean(
          API
        ),

      districts:
        Array.isArray(
          state.districts
        )
          ? state.districts.length
          : 0,

      categories:
        Array.isArray(
          state.categories
        )
          ? state.categories.length
          : 0,

      businesses:
        Array.isArray(
          state.businesses
        )
          ? state.businesses.length
          : 0,

      filteredBusinesses:
        Array.isArray(
          state.filteredBusinesses
        )
          ? state.filteredBusinesses.length
          : 0,

      search:
        state.search ||
        "",

      district:
        state.district ||
        DEFAULT_DISTRICT,

      category:
        state.category ||
        DEFAULT_CATEGORY,

      sort:
        state.sort ||
        DEFAULT_SORT,

      lastError:
        lastInitializationError

    };

  }


  /* =======================================================
     RECOVER APPLICATION
  ======================================================= */

  async function recoverApplication() {

    try {

      if (
        typeof App.resetRequestState ===
        "function"
      ) {

        App.resetRequestState();

      }


      if (
        API &&
        typeof API.resetRequestState ===
        "function"
      ) {

        API.resetRequestState();

      }


      return await initializeApp(
        true
      );

    } catch (error) {

      console.error(
        "[UBnux] Recovery failed:",
        error
      );

      return false;

    }

  }


  /* =======================================================
     PREFETCH
  ======================================================= */

  async function prefetch() {

    /*
     * Current api.js may not expose
     * prefetch(). Therefore this function
     * is intentionally safe.
     */

    if (
      API &&
      typeof API.prefetch ===
      "function"
    ) {

      try {

        return await API.prefetch();

      } catch (error) {

        console.warn(
          "[UBnux] Prefetch failed:",
          error
        );

      }

    }

    return null;

  }


  /* =======================================================
     GLOBAL ERROR HANDLER
  ======================================================= */

  function setupGlobalErrorHandlers() {

    window.addEventListener(
      "error",
      function (event) {

        if (
          !event
        ) {

          return;

        }


        console.error(
          "[UBnux] Global error:",
          event.error ||
          event.message
        );

      }
    );


    window.addEventListener(
      "unhandledrejection",
      function (event) {

        console.error(
          "[UBnux] Unhandled promise rejection:",
          event.reason
        );

      }
    );

  }


  /* =======================================================
     BEFORE UNLOAD
  ======================================================= */

  function setupBeforeUnload() {

    window.addEventListener(
      "beforeunload",
      function () {

        clearTimeout(
          searchTimer
        );

      }
    );

  }


  /* =======================================================
     PUBLIC APPLICATION API
  ======================================================= */

  App.app = {

    initialize:
      initializeApp,

    initializeApp:
      initializeApp,

    refresh:
      refreshApp,

    refreshApp:
      refreshApp,

    retry:
      retryInitialization,

    retryInitialization:
      retryInitialization,

    recover:
      recoverApplication,

    recoverApplication:
      recoverApplication,

    render:
      renderAllData,

    renderAllData:
      renderAllData,

    renderFiltered:
      renderFilteredData,

    renderFilteredData:
      renderFilteredData,

    applyFilters:
      applyCurrentFilters,

    resetFilters:
      resetAllFilters,

    loadMore:
      handleLoadMore,

    clearSearch:
      clearSearch,

    openDistrict:
      openDistrictModal,

    closeDistrict:
      closeDistrictModal,

    detectLocation:
      detectLocation,

    saveDistrict:
      saveDistrict,

    showLoader:
      showPageLoader,

    hideLoader:
      hidePageLoader,

    updateLoader:
      updateLoaderText,

    showToast:
      showToast,

    prefetch:
      prefetch,

    getDebugInfo:
      getDebugInfo,

    getApiUrl:
      getApiUrl

  };


  /* =======================================================
     TOP-LEVEL COMPATIBILITY ALIASES
  ======================================================= */

  App.initializeApp =
    initializeApp;


  App.refreshApp =
    refreshApp;


  App.retryInitialization =
    retryInitialization;


  App.applyFilters =
    applyCurrentFilters;


  App.renderAllData =
    renderAllData;


  App.renderFilteredData =
    renderFilteredData;


  App.resetAllFilters =
    resetAllFilters;


  App.loadMoreBusinesses =
    handleLoadMore;


  App.showPageLoader =
    showPageLoader;


  App.hidePageLoader =
    hidePageLoader;


  App.showToast =
    showToast;


  App.getDebugInfo =
    getDebugInfo;


  App.recoverApplication =
    recoverApplication;


  /* =======================================================
     GLOBAL COMPATIBILITY
  ======================================================= */

  window.initializeApp =
    initializeApp;


  window.refreshApp =
    refreshApp;


  window.retryInitialization =
    retryInitialization;


  window.applyFilters =
    applyCurrentFilters;


  window.renderAllData =
    renderAllData;


  window.renderFilteredData =
    renderFilteredData;


  window.resetAllFilters =
    resetAllFilters;


  window.showPageLoader =
    showPageLoader;


  window.hidePageLoader =
    hidePageLoader;


  window.showToast =
    showToast;


  window.recoverApplication =
    recoverApplication;


  window.getUBnuxDebugInfo =
    getDebugInfo;


  /* =======================================================
     STARTUP BOOT
  ======================================================= */

  async function boot() {

    if (booted) {

      return;

    }


    booted =
      true;


    console.log(
      "[UBnux] Booting application..."
    );


    console.log(
      "[UBnux] API:",
      getApiUrl()
    );


    /*
     * Initialize module objects before
     * fetching application data.
     */

    initializeModules();


    /*
     * Attach application-level events.
     */

    setupEventListeners();


    /*
     * Global error handling.
     */

    setupGlobalErrorHandlers();


    /*
     * Cleanup.
     */

    setupBeforeUnload();


    /*
     * Sync current controls.
     */

    syncControlsFromState();


    /*
     * Start application.
     */

    await initializeApp(
      false
    );


    /*
     * Final control sync.
     */

    syncControlsFromState();


    console.log(
      "[UBnux] Application ready.",
      getDebugInfo()
    );

  }


  /* =======================================================
     DOM READY
  ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      boot,
      {
        once:
          true
      }
    );

  } else {

    boot();

  }


  /* =======================================================
     FINAL NAMESPACE LOG
  ======================================================= */

  console.log(
    "[UBnux] app.js loaded successfully."
  );


})(window, document);
