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
     GLOBAL COMPATIBILITY ALIASES
  ======================================================== */

  /*
   * Other modules can directly call:
   *
   * UBnux.applyFilters()
   * UBnux.renderAllData()
   * UBnux.initializeApp()
   * UBnux.showToast()
   */

  ZilaBiz.applyFilters =
    applyCurrentFilters;


  ZilaBiz.renderAllData =
    renderAllData;


  ZilaBiz.renderFilteredData =
    renderFilteredData;


  ZilaBiz.initializeApp =
    initializeApp;


  ZilaBiz.showToast =
    showToast;


  ZilaBiz.showPageLoader =
    showPageLoader;


  ZilaBiz.hidePageLoader =
    hidePageLoader;


  /* =======================================================
     GLOBAL SEARCH API
  ======================================================== */

  ZilaBiz.clearSearch =
    clearSearch;


  ZilaBiz.setSearch =
    ZilaBiz.setSearch ||
    function (value) {

      if (
        typeof value ===
        "undefined"
      ) {

        value = "";

      }

      value =
        String(
          value
        ).trim();


      var input =
        getElement(
          "searchInput"
        );


      if (
        input &&
        input.value !==
        value
      ) {

        input.value =
          value;

      }


      if (
        typeof ZilaBiz.setState ===
        "function"
      ) {

        ZilaBiz.setState(
          "search",
          value
        );

      }


      lastSearchValue =
        value;

    };


  /* =======================================================
     GLOBAL FILTER API
  ======================================================== */

  ZilaBiz.resetAllFilters =
    resetAllFilters;


  ZilaBiz.renderCurrentBusinessPage =
    renderCurrentBusinessPage;


  /* =======================================================
     GLOBAL LOADER STATE
  ======================================================== */

  ZilaBiz.isLoading =
    function () {

      return isInitializing;

    };


  ZilaBiz.isReady =
    function () {

      return startupCompleted;

    };


  /* =======================================================
     GLOBAL REFRESH API
  ======================================================== */

  ZilaBiz.refreshData =
    function () {

      return initializeApp(
        true
      );

    };


  ZilaBiz.refresh =
    ZilaBiz.refreshData;


  /* =======================================================
     GLOBAL BACKGROUND REFRESH
  ======================================================== */

  ZilaBiz.refreshInBackground =
    function () {

      if (
        isInitializing
      ) {

        return Promise.resolve(
          false
        );

      }

      return backgroundRefresh();

    };


  /* =======================================================
     RETRY API
  ======================================================== */

  ZilaBiz.retry =
    function () {

      return initializeApp(
        true
      );

    };


  /* =======================================================
     DEBUG / DIAGNOSTIC API
  ======================================================== */

  ZilaBiz.debug =
    function () {

      var state =
        typeof ZilaBiz.getState ===
        "function"
          ? ZilaBiz.getState()
          : null;


      var diagnostics = {

        initialized:
          startupCompleted,

        initializing:
          isInitializing,

        startupStartedAt:
          startupStartedAt,

        apiConfigured:
          checkAPIConfiguration(),

        apiUrl:
          getConfiguredAPIUrl(),

        state:
          state,

        businesses:
          state &&
          Array.isArray(
            state.businesses
          )
            ? state.businesses.length
            : 0,

        filteredBusinesses:
          state &&
          Array.isArray(
            state.filteredBusinesses
          )
            ? state.filteredBusinesses.length
            : 0,

        districts:
          state &&
          Array.isArray(
            state.districts
          )
            ? state.districts.length
            : 0,

        categories:
          state &&
          Array.isArray(
            state.categories
          )
            ? state.categories.length
            : 0

      };


      console.table(
        diagnostics
      );


      return diagnostics;

    };


  /* =======================================================
     ERROR RECOVERY
  ======================================================== */

  ZilaBiz.recover =
    function () {

      try {

        hidePageLoader();

        stopEmergencyLoaderProtection();

        isInitializing =
          false;


        var state =
          typeof ZilaBiz.getState ===
          "function"
            ? ZilaBiz.getState()
            : null;


        if (
          state &&
          Array.isArray(
            state.businesses
          ) &&
          state.businesses.length
        ) {

          renderAllData();

          startupCompleted =
            true;


          return true;

        }


        return false;

      } catch (
        error
      ) {

        console.error(
          "[UBnux] Recovery failed:",
          error
        );


        return false;

      }

    };


  /* =======================================================
     BEFORE UNLOAD
  ======================================================== */

  window.addEventListener(
    "beforeunload",
    function () {

      clearTimeout(
        searchTimer
      );

      clearTimeout(
        emergencyLoaderTimer
      );

    }
  );


  /* =======================================================
     VISIBILITY CHANGE
  ======================================================== */

  document.addEventListener(
    "visibilitychange",
    function () {

      /*
       * Jab user tab par wapas aaye,
       * unnecessarily API request nahi karni.
       *
       * Sirf agar app already initialized hai
       * aur network available hai tab optional
       * background refresh trigger kiya ja sakta hai.
       */

      if (
        document.visibilityState !==
        "visible"
      ) {

        return;

      }


      if (
        !startupCompleted ||
        isInitializing
      ) {

        return;

      }


      if (
        !navigator.onLine
      ) {

        return;

      }

    }
  );


  /* =======================================================
     GLOBAL ERROR PROTECTION
  ======================================================== */

  window.addEventListener(
    "error",
    function (event) {

      if (
        !event
      ) {

        return;

      }


      console.error(
        "[UBnux] Global JavaScript error:",
        event.error ||
        event.message
      );


      /*
       * Agar startup ke time error hua
       * aur loader visible hai to emergency
       * protection par depend karne ke bajay
       * loader ko safely release karo.
       */

      if (
        isInitializing
      ) {

        var message =
          event.message ||
          "Application error occurred.";


        updateLoaderMessage(
          "Application error. Please retry."
        );


        setTimeout(
          function () {

            if (
              isInitializing
            ) {

              hidePageLoader();

            }

          },
          100
        );


        console.error(
          "[UBnux] Startup error:",
          message
        );

      }

    }
  );


  /* =======================================================
     UNHANDLED PROMISE PROTECTION
  ======================================================== */

  window.addEventListener(
    "unhandledrejection",
    function (event) {

      if (
        !event
      ) {

        return;

      }


      console.error(
        "[UBnux] Unhandled promise rejection:",
        event.reason
      );


      /*
       * Startup promise reject hone par
       * loader ko permanently stuck hone se bachana.
       */

      if (
        isInitializing
      ) {

        updateLoaderMessage(
          "Please wait..."
        );

      }

    }
  );


  /* =======================================================
     INITIAL STATE SYNC
  ======================================================== */

  function syncInitialControls() {

    var state =
      typeof ZilaBiz.getState ===
      "function"
        ? ZilaBiz.getState()
        : null;


    if (
      !state
    ) {

      return;

    }


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
      searchInput &&
      typeof state.search ===
      "string"
    ) {

      searchInput.value =
        state.search;

    }


    var districtValue =
      state.selectedDistrict ||
      state.district ||
      DEFAULT_DISTRICT;


    if (
      districtFilter
    ) {

      districtFilter.value =
        String(
          districtValue
        );

    }


    var categoryValue =
      state.selectedCategory ||
      state.category ||
      DEFAULT_CATEGORY;


    if (
      categoryFilter
    ) {

      categoryFilter.value =
        String(
          categoryValue
        );

    }


    if (
      sortFilter
    ) {

      sortFilter.value =
        state.sort ||
        DEFAULT_SORT;

    }


    lastSearchValue =
      state.search ||
      "";

  }


  /* =======================================================
     SAFE INITIAL CONTROL SYNC
  ======================================================== */

  try {

    syncInitialControls();

  } catch (
    error
  ) {

    console.warn(
      "[UBnux] Initial control sync failed:",
      error
    );

  }


  /* =======================================================
     APPLICATION OBJECT READY
  ======================================================== */

  console.log(
    "[UBnux] Application controller loaded."
  );


  console.log(
    "[UBnux] API:",
    getConfiguredAPIUrl() ||
    "Not configured"
  );


  console.log(
    "[UBnux] Page size:",
    DEFAULT_PAGE_SIZE
  );


  console.log(
    "[UBnux] Search debounce:",
    SEARCH_DEBOUNCE,
    "ms"
  );


  /* =======================================================
     DOM READY BOOT
  ======================================================== */

  function boot() {

    console.log(
      "[UBnux] DOM ready. Starting application..."
    );


    /*
     * Small delay allows all JS modules
     * and dynamically registered listeners
     * to finish loading before startup.
     */

    setTimeout(
      function () {

        initializeApp(
          false
        );

      },
      0
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
