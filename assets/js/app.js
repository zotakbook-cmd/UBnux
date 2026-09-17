/* =========================================================
   UBnux
   MAIN APPLICATION CONTROLLER
   File: assets/js/app.js

   RESPONSIBILITY:
   ---------------------------------------------------------
   • Application startup
   • Cache-first loading
   • API initialization
   • Background refresh
   • Search / Filter / Sort coordination
   • Loader management
   • Global UI events
   • Error handling
   • Module initialization
   • Business pagination
   • Centralized rendering
   • API timeout protection
   • Emergency loader protection
========================================================= */

(function () {

  "use strict";


  /* =======================================================
     GLOBAL NAMESPACE
  ======================================================== */

  window.UBnux =
    window.ZilaBiz ||
    window.UBnux ||
    {};


  window.ZilaBiz =
    window.UBnux;


  var ZilaBiz =
    window.ZilaBiz;


  /* =======================================================
     CONFIG
  ======================================================== */

  var config =
    window.UBNux_CONFIG ||
    window.ZILABIZ_CONFIG ||
    {};


  /* =======================================================
     APPLICATION STATE
  ======================================================== */

  var searchTimer =
    null;


  var startupCompleted =
    false;


  var startupStartedAt =
    0;


  var isInitializing =
    false;


  var eventsBound =
    false;


  var lastSearchValue =
    "";


  var emergencyLoaderTimer =
    null;


  /* =======================================================
     DEFAULT SETTINGS
  ======================================================== */

  var DEFAULT_PAGE_SIZE =
    Number(
      config.BUSINESS_PAGE_SIZE
    ) || 18;


  var SEARCH_DEBOUNCE =
    Number(
      config.SEARCH_DEBOUNCE
    );


  if (
    !Number.isFinite(
      SEARCH_DEBOUNCE
    )
  ) {

    SEARCH_DEBOUNCE =
      50;

  }


  var MINIMUM_LOADER_TIME =
    Number(
      config.MINIMUM_LOADER_TIME
    );


  if (
    !Number.isFinite(
      MINIMUM_LOADER_TIME
    )
  ) {

    MINIMUM_LOADER_TIME =
      350;

  }


  /*
   * API timeout.
   *
   * Existing config.API_TIMEOUT or
   * config.REQUEST_TIMEOUT can override it.
   *
   * Default: 30 seconds.
   */

  var API_TIMEOUT =
    Number(
      config.API_TIMEOUT ||
      config.REQUEST_TIMEOUT ||
      config.FETCH_TIMEOUT
    );


  if (
    !Number.isFinite(
      API_TIMEOUT
    ) ||
    API_TIMEOUT <= 0
  ) {

    API_TIMEOUT =
      30000;

  }


  /*
   * Emergency loader timeout.
   *
   * This is deliberately longer than API timeout.
   * Even if another module hangs unexpectedly,
   * the user should not see an infinite loader.
   */

  var EMERGENCY_LOADER_TIMEOUT =
    Number(
      config.EMERGENCY_LOADER_TIMEOUT
    );


  if (
    !Number.isFinite(
      EMERGENCY_LOADER_TIMEOUT
    ) ||
    EMERGENCY_LOADER_TIMEOUT <= 0
  ) {

    EMERGENCY_LOADER_TIMEOUT =
      45000;

  }


  var DEFAULT_DISTRICT =
    String(
      config.DEFAULT_DISTRICT ||
      "ALL"
    ).trim();


  var DEFAULT_CATEGORY =
    String(
      config.DEFAULT_CATEGORY ||
      "ALL"
    ).trim();


  var DEFAULT_SORT =
    String(
      config.DEFAULT_SORT ||
      "featured"
    ).trim();


  /* =======================================================
     DOM HELPER
  ======================================================== */

  function getElement(
    id
  ) {

    return document.getElementById(
      id
    );

  }


  /* =======================================================
     SAFE HTML
  ======================================================== */

  function escapeHTML(
    value
  ) {

    var text =
      value === null ||
      value === undefined
        ? ""
        : String(value);


    return text
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
     PROMISE TIMEOUT
  ======================================================== */

  function withTimeout(
    promise,
    timeout,
    label
  ) {

    var safeTimeout =
      Number(timeout);


    if (
      !Number.isFinite(
        safeTimeout
      ) ||
      safeTimeout <= 0
    ) {

      safeTimeout =
        API_TIMEOUT;

    }


    return new Promise(
      function (
        resolve,
        reject
      ) {

        var finished =
          false;


        var timer =
          setTimeout(
            function () {

              if (
                finished
              ) {

                return;

              }


              finished =
                true;


              reject(
                new Error(
                  (
                    label ||
                    "Request"
                  ) +
                  " timed out after " +
                  safeTimeout +
                  " ms."
                )
              );

            },
            safeTimeout
          );


        Promise
          .resolve(
            promise
          )
          .then(
            function (
              value
            ) {

              if (
                finished
              ) {

                return;

              }


              finished =
                true;


              clearTimeout(
                timer
              );


              resolve(
                value
              );

            }
          )
          .catch(
            function (
              error
            ) {

              if (
                finished
              ) {

                return;

              }


              finished =
                true;


              clearTimeout(
                timer
              );


              reject(
                error
              );

            }
          );

      }
    );

  }


  /* =======================================================
     PAGE LOADER
  ======================================================== */

  function showPageLoader(
    message
  ) {

    var loader =
      getElement(
        "pageLoader"
      );


    if (
      !loader
    ) {

      return;

    }


    var text =
      getElement(
        "loaderText"
      );


    if (
      text
    ) {

      text.textContent =
        message ||
        "Loading...";

    }


    loader.classList.remove(
      "loader-hidden"
    );


    loader.removeAttribute(
      "hidden"
    );


    loader.setAttribute(
      "aria-hidden",
      "false"
    );

  }


  function hidePageLoader() {

    var loader =
      getElement(
        "pageLoader"
      );


    if (
      !loader
    ) {

      return;

    }


    loader.classList.add(
      "loader-hidden"
    );


    loader.setAttribute(
      "aria-hidden",
      "true"
    );


    /*
     * Also support HTML [hidden].
     */

    loader.setAttribute(
      "hidden",
      ""
    );

  }


  function updateLoaderMessage(
    message
  ) {

    var text =
      getElement(
        "loaderText"
      );


    if (
      text
    ) {

      text.textContent =
        message ||
        "Loading...";

    }

  }


  /* =======================================================
     EMERGENCY LOADER PROTECTION
  ======================================================== */

  function startEmergencyLoaderProtection() {

    clearTimeout(
      emergencyLoaderTimer
    );


    emergencyLoaderTimer =
      setTimeout(
        function () {

          if (
            !isInitializing
          ) {

            return;

          }


          console.error(
            "[UBnux] Emergency loader timeout reached."
          );


          hidePageLoader();


          showToast(
            "UBnux loading timeout. Page partially loaded hai. Console check karein.",
            "error"
          );


        },
        EMERGENCY_LOADER_TIMEOUT
      );

  }


  function stopEmergencyLoaderProtection() {

    clearTimeout(
      emergencyLoaderTimer
    );


    emergencyLoaderTimer =
      null;

  }


  /* =======================================================
     TOAST
  ======================================================== */

  function showToast(
    message,
    type
  ) {

    var toast =
      getElement(
        "toast"
      );


    var toastMessage =
      getElement(
        "toastMessage"
      );


    var toastIcon =
      getElement(
        "toastIcon"
      );


    if (
      !toast
    ) {

      return;

    }


    if (
      type ===
      "warning"
    ) {

      type =
        "info";

    }


    if (
      toastMessage
    ) {

      toastMessage.textContent =
        message ||
        "";

    }


    if (
      toastIcon
    ) {

      if (
        type ===
        "error"
      ) {

        toastIcon.textContent =
          "✕";

      } else if (
        type ===
        "success"
      ) {

        toastIcon.textContent =
          "✓";

      } else {

        toastIcon.textContent =
          "ℹ";

      }

    }


    toast.classList.remove(
      "toast-success",
      "toast-error",
      "toast-info"
    );


    if (
      type ===
      "error"
    ) {

      toast.classList.add(
        "toast-error"
      );

    } else if (
      type ===
      "success"
    ) {

      toast.classList.add(
        "toast-success"
      );

    } else {

      toast.classList.add(
        "toast-info"
      );

    }


    toast.classList.add(
      "show"
    );


    clearTimeout(
      toast._hideTimer
    );


    toast._hideTimer =
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
     ERROR MESSAGE
  ======================================================== */

  function getErrorMessage(
    error,
    fallback
  ) {

    if (
      error &&
      error.message
    ) {

      return String(
        error.message
      );

    }


    return (
      fallback ||
      "Something went wrong."
    );

  }


  /* =======================================================
     PAGE TITLE
  ======================================================== */

  function updatePageTitle() {

    var title =
      config.APP_NAME ||
      "UBnux";


    if (
      document.title !==
      title
    ) {

      document.title =
        title;

    }

  }


  /* =======================================================
     API URL RESOLVER
  ======================================================== */

  function getConfiguredAPIUrl() {

    var value =
      "";


    /* =====================================================
       API MODULE METHOD
    ====================================================== */

    if (
      ZilaBiz.api &&
      typeof ZilaBiz.api.getApiUrl ===
      "function"
    ) {

      try {

        value =
          ZilaBiz.api.getApiUrl();


        if (
          value !==
          undefined &&
          value !==
          null
        ) {

          value =
            String(
              value
            ).trim();

        }

      } catch (
        error
      ) {

        console.warn(
          "[UBnux] API module URL resolve failed:",
          error
        );

      }

    }


    if (
      value
    ) {

      return value;

    }


    /* =====================================================
       API MODULE PROPERTIES
    ====================================================== */

    if (
      ZilaBiz.api
    ) {

      var apiCandidates = [

        ZilaBiz.api.apiUrl,

        ZilaBiz.api.API_URL,

        ZilaBiz.api.baseUrl,

        ZilaBiz.api.BASE_URL,

        ZilaBiz.api.scriptUrl,

        ZilaBiz.api.SCRIPT_URL

      ];


      for (
        var i = 0;
        i < apiCandidates.length;
        i++
      ) {

        if (
          apiCandidates[i] !==
          undefined &&
          apiCandidates[i] !==
          null
        ) {

          var candidate =
            String(
              apiCandidates[i]
            ).trim();


          if (
            candidate
          ) {

            return candidate;

          }

        }

      }

    }


    /* =====================================================
       GLOBAL CONFIG
    ====================================================== */

    var configCandidates = [

      config.API_URL,

      config.apiUrl,

      config.APPS_SCRIPT_URL,

      config.APPSCRIPT_URL,

      config.SCRIPT_URL,

      config.MASTER_API_URL,

      config.BACKEND_URL,

      config.API_BASE_URL

    ];


    for (
      var j = 0;
      j < configCandidates.length;
      j++
    ) {

      if (
        configCandidates[j] !==
        undefined &&
        configCandidates[j] !==
        null
      ) {

        var configCandidate =
          String(
            configCandidates[j]
          ).trim();


        if (
          configCandidate
        ) {

          return configCandidate;

        }

      }

    }


    /* =====================================================
       META TAG
    ====================================================== */

    try {

      var meta =
        document.querySelector(
          'meta[name="zilabiz-api-url"]'
        );


      if (
        meta
      ) {

        var metaURL =
          String(
            meta.getAttribute(
              "content"
            ) ||
            ""
          ).trim();


        if (
          metaURL
        ) {

          return metaURL;

        }

      }

    } catch (
      error
    ) {

      console.warn(
        "[UBnux] API meta tag read failed:",
        error
      );

    }


    /* =====================================================
       LOCAL STORAGE
    ====================================================== */

    try {

      var storageKeys = [

        "ZILABIZ_API_URL",

        "zilabizApiUrl",

        "ZilaBiz_API_URL",

        "ZilaBizApiUrl",

        "UBNUX_API_URL",

        "UBnuxApiUrl"

      ];


      for (
        var k = 0;
        k < storageKeys.length;
        k++
      ) {

        var savedURL =
          localStorage.getItem(
            storageKeys[k]
          );


        if (
          savedURL
        ) {

          savedURL =
            String(
              savedURL
            ).trim();


          if (
            savedURL
          ) {

            return savedURL;

          }

        }

      }

    } catch (
      error
    ) {

      console.warn(
        "[UBnux] API URL localStorage read failed:",
        error
      );

    }


    return "";

  }


  /* =======================================================
     API CONFIGURATION CHECK
  ======================================================== */

  function checkAPIConfiguration() {

    if (
      config.REQUIRE_API ===
      false
    ) {

      console.info(
        "[UBnux] API is optional because REQUIRE_API=false."
      );


      return true;

    }


    var apiUrl =
      getConfiguredAPIUrl();


    if (
      !apiUrl
    ) {

      console.warn(
        "[UBnux] Google Apps Script API URL not found."
      );


      return false;

    }


    try {

      var parsedURL =
        new URL(
          apiUrl
        );


      if (
        parsedURL.protocol !==
        "https:" &&
        parsedURL.protocol !==
        "http:"
      ) {

        console.warn(
          "[UBnux] Invalid API protocol:",
          apiUrl
        );


        return false;

      }

    } catch (
      error
    ) {

      console.warn(
        "[UBnux] Invalid API URL:",
        apiUrl
      );


      return false;

    }


    console.info(
      "[UBnux] API configured:",
      apiUrl
    );


    return true;

  }


  /* =======================================================
     INITIAL DATA NORMALIZER
  ======================================================== */

  function normalizeInitialData(
    response
  ) {

    if (
      !response
    ) {

      throw new Error(
        "Initial data response empty hai."
      );

    }


    var data =
      response;


    if (
      response &&
      typeof response ===
      "object" &&
      response.data !==
      undefined
    ) {

      data =
        response.data;

    }


    if (
      !data ||
      typeof data !==
      "object"
    ) {

      throw new Error(
        "Initial data ka format invalid hai."
      );

    }


    var businessMeta =
      data.businessMeta;


    if (
      !businessMeta ||
      typeof businessMeta !==
      "object"
    ) {

      var businessCount =
        Array.isArray(
          data.businesses
        )
          ? data.businesses.length
          : 0;


      businessMeta = {

        total:
          businessCount,

        offset:
          0,

        limit:
          businessCount ||
          DEFAULT_PAGE_SIZE,

        hasMore:
          false

      };

    }


    return {

      districts:
        Array.isArray(
          data.districts
        )
          ? data.districts
          : [],


      categories:
        Array.isArray(
          data.categories
        )
          ? data.categories
          : [],


      businesses:
        Array.isArray(
          data.businesses
        )
          ? data.businesses
          : [],


      businessMeta:
        {

          total:
            Number(
              businessMeta.total
            ) || 0,

          offset:
            Number(
              businessMeta.offset
            ) || 0,

          limit:
            Number(
              businessMeta.limit
            ) ||
            DEFAULT_PAGE_SIZE,

          hasMore:
            businessMeta.hasMore ===
            true

        }

    };

  }


  /* =======================================================
     SET INITIAL DATA
  ======================================================== */

  function setInitialData(
    response
  ) {

    var data =
      normalizeInitialData(
        response
      );


    if (
      typeof ZilaBiz.setDistricts ===
      "function"
    ) {

      ZilaBiz.setDistricts(
        data.districts
      );

    }


    if (
      typeof ZilaBiz.setCategories ===
      "function"
    ) {

      ZilaBiz.setCategories(
        data.categories
      );

    }


    if (
      typeof ZilaBiz.setBusinesses ===
      "function"
    ) {

      ZilaBiz.setBusinesses(
        data.businesses
      );

    }


    if (
      typeof ZilaBiz.setBusinessMeta ===
      "function"
    ) {

      ZilaBiz.setBusinessMeta(
        data.businessMeta
      );

    }


    ZilaBiz.businessMeta =
      data.businessMeta;


    return data;

  }


  /* =======================================================
     APPLY FILTERS
  ======================================================== */

  function applyCurrentFilters() {

    if (
      ZilaBiz.filters &&
      typeof ZilaBiz.filters.applyFilters ===
      "function"
    ) {

      return ZilaBiz.filters.applyFilters();

    }


    console.warn(
      "[UBnux] filters.applyFilters() unavailable."
    );


    return [];

  }


  /* =======================================================
     RESET PAGINATION
  ======================================================== */

  function resetBusinessPagination() {

    if (
      typeof ZilaBiz.resetPagination ===
      "function"
    ) {

      ZilaBiz.resetPagination();


      return true;

    }


    console.warn(
      "[UBnux] resetPagination() unavailable."
    );


    return false;

  }


  /* =======================================================
     RENDER CURRENT BUSINESS PAGE
  ======================================================== */

  function renderCurrentBusinessPage() {

    try {

      if (
        !ZilaBiz.businesses ||
        typeof ZilaBiz.businesses.renderCurrentPage !==
        "function"
      ) {

        console.error(
          "[UBnux] businesses.renderCurrentPage() not available."
        );


        return false;

      }


      ZilaBiz.businesses.renderCurrentPage();


      console.log(
        "[UBnux] businesses.renderCurrentPage() executed."
      );


      return true;

    } catch (
      error
    ) {

      console.error(
        "[UBnux] Business page render error:",
        error
      );


      return false;

    }

  }


  /* =======================================================
     CENTRALIZED FILTER + RENDER
  ======================================================== */

  function renderFilteredData() {

    try {

      console.log(
        "[UBnux] renderFilteredData START"
      );


      var filtered =
        applyCurrentFilters();


      console.log(
        "[UBnux] FILTERED COUNT:",
        Array.isArray(filtered)
          ? filtered.length
          : 0
      );


      resetBusinessPagination();


      var rendered =
        renderCurrentBusinessPage();


      if (
        typeof ZilaBiz.updateUI ===
        "function"
      ) {

        ZilaBiz.updateUI();

      }


      console.log(
        "[UBnux] BUSINESS PAGE RENDERED:",
        rendered
      );


      return true;

    } catch (
      error
    ) {

      console.error(
        "[UBnux] Filter/render error:",
        error
      );


      return false;

    }

  }


  /* =======================================================
     RENDER ALL DATA
  ======================================================== */

  function renderAllData() {

    try {

      if (
        ZilaBiz.district &&
        typeof ZilaBiz.district.refresh ===
        "function"
      ) {

        ZilaBiz.district.refresh();

      }


      if (
        ZilaBiz.categories &&
        typeof ZilaBiz.categories.refresh ===
        "function"
      ) {

        ZilaBiz.categories.refresh();

      }


      renderFilteredData();


      return true;

    } catch (
      error
    ) {

      console.error(
        "[UBnux] Render error:",
        error
      );


      return false;

    }

  }


  /* =======================================================
     CACHE LOAD
  ======================================================== */

  async function loadCachedData() {

    if (
      !ZilaBiz.api ||
      typeof ZilaBiz.api.getInitialDataFast !==
      "function"
    ) {

      console.warn(
        "[UBnux] getInitialDataFast() unavailable."
      );


      return {

        success:
          false,

        fromCache:
          false,

        stale:
          false,

        data:
          null

      };

    }


    try {

      console.log(
        "[UBnux] Checking cached data..."
      );


      var result =
        await withTimeout(
          ZilaBiz.api.getInitialDataFast(),
          API_TIMEOUT,
          "Cached data request"
        );


      if (
        !result ||
        !result.data
      ) {

        return {

          success:
            false,

          fromCache:
            false,

          stale:
            false,

          data:
            null

        };

      }


      var data =
        setInitialData(
          result.data
        );


      console.log(
        "[UBnux] Cached data received:",
        data
      );


      return {

        success:
          true,

        fromCache:
          result.fromCache ===
          true,

        stale:
          result.stale ===
          true,

        data:
          data,

        cache:
          result.cache ||
          null

      };

    } catch (
      error
    ) {

      console.warn(
        "[UBnux] Cache load failed:",
        error
      );


      return {

        success:
          false,

        fromCache:
          false,

        stale:
          false,

        data:
          null,

        error:
          error

      };

    }

  }


  /* =======================================================
     FETCH INITIAL DATA
  ======================================================== */

  async function fetchInitialData() {

    if (
      !ZilaBiz.api ||
      typeof ZilaBiz.api.getInitialData !==
      "function"
    ) {

      throw new Error(
        "API module available nahi hai."
      );

    }


    updateLoaderMessage(
      "Loading UBnux..."
    );


    console.log(
      "[UBnux] Requesting latest API data..."
    );


    var result =
      await withTimeout(
        ZilaBiz.api.getInitialData(),
        API_TIMEOUT,
        "Latest data request"
      );


    if (
      !result
    ) {

      throw new Error(
        "Server se initial data nahi mila."
      );

    }


    if (
      result.success ===
      false
    ) {

      throw new Error(
        result.message ||
        "Server ne initial data load nahi kiya."
      );

    }


    var data =
      setInitialData(
        result
      );


    console.log(
      "[UBnux] Latest API data received:",
      data
    );


    return {

      success:
        true,

      data:
        data,

      response:
        result

    };

  }


  /* =======================================================
     BACKGROUND REFRESH
  ======================================================== */

  async function backgroundRefresh() {

    if (
      !ZilaBiz.api ||
      typeof ZilaBiz.api.refreshInitialData !==
      "function"
    ) {

      return null;

    }


    try {

      console.log(
        "[UBnux] Background refresh started."
      );


      var result =
        await withTimeout(
          ZilaBiz.api.refreshInitialData(),
          API_TIMEOUT,
          "Background refresh"
        );


      if (
        !result
      ) {

        return null;

      }


      var data =
        setInitialData(
          result
        );


      renderAllData();


      console.log(
        "[UBnux] Background refresh completed."
      );


      return data;

    } catch (
      error
    ) {

      console.warn(
        "[UBnux] Background refresh failed:",
        error
      );


      return null;

    }

  }


  /* =======================================================
     PREFETCH
  ======================================================== */

  function prefetchData() {

    if (
      !ZilaBiz.api ||
      typeof ZilaBiz.api.prefetch !==
      "function"
    ) {

      return;

    }


    try {

      ZilaBiz.api.prefetch(
        "getDistricts"
      );


      ZilaBiz.api.prefetch(
        "getCategories"
      );

    } catch (
      error
    ) {

      console.warn(
        "[UBnux] Prefetch failed:",
        error
      );

    }

  }


  /* =======================================================
     INITIAL ERROR STATE
  ======================================================== */

  function showInitialErrorState(
    error
  ) {

    console.error(
      "[UBnux] Initial data error:",
      error
    );


    var message =
      getErrorMessage(
        error,
        "UBnux data load nahi ho saka."
      );


    var businessGrid =
      getElement(
        "businessGrid"
      );


    if (
      businessGrid
    ) {

      businessGrid.innerHTML =
        "";


      var errorBox =
        document.createElement(
          "div"
        );


      errorBox.className =
        "zilibiz-api-error";


      errorBox.setAttribute(
        "role",
        "alert"
      );


      errorBox.innerHTML =
        "<div class=\"api-error-icon\">⚠</div>" +
        "<h3>Data Load Failed</h3>" +
        "<p>" +
        escapeHTML(
          message
        ) +
        "</p>" +
        "<button type=\"button\" id=\"retryInitialDataButton\">" +
        "Retry" +
        "</button>";


      businessGrid.appendChild(
        errorBox
      );


      var retryButton =
        getElement(
          "retryInitialDataButton"
        );


      if (
        retryButton
      ) {

        retryButton.addEventListener(
          "click",
          function () {

            initializeApp(
              true
            );

          }
        );

      }

    }


    showToast(
      message,
      "error"
    );

  }


  /* =======================================================
     HANDLE INITIAL DATA ERROR
  ======================================================== */

  function handleInitialDataError(
    error
  ) {

    var state =
      typeof ZilaBiz.getState ===
      "function"
        ? ZilaBiz.getState()
        : null;


    var businesses =
      state &&
      Array.isArray(
        state.businesses
      )
        ? state.businesses
        : [];


    if (
      businesses.length
    ) {

      console.warn(
        "[UBnux] API failed, cached data retained.",
        error
      );


      renderAllData();


      showToast(
        "Latest data load nahi hua. Cached data dikhaya ja raha hai.",
        "info"
      );


      return;

    }


    showInitialErrorState(
      error
    );

  }


  /* =======================================================
     SEARCH INPUT
  ======================================================== */

  function handleSearchInput(
    event
  ) {

    var input =
      event &&
      event.target
        ? event.target
        : getElement(
            "searchInput"
          );


    if (
      !input
    ) {

      return;

    }


    var value =
      String(
        input.value ||
        ""
      );


    lastSearchValue =
      value;


    clearTimeout(
      searchTimer
    );


    searchTimer =
      setTimeout(
        function () {

          if (
            typeof ZilaBiz.setSearch ===
            "function"
          ) {

            ZilaBiz.setSearch(
              value.trim()
            );

          }


          renderFilteredData();

        },
        SEARCH_DEBOUNCE
      );

  }


  /* =======================================================
     CLEAR SEARCH
  ======================================================== */

  function clearSearch() {

    clearTimeout(
      searchTimer
    );


    var input =
      getElement(
        "searchInput"
      );


    if (
      input
    ) {

      input.value =
        "";

    }


    lastSearchValue =
      "";


    if (
      typeof ZilaBiz.setSearch ===
      "function"
    ) {

      ZilaBiz.setSearch(
        ""
      );

    }


    renderFilteredData();

  }


  /* =======================================================
     DISTRICT CHANGE
  ======================================================== */

  function handleDistrictChange(
    event
  ) {

    var select =
      event &&
      event.target
        ? event.target
        : getElement(
            "districtFilter"
          );


    if (
      !select
    ) {

      return;

    }


    var districtId =
      String(
        select.value ||
        ""
      ).trim();


    if (
      ZilaBiz.district &&
      typeof ZilaBiz.district.selectDistrict ===
      "function"
    ) {

      ZilaBiz.district.selectDistrict(
        districtId
      );

    } else if (
      typeof ZilaBiz.setSelectedDistrict ===
      "function"
    ) {

      ZilaBiz.setSelectedDistrict(
        districtId
      );

    }


    renderFilteredData();

  }


  /* =======================================================
     CATEGORY CHANGE
  ======================================================== */

  function handleCategoryChange(
    event
  ) {

    var select =
      event &&
      event.target
        ? event.target
        : getElement(
            "categoryFilter"
          );


    if (
      !select
    ) {

      return;

    }


    var categoryId =
      String(
        select.value ||
        ""
      ).trim();


    if (
      ZilaBiz.categories &&
      typeof ZilaBiz.categories.selectCategory ===
      "function"
    ) {

      ZilaBiz.categories.selectCategory(
        categoryId
      );

    } else if (
      typeof ZilaBiz.setSelectedCategory ===
      "function"
    ) {

      ZilaBiz.setSelectedCategory(
        categoryId
      );

    }


    renderFilteredData();

  }


  /* =======================================================
     SORT CHANGE
  ======================================================== */

  function handleSortChange(
    event
  ) {

    var select =
      event &&
      event.target
        ? event.target
        : getElement(
            "sortFilter"
          );


    if (
      !select
    ) {

      return;

    }


    var sort =
      String(
        select.value ||
        ""
      ).trim();


    if (
      typeof ZilaBiz.setSort ===
      "function"
    ) {

      ZilaBiz.setSort(
        sort
      );

    }


    renderFilteredData();

  }


  /* =======================================================
     RESET FILTERS
  ======================================================== */

  function resetAllFilters() {

    clearTimeout(
      searchTimer
    );


    var searchInput =
      getElement(
        "searchInput"
      );


    var districtFilter =
      getElement(
        "districtFilter"
      );


    var categoryFilter =
      getElement(
        "categoryFilter"
      );


    var sortFilter =
      getElement(
        "sortFilter"
      );


    if (
      searchInput
    ) {

      searchInput.value =
        "";

    }


    if (
      districtFilter
    ) {

      districtFilter.value =
        DEFAULT_DISTRICT;

    }


    if (
      categoryFilter
    ) {

      categoryFilter.value =
        DEFAULT_CATEGORY;

    }


    if (
      sortFilter
    ) {

      sortFilter.value =
        DEFAULT_SORT;

    }


    lastSearchValue =
      "";


    if (
      typeof ZilaBiz.resetFilters ===
      "function"
    ) {

      ZilaBiz.resetFilters();

    } else {

      if (
        typeof ZilaBiz.setSearch ===
        "function"
      ) {

        ZilaBiz.setSearch(
          ""
        );

      }


      if (
        typeof ZilaBiz.setSelectedDistrict ===
        "function"
      ) {

        ZilaBiz.setSelectedDistrict(
          DEFAULT_DISTRICT
        );

      }


      if (
        typeof ZilaBiz.setSelectedCategory ===
        "function"
      ) {

        ZilaBiz.setSelectedCategory(
          DEFAULT_CATEGORY
        );

      }


      if (
        typeof ZilaBiz.setSort ===
        "function"
      ) {

        ZilaBiz.setSort(
          DEFAULT_SORT
        );

      }

    }


    if (
      ZilaBiz.district &&
      typeof ZilaBiz.district.saveDistrict ===
      "function"
    ) {

      ZilaBiz.district.saveDistrict(
        DEFAULT_DISTRICT
      );

    }


    renderFilteredData();

  }


  /* =======================================================
     LOAD MORE
  ======================================================== */

  function handleLoadMore() {

    if (
      ZilaBiz.businesses &&
      typeof ZilaBiz.businesses.loadMore ===
      "function"
    ) {

      ZilaBiz.businesses.loadMore();

    }

  }


  /* =======================================================
     MOBILE MENU
  ======================================================== */

  function toggleMobileMenu() {

    var menu =
      getElement(
        "mobileMenu"
      );


    var button =
      getElement(
        "menuButton"
      );


    if (
      !menu
    ) {

      return;

    }


    var isOpen =
      menu.classList.toggle(
        "open"
      );


    if (
      button
    ) {

      button.setAttribute(
        "aria-expanded",
        isOpen
          ? "true"
          : "false"
      );

    }

  }


  /* =======================================================
     CTA / ADD BUSINESS
  ======================================================== */

  function handleAddBusiness() {

    if (
      typeof ZilaBiz.openBusinessRegistration ===
      "function"
    ) {

      ZilaBiz.openBusinessRegistration();


      return;

    }


    var button =
      getElement(
        "businessLoginButton"
      );


    if (
      button
    ) {

      button.click();


      return;

    }


    showToast(
      "Business registration system coming soon.",
      "info"
    );

  }


  /* =======================================================
     NAVIGATION
  ======================================================== */

  function handleNavigation(
    event
  ) {

    if (
      !event ||
      !event.target
    ) {

      return;

    }


    var link =
      event.target.closest(
        "a[href^=\"#\"]"
      );


    if (
      !link
    ) {

      return;

    }


    var href =
      link.getAttribute(
        "href"
      );


    if (
      !href ||
      href ===
      "#"
    ) {

      return;

    }


    var section =
      null;


    try {

      section =
        document.querySelector(
          href
        );

    } catch (
      error
    ) {

      console.warn(
        "[UBnux] Invalid navigation target:",
        href
      );


      return;

    }


    if (
      !section
    ) {

      return;

    }


    event.preventDefault();


    section.scrollIntoView(
      {

        behavior:
          "smooth",

        block:
          "start"

      }
    );


    var mobileMenu =
      getElement(
        "mobileMenu"
      );


    if (
      mobileMenu
    ) {

      mobileMenu.classList.remove(
        "open"
      );

    }


    var menuButton =
      getElement(
        "menuButton"
      );


    if (
      menuButton
    ) {

      menuButton.setAttribute(
        "aria-expanded",
        "false"
      );

    }

  }


  /* =======================================================
     NETWORK STATUS
  ======================================================== */

  function handleOnline() {

    showToast(
      "Internet connection restored.",
      "success"
    );


    if (
      startupCompleted &&
      !isInitializing
    ) {

      backgroundRefresh();

    }

  }


  function handleOffline() {

    showToast(
      "Internet connection lost. Cached data may still be available.",
      "info"
    );

  }


  /* =======================================================
     WINDOW RESIZE
  ======================================================== */

  function handleResize() {

    /*
     * Intentionally lightweight.
     */

  }


  /* =======================================================
     ESCAPE KEY
  ======================================================== */

  function handleEscape(
    event
  ) {

    if (
      !event ||
      event.key !==
      "Escape"
    ) {

      return;

    }


    if (
      ZilaBiz.modal &&
      typeof ZilaBiz.modal.closeAll ===
      "function"
    ) {

      ZilaBiz.modal.closeAll();

    }


    var modalIds = [

      "districtModal",

      "businessModal",

      "enquiryModal"

    ];


    for (
      var i = 0;
      i < modalIds.length;
      i++
    ) {

      var modal =
        getElement(
          modalIds[i]
        );


      if (
        modal &&
        modal.classList.contains(
          "open"
        )
      ) {

        modal.classList.remove(
          "open"
        );

      }

    }


    var mobileMenu =
      getElement(
        "mobileMenu"
      );


    var menuButton =
      getElement(
        "menuButton"
      );


    if (
      mobileMenu
    ) {

      mobileMenu.classList.remove(
        "open"
      );

    }


    if (
      menuButton
    ) {

      menuButton.setAttribute(
        "aria-expanded",
        "false"
      );

    }

  }


  /* =======================================================
     FOOTER YEAR
  ======================================================== */

  function updateFooterYear() {

    var yearElement =
      getElement(
        "currentYear"
      );


    if (
      !yearElement
    ) {

      return;

    }


    yearElement.textContent =
      new Date()
        .getFullYear();

  }


  /* =======================================================
     MODULE INITIALIZATION
  ======================================================== */

  function initializeModules() {

    try {

      if (
        ZilaBiz.businesses &&
        typeof ZilaBiz.businesses.init ===
        "function"
      ) {

        console.log(
          "[UBnux] Initializing businesses module..."
        );


        ZilaBiz.businesses.init();

      }


      if (
        ZilaBiz.categories &&
        typeof ZilaBiz.categories.init ===
        "function"
      ) {

        console.log(
          "[UBnux] Initializing categories module..."
        );


        ZilaBiz.categories.init();

      }


      if (
        ZilaBiz.district &&
        typeof ZilaBiz.district.init ===
        "function"
      ) {

        console.log(
          "[UBnux] Initializing district module..."
        );


        ZilaBiz.district.init();

      }


      if (
        ZilaBiz.modal &&
        typeof ZilaBiz.modal.init ===
        "function"
      ) {

        console.log(
          "[UBnux] Initializing modal module..."
        );


        ZilaBiz.modal.init();

      }


      return true;

    } catch (
      error
    ) {

      console.error(
        "[UBnux] Module initialization failed:",
        error
      );


      throw error;

    }

  }


  /* =======================================================
     EVENT SETUP
  ======================================================== */

  function setupAllEvents() {

    if (
      eventsBound
    ) {

      return;

    }


    eventsBound =
      true;


    /* =====================================================
       SEARCH
    ====================================================== */

    var searchInput =
      getElement(
        "searchInput"
      );


    if (
      searchInput
    ) {

      searchInput.addEventListener(
        "input",
        handleSearchInput
      );

    }


    var clearSearchButton =
      getElement(
        "clearSearchButton"
      );


    if (
      clearSearchButton
    ) {

      clearSearchButton.addEventListener(
        "click",
        clearSearch
      );

    }


    /* =====================================================
       DISTRICT
    ====================================================== */

    var districtFilter =
      getElement(
        "districtFilter"
      );


    if (
      districtFilter
    ) {

      districtFilter.addEventListener(
        "change",
        handleDistrictChange
      );

    }


    /* =====================================================
       CATEGORY
    ====================================================== */

    var categoryFilter =
      getElement(
        "categoryFilter"
      );


    if (
      categoryFilter
    ) {

      categoryFilter.addEventListener(
        "change",
        handleCategoryChange
      );

    }


    /* =====================================================
       SORT
    ====================================================== */

    var sortFilter =
      getElement(
        "sortFilter"
      );


    if (
      sortFilter
    ) {

      sortFilter.addEventListener(
        "change",
        handleSortChange
      );

    }


    /* =====================================================
       RESET
    ====================================================== */

    var resetFiltersButton =
      getElement(
        "resetFiltersButton"
      );


    if (
      resetFiltersButton
    ) {

      resetFiltersButton.addEventListener(
        "click",
        resetAllFilters
      );

    }


    /* =====================================================
       LOAD MORE
    ====================================================== */

    var loadMoreButton =
      getElement(
        "loadMoreButton"
      );


    if (
      loadMoreButton
    ) {

      loadMoreButton.addEventListener(
        "click",
        handleLoadMore
      );

    }


    /* =====================================================
       MOBILE MENU
    ====================================================== */

    var menuButton =
      getElement(
        "menuButton"
      );


    if (
      menuButton
    ) {

      menuButton.addEventListener(
        "click",
        toggleMobileMenu
      );

    }


    /* =====================================================
       ADD BUSINESS
    ====================================================== */

    var addBusinessButton =
      getElement(
        "addBusinessButton"
      );


    if (
      addBusinessButton
    ) {

      addBusinessButton.addEventListener(
        "click",
        handleAddBusiness
      );

    }


    /* =====================================================
       NAVIGATION
    ====================================================== */

    document.addEventListener(
      "click",
      handleNavigation
    );


    /* =====================================================
       NETWORK
    ====================================================== */

    window.addEventListener(
      "online",
      handleOnline
    );


    window.addEventListener(
      "offline",
      handleOffline
    );


    /* =====================================================
       RESIZE
    ====================================================== */

    window.addEventListener(
      "resize",
      handleResize
    );


    /* =====================================================
       ESCAPE
    ====================================================== */

    document.addEventListener(
      "keydown",
      handleEscape
    );


    /* =====================================================
       FOOTER
    ====================================================== */

    updateFooterYear();

  }


  /* =======================================================
     MINIMUM LOADER TIME
  ======================================================== */

  function waitMinimumLoaderTime() {

    var elapsed =
      Date.now() -
      startupStartedAt;


    var remaining =
      MINIMUM_LOADER_TIME -
      elapsed;


    if (
      remaining <=
      0
    ) {

      return Promise.resolve();

    }


    return new Promise(
      function (
        resolve
      ) {

        setTimeout(
          resolve,
          remaining
        );

      }
    );

  }


  /* =======================================================
     MARK APPLICATION INITIALIZED
  ======================================================== */

  function markInitialized() {

    startupCompleted =
      true;


    document.documentElement.classList.add(
      "zilibiz-ready"
    );


    if (
      document.body
    ) {

      document.body.classList.add(
        "zilibiz-app-ready"
      );

    }


    console.log(
      "[UBnux] Application initialized successfully."
    );

  }


  /* =======================================================
     MAIN APPLICATION INITIALIZATION
  ======================================================== */

  async function initializeApp(
    forceRefresh
  ) {

    forceRefresh =
      forceRefresh ===
      true;


    if (
      isInitializing
    ) {

      console.warn(
        "[UBnux] Initialization already running."
      );


      return false;

    }


    isInitializing =
      true;


    startupStartedAt =
      Date.now();


    startEmergencyLoaderProtection();


    showPageLoader(
      forceRefresh
        ? "Refreshing UBnux..."
        : "Loading UBnux..."
    );


    console.log(
      "======================================"
    );


    console.log(
      "[UBnux] APPLICATION START"
    );


    console.log(
      "[UBnux] Force refresh:",
      forceRefresh
    );


    console.log(
      "[UBnux] API timeout:",
      API_TIMEOUT
    );


    try {

      /* ===================================================
         BASIC INITIALIZATION
      ================================================== */

      updatePageTitle();


      initializeModules();


      setupAllEvents();


      /* ===================================================
         API CONFIGURATION
      ================================================== */

      var apiConfigured =
        checkAPIConfiguration();


      console.log(
        "[UBnux] API configured:",
        apiConfigured
      );


      /* ===================================================
         FORCE REFRESH
      ================================================== */

      if (
        forceRefresh
      ) {

        if (
          !apiConfigured
        ) {

          throw new Error(
            "Google Apps Script API URL configure nahi hai. Refresh ke liye API required hai."
          );

        }


        updateLoaderMessage(
          "Refreshing UBnux data..."
        );


        var refreshed =
          await fetchInitialData();


        if (
          refreshed &&
          refreshed.data
        ) {

          renderAllData();

        }


        markInitialized();


        return true;

      }


      /* ===================================================
         CACHE FIRST
      ================================================== */

      var cacheResult =
        null;


      updateLoaderMessage(
        "Checking saved data..."
      );


      console.log(
        "[UBnux] STEP 1: Checking cache..."
      );


      cacheResult =
        await loadCachedData();


      console.log(
        "[UBnux] Cache result:",
        cacheResult
      );


      /* ===================================================
         RENDER CACHE
      ================================================== */

      if (
        cacheResult &&
        cacheResult.success &&
        cacheResult.data
      ) {

        console.log(
          "[UBnux] STEP 2: Rendering cached data..."
        );


        renderAllData();


        updateLoaderMessage(
          "Updating latest data..."
        );

      }


      /* ===================================================
         API NOT CONFIGURED
      ================================================== */

      if (
        !apiConfigured
      ) {

        var currentState =
          typeof ZilaBiz.getState ===
          "function"
            ? ZilaBiz.getState()
            : null;


        var hasCachedBusinesses =
          currentState &&
          Array.isArray(
            currentState.businesses
          ) &&
          currentState.businesses.length >
          0;


        if (
          hasCachedBusinesses
        ) {

          markInitialized();


          updateLoaderMessage(
            "Using saved data..."
          );


          console.warn(
            "[UBnux] API URL unavailable. Saved data is being used."
          );


          showToast(
            "API configure nahi hai. Saved data use ho raha hai.",
            "info"
          );


          return true;

        }


        throw new Error(
          "Google Apps Script API URL configure nahi hai aur koi saved data available nahi hai."
        );

      }


      /* ===================================================
         FETCH LATEST API DATA
      ================================================== */

      updateLoaderMessage(
        cacheResult &&
        cacheResult.success
          ? "Loading latest data..."
          : "Loading UBnux data..."
      );


      console.log(
        "[UBnux] STEP 3: Loading latest API data..."
      );


      var apiResult =
        await fetchInitialData();


      /* ===================================================
         RENDER FRESH DATA
      ================================================== */

      if (
        apiResult &&
        apiResult.data
      ) {

        console.log(
          "[UBnux] STEP 4: Rendering latest data..."
        );


        renderAllData();

      }


      /* ===================================================
         MARK INITIALIZED
      ================================================== */

      markInitialized();


      /* ===================================================
         PREFETCH
      ================================================== */

      try {

        prefetchData();

      } catch (
        prefetchError
      ) {

        console.warn(
          "[UBnux] Background prefetch failed:",
          prefetchError
        );

      }


      console.log(
        "[UBnux] APPLICATION STARTUP COMPLETE"
      );


      return true;


    } catch (
      error
    ) {

      console.error(
        "[UBnux] Initialization error:",
        error
      );


      /* ===================================================
         FALLBACK TO EXISTING DATA
      ================================================== */

      var fallbackState =
        typeof ZilaBiz.getState ===
        "function"
          ? ZilaBiz.getState()
          : null;


      var hasFallbackBusinesses =
        fallbackState &&
        Array.isArray(
          fallbackState.businesses
        ) &&
        fallbackState.businesses.length >
        0;


      if (
        hasFallbackBusinesses
      ) {

        console.warn(
          "[UBnux] Falling back to existing data."
        );


        renderAllData();


        markInitialized();


        showToast(
          "Latest data load nahi ho saka. Saved data use ho raha hai.",
          "info"
        );


        return false;

      }


      handleInitialDataError(
        error
      );


      return false;


    } finally {

      /*
       * IMPORTANT:
       *
       * No matter whether startup succeeds,
       * fails, or times out, loader is hidden here.
       */

      try {

        await waitMinimumLoaderTime();

      } catch (
        loaderError
      ) {

        console.warn(
          "[UBnux] Minimum loader timer error:",
          loaderError
        );

      }


      hidePageLoader();


      stopEmergencyLoaderProtection();


      isInitializing =
        false;


      console.log(
        "[UBnux] Loader hidden."
      );


      console.log(
        "======================================"
      );

    }

  }


  /* =======================================================
     PUBLIC APPLICATION API
  ======================================================== */

  ZilaBiz.app = {

    initialize:
      initializeApp,


    initializeApp:
      initializeApp,


    refresh:
      function () {

        return initializeApp(
          true
        );

      },


    backgroundRefresh:
      backgroundRefresh,


    prefetch:
      prefetchData,


    render:
      renderAllData,


    renderFiltered:
      renderFilteredData,


    applyFilters:
      applyCurrentFilters,


    clearSearch:
      clearSearch,


    resetFilters:
      resetAllFilters,


    showToast:
      showToast,


    showLoader:
      showPageLoader,


    hideLoader:
      hidePageLoader,


    getApiUrl:
      getConfiguredAPIUrl,


    isApiConfigured:
      checkAPIConfiguration,


    getState:
      function () {

        if (
          typeof ZilaBiz.getState ===
          "function"
        ) {

          return ZilaBiz.getState();

        }


        return null;

      },


    isInitialized:
      function () {

        return startupCompleted;

      },


    isInitializing:
      function () {

        return isInitializing;

      }

  };


  /* =======================================================
     OPTIONAL COMPATIBILITY ALIASES
  ======================================================== */

  if (
    typeof ZilaBiz.applyFilters !==
    "function"
  ) {

    ZilaBiz.applyFilters =
      applyCurrentFilters;

  }


  /* =======================================================
     DOM READY BOOT
  ======================================================== */

  function boot() {

    console.log(
      "[UBnux] DOM ready. Starting application..."
    );


    initializeApp(
      false
    );

  }


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


})();
