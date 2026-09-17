/* =========================================================
   UBNux
   Frontend Configuration
   File: assets/js/config.js

   IMPORTANT:
   ---------------------------------------------------------
   Sirf UBNux_CONFIG.API_URL me apne Google Apps Script
   Web App ka /exec URL configure karein.

   Example:
   https://script.google.com/macros/s/XXXXXXXXXXXX/exec

   NOTE:
   ---------------------------------------------------------
   Backward compatibility ke liye:
   window.ZILABIZ_CONFIG
   aur
   window.ZilaBizConfig

   bhi available rahenge.
========================================================= */

(function () {

  "use strict";


  /* =======================================================
     GLOBAL CONFIG OBJECT
  ====================================================== */

  var config = {

    /* -----------------------------------------------------
       APP INFORMATION
    ------------------------------------------------------ */

    APP_NAME:
      "UBnux",

    APP_TAGLINE:
      "You & Business, Next.",

    APP_VERSION:
      "2.0.0",

    BRAND_NAME:
      "UBnux",

    BRAND_SHORT_NAME:
      "UB",


    /* -----------------------------------------------------
       WEBSITE
    ------------------------------------------------------ */

    SITE_NAME:
      "UBnux",

    SITE_URL:
      "https://ubnux.com/",

    SITE_LANGUAGE:
      "en-IN",

    SITE_COUNTRY:
      "IN",


    /* -----------------------------------------------------
       GOOGLE APPS SCRIPT API
    ------------------------------------------------------ */

    API_URL:
      "https://script.google.com/macros/s/AKfycbztutJtJG12CaENibP2XpSg9Mx_N4LFQWTm1R-U9ePTjqhHlhPEjv-UzBxUGSe5yBh-/exec",


    /* -----------------------------------------------------
       ENVIRONMENT
    ------------------------------------------------------ */

    ENVIRONMENT:
      "production",


    /* -----------------------------------------------------
       LOCAL STORAGE
    ------------------------------------------------------ */

    STORAGE_PREFIX:
      "ubnux_",

    STORAGE_VERSION:
      "v2",


    /* -----------------------------------------------------
       LEGACY STORAGE PREFIX
    ------------------------------------------------------ */

    LEGACY_STORAGE_PREFIX:
      "zilabiz_",


    /* -----------------------------------------------------
       CACHE SETTINGS
       15 minutes
    ------------------------------------------------------ */

    CACHE_TTL:
      15 * 60 * 1000,


    /* -----------------------------------------------------
       INITIAL DATA CACHE
    ------------------------------------------------------ */

    INITIAL_DATA_CACHE_KEY:
      "initial_data",


    /* -----------------------------------------------------
       DISTRICT CACHE
    ------------------------------------------------------ */

    DISTRICT_CACHE_KEY:
      "districts",


    /* -----------------------------------------------------
       CATEGORY CACHE
    ------------------------------------------------------ */

    CATEGORY_CACHE_KEY:
      "categories",


    /* -----------------------------------------------------
       BUSINESS CACHE
    ------------------------------------------------------ */

    BUSINESS_CACHE_KEY:
      "businesses",


    /* -----------------------------------------------------
       PRODUCT CACHE
    ------------------------------------------------------ */

    PRODUCT_CACHE_KEY:
      "products",


    /* -----------------------------------------------------
       SERVICE CACHE
    ------------------------------------------------------ */

    SERVICE_CACHE_KEY:
      "services",


    /* -----------------------------------------------------
       USER DISTRICT
    ------------------------------------------------------ */

    DISTRICT_STORAGE_KEY:
      "selected_district",


    /* -----------------------------------------------------
       USER CATEGORY
    ------------------------------------------------------ */

    CATEGORY_STORAGE_KEY:
      "selected_category",


    /* -----------------------------------------------------
       SEARCH SETTINGS
    ------------------------------------------------------ */

    SEARCH_MIN_LENGTH:
      0,

    SEARCH_DEBOUNCE:
      50,


    /* -----------------------------------------------------
       CLIENT-SIDE PAGINATION
    ------------------------------------------------------ */

    BUSINESS_PAGE_SIZE:
      18,

    INITIAL_BUSINESS_LIMIT:
      18,

    MAX_CLIENT_BUSINESS_RENDER:
      1000,


    /* -----------------------------------------------------
       API SETTINGS

       IMPORTANT:
       Google Apps Script cold-start / redirect / response
       ke liye 60 seconds ka timeout rakha gaya hai.
    ------------------------------------------------------ */

    API_TIMEOUT:
      60000,

    API_RETRY_COUNT:
      1,

    API_RETRY_DELAY:
      1000,

    /*
     * api.js compatibility
     */
    API_RETRIES:
      1,

    RETRY_DELAY:
      1000,


    /* -----------------------------------------------------
       API CACHE BEHAVIOUR
    ------------------------------------------------------ */

    USE_CACHE:
      true,

    BACKGROUND_REFRESH:
      true,

    CACHE_FIRST:
      true,


    /* -----------------------------------------------------
       SEARCH FIELDS
    ------------------------------------------------------ */

    SEARCH_FIELDS: [

      "BusinessID",

      "BusinessName",

      "CategoryID",

      "CategoryName",

      "Category",

      "DistrictID",

      "DistrictName",

      "Area",

      "Address",

      "Pincode",

      "Description",

      "ShortDescription",

      "OwnerName",

      "Mobile",

      "WhatsApp",

      "Email",

      "PrimaryService",

      "Products",

      "Services"

    ],


    /* -----------------------------------------------------
       SORT OPTIONS
    ------------------------------------------------------ */

    DEFAULT_SORT:
      "featured",


    /* -----------------------------------------------------
       DEFAULT FILTERS
    ------------------------------------------------------ */

    DEFAULT_DISTRICT:
      "ALL",

    DEFAULT_CATEGORY:
      "ALL",


    /* -----------------------------------------------------
       BUSINESS STATUS
    ------------------------------------------------------ */

    ACTIVE_BUSINESS_STATUS:
      "Active",


    /* -----------------------------------------------------
       VERIFIED / FEATURED SETTINGS
    ------------------------------------------------------ */

    VERIFIED_ONLY:
      false,

    FEATURED_FIRST:
      true,


    /* -----------------------------------------------------
       FALLBACK IMAGE
    ------------------------------------------------------ */

    FALLBACK_IMAGE:
      "https://placehold.co/800x450?text=UBnux",


    /* -----------------------------------------------------
       FALLBACK LOGO
    ------------------------------------------------------ */

    FALLBACK_LOGO:
      "https://placehold.co/200x200?text=UB",


    /* -----------------------------------------------------
       CATEGORY FALLBACK ICON
    ------------------------------------------------------ */

    DEFAULT_CATEGORY_ICON:
      "🏪",


    /* -----------------------------------------------------
       UI SETTINGS
    ------------------------------------------------------ */

    TOAST_DURATION:
      3000,


    /* -----------------------------------------------------
       LOADING SETTINGS
    ------------------------------------------------------ */

    MINIMUM_LOADER_TIME:
      350,


    /* -----------------------------------------------------
       LOCATION SETTINGS
    ------------------------------------------------------ */

    LOCATION_ENABLED:
      true,

    LOCATION_TIMEOUT:
      10000,

    LOCATION_MAXIMUM_AGE:
      300000,


    /* -----------------------------------------------------
       MODAL SETTINGS
    ------------------------------------------------------ */

    CLOSE_MODAL_ON_OVERLAY:
      true,

    CLOSE_MODAL_ON_ESCAPE:
      true,


    /* -----------------------------------------------------
       SECURITY / FRONTEND FLAGS
    ------------------------------------------------------ */

    REQUIRE_API:
      true,


    /* -----------------------------------------------------
       API ERROR HANDLING
    ------------------------------------------------------ */

    SHOW_API_ERRORS:
      true,

    RETRY_ON_NETWORK_ERROR:
      true,


    /* -----------------------------------------------------
       DEBUG
    ------------------------------------------------------ */

    DEBUG:
      false

  };


  /* =======================================================
     GLOBAL CONFIG
  ====================================================== */

  window.UBNux_CONFIG =
    config;


  /* =======================================================
     BACKWARD COMPATIBILITY
  ====================================================== */

  window.ZILABIZ_CONFIG =
    config;


  /* =======================================================
     CONFIG VALIDATION
  ====================================================== */

  function validateConfig() {

    var currentConfig =
      window.UBNux_CONFIG;


    if (!currentConfig) {

      console.error(
        "UBnux configuration not found."
      );

      return false;

    }


    if (
      !currentConfig.API_URL ||
      currentConfig.API_URL.trim() === "" ||
      currentConfig.API_URL ===
        "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"
    ) {

      console.warn(
        "UBnux API URL is not configured."
      );

      return false;

    }


    try {

      var apiURL =
        new URL(
          currentConfig.API_URL
        );


      if (
        apiURL.protocol !==
        "https:"
      ) {

        console.warn(
          "UBnux API should use HTTPS."
        );

      }

    } catch (error) {

      console.error(
        "Invalid UBnux API URL.",
        error
      );

      return false;

    }


    return true;

  }


  /* =======================================================
     VALUE GETTER
  ====================================================== */

  function getConfigValue(
    key,
    fallback
  ) {

    var currentConfig =
      window.UBNux_CONFIG;


    if (
      currentConfig &&
      Object.prototype.hasOwnProperty.call(
        currentConfig,
        key
      )
    ) {

      return currentConfig[key];

    }


    return fallback;

  }


  /* =======================================================
     API URL GETTER
  ====================================================== */

  function getAPIUrl() {

    return getConfigValue(
      "API_URL",
      ""
    );

  }


  /* =======================================================
     SITE URL GETTER
  ====================================================== */

  function getSiteUrl() {

    return String(
      getConfigValue(
        "SITE_URL",
        "https://ubnux.com/"
      )
    ).replace(
      /\/+$/,
      ""
    );

  }


  /* =======================================================
     STORAGE KEY BUILDER
  ====================================================== */

  function storageKey(
    key
  ) {

    return (

      String(
        getConfigValue(
          "STORAGE_PREFIX",
          "ubnux_"
        )
      ) +

      String(
        getConfigValue(
          "STORAGE_VERSION",
          "v2"
        )
      ) +

      "_" +

      String(key)

    );

  }


  /* =======================================================
     LEGACY STORAGE KEY BUILDER
  ====================================================== */

  function legacyStorageKey(
    key
  ) {

    return (

      String(
        getConfigValue(
          "LEGACY_STORAGE_PREFIX",
          "zilabiz_"
        )
      ) +

      "v1_" +

      String(key)

    );

  }


  /* =======================================================
     DEBUG LOGGER
  ====================================================== */

  function debugLog() {

    if (
      window.UBNux_CONFIG.DEBUG !== true
    ) {

      return;

    }


    var args =
      Array.prototype.slice.call(
        arguments
      );


    args.unshift(
      "[UBnux]"
    );


    console.log.apply(
      console,
      args
    );

  }


  /* =======================================================
     WARNING LOGGER
  ====================================================== */

  function debugWarn() {

    if (
      window.UBNux_CONFIG.DEBUG !== true
    ) {

      return;

    }


    var args =
      Array.prototype.slice.call(
        arguments
      );


    args.unshift(
      "[UBnux Warning]"
    );


    console.warn.apply(
      console,
      args
    );

  }


  /* =======================================================
     ERROR LOGGER
  ====================================================== */

  function debugError() {

    var args =
      Array.prototype.slice.call(
        arguments
      );


    args.unshift(
      "[UBnux Error]"
    );


    console.error.apply(
      console,
      args
    );

  }


  /* =======================================================
     PUBLIC UBNux CONFIG API
  ====================================================== */

  window.UBnuxConfig = {

    get:
      function (key) {

        return getConfigValue(
          key,
          undefined
        );

      },


    getOr:
      function (
        key,
        fallback
      ) {

        return getConfigValue(
          key,
          fallback
        );

      },


    getAPIUrl:
      function () {

        return getAPIUrl();

      },


    getSiteUrl:
      function () {

        return getSiteUrl();

      },


    storageKey:
      function (key) {

        return storageKey(
          key
        );

      },


    legacyStorageKey:
      function (key) {

        return legacyStorageKey(
          key
        );

      },


    isApiConfigured:
      function () {

        return validateConfig();

      },


    isProduction:
      function () {

        return (
          getConfigValue(
            "ENVIRONMENT",
            "production"
          ) ===
          "production"
        );

      },


    isDevelopment:
      function () {

        return (
          getConfigValue(
            "ENVIRONMENT",
            "production"
          ) ===
          "development"
        );

      },


    log:
      function () {

        debugLog.apply(
          null,
          arguments
        );

      },


    warn:
      function () {

        debugWarn.apply(
          null,
          arguments
        );

      },


    error:
      function () {

        debugError.apply(
          null,
          arguments
        );

      }

  };


  /* =======================================================
     LEGACY ZILABIZ CONFIG HELPER
  ====================================================== */

  window.ZilaBizConfig = {

    get:
      function (key) {

        return getConfigValue(
          key,
          undefined
        );

      },


    isApiConfigured:
      function () {

        return validateConfig();

      },


    log:
      function () {

        debugLog.apply(
          null,
          arguments
        );

      },


    warn:
      function () {

        debugWarn.apply(
          null,
          arguments
        );

      },


    error:
      function () {

        debugError.apply(
          null,
          arguments
        );

      }

  };


  /* =======================================================
     OPTIONAL GLOBAL ALIAS
  ====================================================== */

  window.UBNUX =
    window.UBNUX ||
    {};


  window.UBNUX.CONFIG =
    window.UBNux_CONFIG;


  /* =======================================================
     FREEZE CONFIG
  ====================================================== */

  try {

    Object.freeze(
      window.UBNux_CONFIG
    );

  } catch (error) {

    console.warn(
      "UBnux config could not be frozen.",
      error
    );

  }


  /* =======================================================
     INITIAL CONFIG CHECK
  ====================================================== */

  if (
    window.UBNux_CONFIG.DEBUG === true
  ) {

    console.log(
      "[UBnux] Configuration loaded.",
      {

        app:
          window.UBNux_CONFIG.APP_NAME,

        version:
          window.UBNux_CONFIG.APP_VERSION,

        environment:
          window.UBNux_CONFIG.ENVIRONMENT,

        site:
          window.UBNux_CONFIG.SITE_URL,

        apiConfigured:
          validateConfig(),

        apiTimeout:
          window.UBNux_CONFIG.API_TIMEOUT,

        apiRetries:
          window.UBNux_CONFIG.API_RETRIES

      }
    );

  }


})();
