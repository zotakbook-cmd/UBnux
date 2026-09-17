/* =========================================================
   UBnux - API Manager
   File: assets/js/api.js

   Responsibilities:
   - Google Apps Script API communication
   - Stable API URL resolution
   - Reject stale googleusercontent echo URLs
   - Initial data loading
   - Safe timeout handling
   - Smart retry handling
   - Safe JSON parsing
   - Cache integration
   - Enquiry submission
   - District/location detection
   - Duplicate request prevention
   - Compatibility aliases
   - Business API compatibility
   ========================================================= */

(function (window, document) {

  "use strict";


  /* =======================================================
     SHARED APPLICATION NAMESPACE
  ====================================================== */

  window.UBnux =
    window.ZilaBiz ||
    window.UBnux ||
    {};

  window.ZilaBiz =
    window.UBnux;

  var App =
    window.UBnux;


  /* =======================================================
     CONFIGURATION
  ====================================================== */

  var CONFIG =
    window.UBNux_CONFIG ||
    window.ZILABIZ_CONFIG ||
    {};


  /* =======================================================
     CONSTANTS
  ====================================================== */

  var DEFAULT_PAGE_SIZE =
    Math.max(
      1,
      Number(
        CONFIG.BUSINESS_PAGE_SIZE ||
        CONFIG.businessPageSize ||
        18
      )
    );


  /*
   * Default timeout is intentionally shorter than the old
   * 60000 ms value.
   *
   * A permanent 404 should never make the application wait
   * for one minute.
   *
   * It can still be overridden from config.js.
   */

  var API_TIMEOUT =
    Math.max(
      5000,
      Number(
        CONFIG.API_TIMEOUT ||
        CONFIG.apiTimeout ||
        15000
      )
    );


  var API_RETRIES =
    Math.max(
      0,
      Number(
        CONFIG.API_RETRIES ??
        CONFIG.RETRIES ??
        1
      )
    );


  var RETRY_DELAY =
    Math.max(
      100,
      Number(
        CONFIG.RETRY_DELAY ||
        1000
      )
    );


  var REQUIRE_API =
    CONFIG.REQUIRE_API !== false;


  /* =======================================================
     REQUEST STATE
  ====================================================== */

  var initialDataPromise =
    null;


  var districtsPromise =
    null;


  var categoriesPromise =
    null;


  var businessPromises =
    {};


  var lastInitialData =
    null;


  var lastDistricts =
    null;


  var lastCategories =
    null;


  /* =======================================================
     API URL STATE
  ====================================================== */

  var API_URL =
    "";


  var API_URL_SOURCE =
    "";


  /* =======================================================
     SAFE STRING
  ====================================================== */

  function getSafeString(
    value
  ) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }


    return String(
      value
    ).trim();

  }


  /* =======================================================
     SLEEP
  ====================================================== */

  function sleep(
    milliseconds
  ) {

    return new Promise(
      function (resolve) {

        setTimeout(
          resolve,
          milliseconds
        );

      }
    );

  }


  /* =======================================================
     ERROR MESSAGE
  ====================================================== */

  function getErrorMessage(
    error
  ) {

    if (!error) {

      return (
        "Unknown API error."
      );

    }


    if (
      typeof error ===
      "string"
    ) {

      return error;

    }


    if (
      error.isTimeout ||
      error.name ===
      "AbortError"
    ) {

      return (
        "UBnux API request timed out. " +
        "Please try again."
      );

    }


    if (
      error.status
    ) {

      return (
        "API request failed (" +
        error.status +
        "). " +
        (
          error.message ||
          "Please try again."
        )
      );

    }


    if (
      error.message
    ) {

      return String(
        error.message
      );

    }


    return (
      "Unable to communicate " +
      "with the UBnux server."
    );

  }


  /* =======================================================
     CREATE TIMEOUT ERROR
  ====================================================== */

  function createTimeoutError() {

    var error =
      new Error(
        "UBnux API request timed out after " +
        API_TIMEOUT +
        " ms."
      );


    error.name =
      "UBnuxTimeoutError";


    error.isTimeout =
      true;


    return error;

  }


  /* =======================================================
     URL HELPERS
  ====================================================== */

  function normalizeURL(
    value
  ) {

    value =
      getSafeString(
        value
      );


    if (!value) {

      return "";

    }


    /*
     * Remove accidental surrounding quotes.
     */

    if (
      (
        value.startsWith("\"") &&
        value.endsWith("\"")
      ) ||
      (
        value.startsWith("'") &&
        value.endsWith("'")
      )
    ) {

      value =
        value.slice(
          1,
          -1
        ).trim();

    }


    return value;

  }


  /* =======================================================
     DETECT STALE GOOGLE USERCONTENT URL
  ====================================================== */

  function isStaleGoogleUserContentURL(
    value
  ) {

    value =
      normalizeURL(
        value
      );


    if (!value) {

      return false;

    }


    try {

      var url =
        new URL(
          value
        );


      var hostname =
        String(
          url.hostname
        ).toLowerCase();


      var pathname =
        String(
          url.pathname
        ).toLowerCase();


      /*
       * Google Apps Script frequently redirects a stable
       * /exec URL to a temporary googleusercontent endpoint.
       *
       * That redirected URL should NOT be stored as the
       * permanent API URL.
       */

      if (
        hostname ===
          "script.googleusercontent.com" &&
        pathname.indexOf(
          "/macros/echo"
        ) === 0
      ) {

        return true;

      }

    } catch (error) {

      return false;

    }


    return false;

  }


  /* =======================================================
     VALID API URL
  ====================================================== */

  function isValidAPIURL(
    value
  ) {

    value =
      normalizeURL(
        value ||
        API_URL
      );


    if (!value) {

      return false;

    }


    /*
     * Never accept the temporary echo endpoint as the
     * permanent UBnux API URL.
     */

    if (
      isStaleGoogleUserContentURL(
        value
      )
    ) {

      return false;

    }


    try {

      var url =
        new URL(
          value
        );


      return (
        (
          url.protocol ===
          "https:"
        ) ||
        (
          url.protocol ===
          "http:"
        )
      );

    } catch (error) {

      return false;

    }

  }


  /* =======================================================
     READ META API URL
  ====================================================== */

  function getMetaAPIURL() {

    var meta =
      document.querySelector(
        'meta[name="ubnux-api-url"]'
      );


    if (!meta) {

      meta =
        document.querySelector(
          'meta[name="zilabiz-api-url"]'
        );

    }


    if (!meta) {

      meta =
        document.querySelector(
          'meta[name="api-url"]'
        );

    }


    if (!meta) {

      return "";

    }


    return normalizeURL(
      meta.getAttribute(
        "content"
      )
    );

  }


  /* =======================================================
     READ LOCAL STORAGE API URL
  ====================================================== */

  function getStoredAPIURL() {

    var keys = [

      "UBnux_API_URL",
      "UBNUX_API_URL",
      "ZilaBiz_API_URL",
      "ZILABIZ_API_URL",
      "apiUrl",
      "API_URL"

    ];


    for (
      var i = 0;
      i < keys.length;
      i++
    ) {

      try {

        var value =
          localStorage.getItem(
            keys[i]
          );


        if (
          isValidAPIURL(
            value
          )
        ) {

          return normalizeURL(
            value
          );

        }

      } catch (error) {}

    }


    return "";

  }


  /* =======================================================
     GET CONFIG API CANDIDATES
  ====================================================== */

  function getConfigAPICandidates() {

    return [

      {
        value:
          CONFIG.API_URL,

        source:
          "CONFIG.API_URL"

      },

      {
        value:
          CONFIG.apiUrl,

        source:
          "CONFIG.apiUrl"

      },

      {
        value:
          CONFIG.API_BASE_URL,

        source:
          "CONFIG.API_BASE_URL"

      },

      {
        value:
          CONFIG.apiBaseUrl,

        source:
          "CONFIG.apiBaseUrl"

      },

      {
        value:
          CONFIG.GAS_API_URL,

        source:
          "CONFIG.GAS_API_URL"

      },

      {
        value:
          CONFIG.gasApiUrl,

        source:
          "CONFIG.gasApiUrl"

      },

      {
        value:
          CONFIG.WEB_APP_URL,

        source:
          "CONFIG.WEB_APP_URL"

      },

      {
        value:
          CONFIG.webAppUrl,

        source:
          "CONFIG.webAppUrl"

      },

      {
        value:
          CONFIG.SCRIPT_URL,

        source:
          "CONFIG.SCRIPT_URL"

      },

      {
        value:
          CONFIG.scriptUrl,

        source:
          "CONFIG.scriptUrl"

      }

    ];

  }


  /* =======================================================
     RESOLVE API URL
  ====================================================== */

  function resolveAPIURL() {

    var candidates =
      getConfigAPICandidates();


    /*
     * IMPORTANT:
     *
     * First pass searches only for stable URLs.
     *
     * This means if API_URL contains an old
     * googleusercontent echo URL but another config
     * property contains the actual /exec URL, the stable
     * URL wins.
     */

    for (
      var i = 0;
      i < candidates.length;
      i++
    ) {

      var candidate =
        candidates[i];


      var value =
        normalizeURL(
          candidate.value
        );


      if (
        isValidAPIURL(
          value
        )
      ) {

        API_URL =
          value;

        API_URL_SOURCE =
          candidate.source;

        return API_URL;

      }

    }


    /*
     * Meta tag fallback.
     */

    var metaURL =
      getMetaAPIURL();


    if (
      isValidAPIURL(
        metaURL
      )
    ) {

      API_URL =
        metaURL;

      API_URL_SOURCE =
        "meta";

      return API_URL;

    }


    /*
     * localStorage fallback.
     *
     * Only stable URLs are accepted.
     */

    var storedURL =
      getStoredAPIURL();


    if (
      isValidAPIURL(
        storedURL
      )
    ) {

      API_URL =
        storedURL;

      API_URL_SOURCE =
        "localStorage";

      return API_URL;

    }


    /*
     * Nothing valid found.
     */

    API_URL =
      "";


    API_URL_SOURCE =
      "";


    return "";

  }


  /*
   * Resolve immediately during script initialization.
   */

  resolveAPIURL();


  /* =======================================================
     CLEAR STALE API URLS
  ====================================================== */

  function clearStaleStoredAPIURLs() {

    var keys = [

      "UBnux_API_URL",
      "UBNUX_API_URL",
      "ZilaBiz_API_URL",
      "ZILABIZ_API_URL",
      "apiUrl",
      "API_URL"

    ];


    for (
      var i = 0;
      i < keys.length;
      i++
    ) {

      try {

        var value =
          localStorage.getItem(
            keys[i]
          );


        if (
          isStaleGoogleUserContentURL(
            value
          )
        ) {

          localStorage.removeItem(
            keys[i]
          );

        }

      } catch (error) {}

    }

  }


  clearStaleStoredAPIURLs();


  /*
   * Resolve one more time after stale localStorage values
   * have been removed.
   */

  resolveAPIURL();


  /* =======================================================
     SET API URL
  ====================================================== */

  function setAPIURL(
    value,
    save
  ) {

    value =
      normalizeURL(
        value
      );


    if (
      !isValidAPIURL(
        value
      )
    ) {

      throw new Error(
        "Invalid UBnux API URL. " +
        "Use the stable Google Apps Script /exec URL."
      );

    }


    API_URL =
      value;


    API_URL_SOURCE =
      "runtime";


    if (
      save !== false
    ) {

      try {

        localStorage.setItem(
          "UBnux_API_URL",
          API_URL
        );

      } catch (error) {}

    }


    return API_URL;

  }


  /* =======================================================
     BUILD URL
  ====================================================== */

  function buildURL(
    action,
    params
  ) {

    /*
     * Try resolving again in case config was initialized
     * after this file was loaded.
     */

    if (
      !isValidAPIURL()
    ) {

      resolveAPIURL();

    }


    if (
      !isValidAPIURL()
    ) {

      throw new Error(
        "UBnux API URL is not configured. " +
        "Please configure the stable Apps Script /exec URL."
      );

    }


    var url =
      new URL(
        API_URL
      );


    if (action) {

      url.searchParams.set(
        "action",
        action
      );

    }


    if (
      params &&
      typeof params ===
      "object"
    ) {

      Object.keys(
        params
      ).forEach(
        function (key) {

          var value =
            params[key];


          if (
            value === undefined ||
            value === null
          ) {

            return;

          }


          if (
            typeof value ===
            "object"
          ) {

            try {

              value =
                JSON.stringify(
                  value
                );

            } catch (error) {

              return;

            }

          }


          url.searchParams.set(
            key,
            String(
              value
            )
          );

        }
      );

    }


    return url.toString();

  }


  /* =======================================================
     FETCH WITH TIMEOUT
  ====================================================== */

  async function fetchWithTimeout(
    url,
    options
  ) {

    options =
      options ||
      {};


    var controller =
      typeof AbortController !==
      "undefined"

        ? new AbortController()

        : null;


    var timeoutId =
      null;


    var timedOut =
      false;


    if (controller) {

      options.signal =
        controller.signal;


      timeoutId =
        setTimeout(
          function () {

            timedOut =
              true;


            try {

              controller.abort();

            } catch (error) {}

          },
          API_TIMEOUT
        );

    }


    try {

      var response =
        await fetch(
          url,
          options
        );


      return response;

    } catch (error) {

      if (
        timedOut ||
        (
          error &&
          error.name ===
          "AbortError"
        )
      ) {

        throw createTimeoutError();

      }


      throw error;

    } finally {

      if (
        timeoutId !== null
      ) {

        clearTimeout(
          timeoutId
        );

      }

    }

  }


  /* =======================================================
     PARSE RESPONSE
  ====================================================== */

  async function parseResponse(
    response
  ) {

    if (!response) {

      throw new Error(
        "Empty server response."
      );

    }


    var text =
      "";


    try {

      text =
        await response.text();

    } catch (error) {

      throw new Error(
        "Unable to read server response."
      );

    }


    /*
     * Empty successful response.
     */

    if (!text) {

      if (
        response.ok
      ) {

        return {};

      }


      var emptyError =
        new Error(
          "Server returned an empty response."
        );


      emptyError.status =
        response.status;


      emptyError.httpStatus =
        response.status;


      throw emptyError;

    }


    var parsed =
      null;


    /*
     * First attempt: complete JSON.
     */

    try {

      parsed =
        JSON.parse(
          text
        );

    } catch (error) {


      /*
       * Second attempt:
       * Find JSON object inside possible wrapper text.
       */

      var firstBrace =
        text.indexOf(
          "{"
        );


      var lastBrace =
        text.lastIndexOf(
          "}"
        );


      if (
        firstBrace >= 0 &&
        lastBrace > firstBrace
      ) {

        var possibleJSON =
          text.slice(
            firstBrace,
            lastBrace + 1
          );


        try {

          parsed =
            JSON.parse(
              possibleJSON
            );

        } catch (secondError) {

          parsed =
            null;

        }

      }

    }


    /*
     * Invalid JSON.
     */

    if (
      parsed === null
    ) {

      var invalidError;


      if (
        !response.ok
      ) {

        invalidError =
          new Error(
            "Server error (" +
            response.status +
            "): " +
            text.slice(
              0,
              300
            )
          );

      } else {

        invalidError =
          new Error(
            "Server returned invalid JSON."
          );

      }


      invalidError.status =
        response.status;


      invalidError.httpStatus =
        response.status;


      throw invalidError;

    }


    /*
     * HTTP error even when JSON is valid.
     */

    if (
      !response.ok
    ) {

      var serverMessage =
        parsed.message ||
        parsed.error ||
        (
          "Server request failed."
        );


      var httpError =
        new Error(
          String(
            serverMessage
          )
        );


      httpError.status =
        response.status;


      httpError.httpStatus =
        response.status;


      httpError.serverResponse =
        parsed;


      throw httpError;

    }


    return parsed;

  }


  /* =======================================================
     SHOULD RETRY ERROR
  ====================================================== */

  function shouldRetryError(
    error
  ) {

    if (!error) {

      return true;

    }


    /*
     * Configuration errors must never retry.
     */

    if (
      error.message &&
      (
        error.message.indexOf(
          "API URL"
        ) !== -1
      )
    ) {

      return false;

    }


    /*
     * HTTP status.
     */

    var status =
      Number(
        error.status ||
        error.httpStatus ||
        0
      );


    /*
     * 4xx errors are generally permanent for the
     * current request and should not be retried.
     *
     * This specifically fixes repeated 404 calls.
     */

    if (
      status >= 400 &&
      status < 500
    ) {

      return false;

    }


    /*
     * Timeouts can be retried.
     */

    if (
      error.isTimeout
    ) {

      return true;

    }


    /*
     * Network errors can be retried.
     */

    return true;

  }


  /* =======================================================
     GET REQUEST
  ====================================================== */

  async function request(
    action,
    params,
    options
  ) {

    options =
      options ||
      {};


    var url =
      buildURL(
        action,
        params
      );


    var attempts =
      Math.max(
        1,
        Number(
          options.retries ??
          (
            API_RETRIES +
            1
          )
        )
      );


    var lastError =
      null;


    for (
      var attempt = 0;
      attempt < attempts;
      attempt++
    ) {

      try {

        var response =
          await fetchWithTimeout(
            url,
            {

              method:
                "GET",

              headers: {

                "Accept":
                  "application/json"

              },

              cache:
                "no-store"

            }
          );


        var data =
          await parseResponse(
            response
          );


        return data;

      } catch (error) {

        lastError =
          error;


        /*
         * Do not retry permanent errors.
         */

        if (
          !shouldRetryError(
            error
          )
        ) {

          break;

        }


        if (
          attempt <
          attempts - 1
        ) {

          await sleep(
            RETRY_DELAY *
            (
              attempt +
              1
            )
          );

        }

      }

    }


    throw (
      lastError ||
      new Error(
        "API request failed."
      )
    );

  }


  /* =======================================================
     POST REQUEST
  ====================================================== */

  async function postRequest(
    action,
    payload,
    options
  ) {

    options =
      options ||
      {};


    if (
      !isValidAPIURL()
    ) {

      resolveAPIURL();

    }


    if (
      !isValidAPIURL()
    ) {

      throw new Error(
        "UBnux API URL is not configured."
      );

    }


    var url =
      buildURL(
        action
      );


    var attempts =
      Math.max(
        1,
        Number(
          options.retries ??
          (
            API_RETRIES +
            1
          )
        )
      );


    var lastError =
      null;


    for (
      var attempt = 0;
      attempt < attempts;
      attempt++
    ) {

      try {

        var response =
          await fetchWithTimeout(
            url,
            {

              method:
                "POST",

              headers: {

                "Content-Type":
                  "application/json",

                "Accept":
                  "application/json"

              },

              body:
                JSON.stringify(
                  payload ||
                  {}
                )

            }
          );


        var result =
          await parseResponse(
            response
          );


        return result;

      } catch (error) {

        lastError =
          error;


        if (
          !shouldRetryError(
            error
          )
        ) {

          break;

        }


        if (
          attempt <
          attempts - 1
        ) {

          await sleep(
            RETRY_DELAY *
            (
              attempt +
              1
            )
          );

        }

      }

    }


    throw (
      lastError ||
      new Error(
        "POST request failed."
      )
    );

  }


  /* =======================================================
     NORMALIZE INITIAL DATA
  ====================================================== */

  function normalizeInitialData(
    response
  ) {

    response =
      response ||
      {};


    var source =
      response.data &&
      typeof response.data ===
      "object"

        ? response.data

        : response;


    var districts =
      Array.isArray(
        source.districts
      )
        ? source.districts
        : [];


    var categories =
      Array.isArray(
        source.categories
      )
        ? source.categories
        : [];


    var businesses =
      Array.isArray(
        source.businesses
      )
        ? source.businesses
        : [];


    var meta =
      source.businessMeta &&
      typeof source.businessMeta ===
      "object"

        ? source.businessMeta

        : {};


    var total =
      Number(
        meta.total ??
        businesses.length
      );


    var offset =
      Number(
        meta.offset ??
        0
      );


    var limit =
      Number(
        meta.limit ??
        businesses.length
      );


    var hasMore =
      Boolean(
        meta.hasMore
      );


    return {

      success:
        response.success !==
        false,

      message:
        getSafeString(
          response.message
        ),

      data: {

        districts:
          districts,

        categories:
          categories,

        businesses:
          businesses,

        businessMeta: {

          total:
            Number.isFinite(
              total
            )
              ? total
              : businesses.length,

          offset:
            Number.isFinite(
              offset
            )
              ? offset
              : 0,

          limit:
            Number.isFinite(
              limit
            )
              ? limit
              : businesses.length,

          hasMore:
            hasMore

        }

      }

    };

  }


  /* =======================================================
     SAVE INITIAL DATA TO CACHE
  ====================================================== */

  function saveInitialDataToCache(
    normalized
  ) {

    try {

      if (
        App.cache &&
        typeof App.cache
          .setInitialDataCache ===
        "function"
      ) {

        App.cache.setInitialDataCache(
          normalized
        );

        return;

      }


      if (
        typeof App.setInitialDataCache ===
        "function"
      ) {

        App.setInitialDataCache(
          normalized
        );

      }

    } catch (cacheError) {

      /*
       * Cache failure must never break
       * a successful API request.
       */

    }

  }


  /* =======================================================
     GET INITIAL DATA FROM API
  ====================================================== */

  async function fetchInitialData(
    options
  ) {

    options =
      options ||
      {};


    var response =
      await request(
        "getinitialdata",
        {

          offset:
            options.offset ??
            0,

          limit:
            options.limit ??
            DEFAULT_PAGE_SIZE

        },
        options
      );


    var normalized =
      normalizeInitialData(
        response
      );


    /*
     * Keep in-memory copy.
     */

    lastInitialData =
      normalized;


    lastDistricts =
      normalized.data.districts;


    lastCategories =
      normalized.data.categories;


    /*
     * Save fresh data to cache.
     */

    saveInitialDataToCache(
      normalized
    );


    return normalized;

  }


  /* =======================================================
     GET INITIAL DATA
  ====================================================== */

  async function getInitialData(
    options
  ) {

    options =
      options ||
      {};


    /*
     * Re-resolve API URL.
     */

    if (
      !isValidAPIURL()
    ) {

      resolveAPIURL();

    }


    if (
      !isValidAPIURL()
    ) {

      var configError =
        new Error(
          "UBnux API URL is missing or invalid. " +
          "Configure the stable Google Apps Script /exec URL."
        );


      configError.code =
        "API_URL_INVALID";


      if (
        REQUIRE_API
      ) {

        throw configError;

      }


      return {

        success:
          false,

        message:
          getErrorMessage(
            configError
          ),

        data: {

          districts: [],

          categories: [],

          businesses: [],

          businessMeta: {

            total:
              0,

            offset:
              0,

            limit:
              0,

            hasMore:
              false

          }

        }

      };

    }


    /*
     * Prevent duplicate initial-data requests.
     */

    if (
      initialDataPromise
    ) {

      return initialDataPromise;

    }


    initialDataPromise =
      fetchInitialData(
        options
      );


    try {

      return await initialDataPromise;

    } finally {

      initialDataPromise =
        null;

    }

  }


  /* =======================================================
     FAST INITIAL DATA
  ====================================================== */

  async function getInitialDataFast(
    options
  ) {

    options =
      options ||
      {};


    /*
     * First try in-memory data.
     */

    if (
      lastInitialData
    ) {

      return lastInitialData;

    }


    /*
     * Then try valid cache.
     */

    try {

      if (
        App.cache &&
        typeof App.cache
          .getInitialDataCache ===
        "function"
      ) {

        var cached =
          App.cache.getInitialDataCache({

            allowExpired:
              false

          });


        if (
          cached
        ) {

          var normalizedCached =
            normalizeInitialData(
              cached
            );


          lastInitialData =
            normalizedCached;


          lastDistricts =
            normalizedCached.data.districts;


          lastCategories =
            normalizedCached.data.categories;


          return normalizedCached;

        }

      }

    } catch (error) {

      /*
       * Ignore cache errors.
       */

    }


    /*
     * No valid cache.
     */

    return getInitialData(
      options
    );

  }


  /* =======================================================
     REFRESH INITIAL DATA
  ====================================================== */

  async function refreshInitialData(
    options
  ) {

    options =
      options ||
      {};


    /*
     * A refresh should be an actual network request.
     *
     * It still uses the same duplicate protection.
     */

    return getInitialData(
      {

        offset:
          options.offset ??
          0,

        limit:
          options.limit ??
          DEFAULT_PAGE_SIZE,

        retries:
          options.retries ??
          (
            API_RETRIES +
            1
          )

      }
    );

  }


  /* =======================================================
     GET BUSINESS PAGE
  ====================================================== */

  async function getBusinesses(
    options
  ) {

    options =
      options ||
      {};


    var offset =
      options.offset ??
      0;


    var limit =
      options.limit ??
      DEFAULT_PAGE_SIZE;


    var district =
      options.district ??
      "";


    var category =
      options.category ??
      "";


    var search =
      options.search ??
      "";


    var sort =
      options.sort ??
      "";


    /*
     * Build a stable request key so identical simultaneous
     * business requests do not hit Apps Script repeatedly.
     */

    var requestKey =
      JSON.stringify({

        offset:
          offset,

        limit:
          limit,

        district:
          district,

        category:
          category,

        search:
          search,

        sort:
          sort

      });


    if (
      businessPromises[
        requestKey
      ]
    ) {

      return businessPromises[
        requestKey
      ];

    }


    var promise =
      (async function () {

        var response =
          await request(
            "getbusinesses",
            {

              offset:
                offset,

              limit:
                limit,

              district:
                district,

              category:
                category,

              search:
                search,

              sort:
                sort

            },
            options
          );


        var source =
          response.data &&
          typeof response.data ===
          "object"

            ? response.data

            : response;


        var businesses =
          Array.isArray(
            source.businesses
          )
            ? source.businesses
            : [];


        var meta =
          source.businessMeta &&
          typeof source.businessMeta ===
          "object"

            ? source.businessMeta

            : {};


        return {

          success:
            response.success !==
            false,

          message:
            response.message ||
            "",

          businesses:
            businesses,

          businessMeta: {

            total:
              Number(
                meta.total ??
                businesses.length
              ),

            offset:
              Number(
                meta.offset ??
                offset
              ),

            limit:
              Number(
                meta.limit ??
                limit
              ),

            hasMore:
              Boolean(
                meta.hasMore
              )

          }

        };

      })();


    businessPromises[
      requestKey
    ] =
      promise;


    try {

      return await promise;

    } finally {

      delete businessPromises[
        requestKey
      ];

    }

  }


  /* =======================================================
     GET DISTRICTS
  ====================================================== */

  async function getDistricts() {

    /*
     * If initial data already contains districts,
     * do NOT make another API request.
     */

    if (
      Array.isArray(
        lastDistricts
      ) &&
      lastDistricts.length > 0
    ) {

      return {

        success:
          true,

        message:
          "",

        districts:
          lastDistricts

      };

    }


    /*
     * If initial data is currently being loaded, wait for it.
     */

    if (
      initialDataPromise
    ) {

      try {

        var initial =
          await initialDataPromise;


        var initialDistricts =
          initial &&
          initial.data &&
          Array.isArray(
            initial.data.districts
          )

            ? initial.data.districts
            : [];


        if (
          initialDistricts.length > 0
        ) {

          lastDistricts =
            initialDistricts;


          return {

            success:
              true,

            message:
              "",

            districts:
              initialDistricts

          };

        }

      } catch (error) {

        /*
         * Continue to dedicated endpoint.
         */

      }

    }


    /*
     * Prevent duplicate district requests.
     */

    if (
      districtsPromise
    ) {

      return districtsPromise;

    }


    districtsPromise =
      (async function () {

        var response =
          await request(
            "getdistricts"
          );


        var source =
          response.data &&
          typeof response.data ===
          "object"

            ? response.data

            : response;


        var districts =
          Array.isArray(
            source.districts
          )
            ? source.districts
            : [];


        lastDistricts =
          districts;


        return {

          success:
            response.success !==
            false,

          message:
            response.message ||
            "",

          districts:
            districts

        };

      })();


    try {

      return await districtsPromise;

    } finally {

      districtsPromise =
        null;

    }

  }


  /* =======================================================
     GET CATEGORIES
  ====================================================== */

  async function getCategories() {

    /*
     * If initial data already contains categories,
     * do NOT make another API request.
     */

    if (
      Array.isArray(
        lastCategories
      ) &&
      lastCategories.length > 0
    ) {

      return {

        success:
          true,

        message:
          "",

        categories:
          lastCategories

      };

    }


    /*
     * If initial data is currently loading, wait for it.
     */

    if (
      initialDataPromise
    ) {

      try {

        var initial =
          await initialDataPromise;


        var initialCategories =
          initial &&
          initial.data &&
          Array.isArray(
            initial.data.categories
          )

            ? initial.data.categories
            : [];


        if (
          initialCategories.length > 0
        ) {

          lastCategories =
            initialCategories;


          return {

            success:
              true,

            message:
              "",

            categories:
              initialCategories

          };

        }

      } catch (error) {

        /*
         * Continue to dedicated endpoint.
         */

      }

    }


    /*
     * Prevent duplicate category requests.
     */

    if (
      categoriesPromise
    ) {

      return categoriesPromise;

    }


    categoriesPromise =
      (async function () {

        var response =
          await request(
            "getcategories"
          );


        var source =
          response.data &&
          typeof response.data ===
          "object"

            ? response.data

            : response;


        var categories =
          Array.isArray(
            source.categories
          )
            ? source.categories
            : [];


        lastCategories =
          categories;


        return {

          success:
            response.success !==
            false,

          message:
            response.message ||
            "",

          categories:
            categories

        };

      })();


    try {

      return await categoriesPromise;

    } finally {

      categoriesPromise =
        null;

    }

  }


  /* =======================================================
     SUBMIT ENQUIRY
  ====================================================== */

  async function submitEnquiry(
    enquiry
  ) {

    enquiry =
      enquiry ||
      {};


    var payload = {

      businessId:
        getSafeString(
          enquiry.businessId
        ),

      name:
        getSafeString(
          enquiry.name
        ),

      mobile:
        getSafeString(
          enquiry.mobile
        ),

      message:
        getSafeString(
          enquiry.message
        )

    };


    if (
      !payload.businessId
    ) {

      throw new Error(
        "Business information is missing."
      );

    }


    if (
      !payload.name
    ) {

      throw new Error(
        "Please enter your name."
      );

    }


    if (
      !payload.mobile
    ) {

      throw new Error(
        "Please enter your mobile number."
      );

    }


    if (
      !payload.message
    ) {

      throw new Error(
        "Please enter your enquiry message."
      );

    }


    /*
     * Preferred POST.
     */

    try {

      var response =
        await postRequest(
          "submitenquiry",
          payload
        );


      return {

        success:
          response.success !==
          false,

        message:
          response.message ||
          "Enquiry submitted successfully.",

        data:
          response.data ||
          null

      };

    } catch (postError) {

      /*
       * GET fallback.
       */

      try {

        var getResponse =
          await request(
            "submitenquiry",
            payload
          );


        return {

          success:
            getResponse.success !==
            false,

          message:
            getResponse.message ||
            "Enquiry submitted successfully.",

          data:
            getResponse.data ||
            null

        };

      } catch (getError) {

        throw new Error(
          getErrorMessage(
            getError
          )
        );

      }

    }

  }


  /* =======================================================
     CREATE ENQUIRY
  ====================================================== */

  async function createEnquiry(
    enquiry
  ) {

    return submitEnquiry(
      enquiry
    );

  }


  /* =======================================================
     SEND ENQUIRY
  ====================================================== */

  async function sendEnquiry(
    enquiry
  ) {

    return submitEnquiry(
      enquiry
    );

  }


  /* =======================================================
     DETECT DISTRICT BY LOCATION
  ====================================================== */

  async function detectDistrictByLocation(
    latitude,
    longitude
  ) {

    var lat =
      Number(
        latitude
      );


    var lng =
      Number(
        longitude
      );


    if (
      !Number.isFinite(
        lat
      ) ||
      !Number.isFinite(
        lng
      )
    ) {

      throw new Error(
        "Invalid location coordinates."
      );

    }


    var response =
      await request(
        "detectdistrict",
        {

          latitude:
            lat,

          longitude:
            lng

        }
      );


    var source =
      response.data &&
      typeof response.data ===
      "object"

        ? response.data

        : response;


    return {

      success:
        response.success !==
        false,

      message:
        response.message ||
        "",

      district:
        source.district ||
        source.selectedDistrict ||
        null,

      districtId:
        source.districtId ||
        source.id ||
        "",

      data:
        source

    };

  }


  /* =======================================================
     COMPATIBILITY DETECT DISTRICT
  ====================================================== */

  async function detectDistrict(
    latitude,
    longitude
  ) {

    return detectDistrictByLocation(
      latitude,
      longitude
    );

  }


  /* =======================================================
     GENERIC GET API ACTION
  ====================================================== */

  async function call(
    action,
    params,
    options
  ) {

    return request(
      action,
      params,
      options
    );

  }


  /* =======================================================
     GENERIC POST API ACTION
  ====================================================== */

  async function post(
    action,
    payload,
    options
  ) {

    return postRequest(
      action,
      payload,
      options
    );

  }


  /* =======================================================
     API STATUS
  ====================================================== */

  function getStatus() {

    return {

      configured:
        isValidAPIURL(),

      url:
        API_URL,

      urlSource:
        API_URL_SOURCE,

      isTemporaryGoogleURL:
        isStaleGoogleUserContentURL(
          API_URL
        ),

      timeout:
        API_TIMEOUT,

      retries:
        API_RETRIES,

      requireAPI:
        REQUIRE_API

    };

  }


  /* =======================================================
     RESET API MEMORY CACHE
  ====================================================== */

  function clearAPIMemoryCache() {

    lastInitialData =
      null;

    lastDistricts =
      null;

    lastCategories =
      null;

    initialDataPromise =
      null;

    districtsPromise =
      null;

    categoriesPromise =
      null;

    businessPromises =
      {};

  }


  /* =======================================================
     PUBLIC API OBJECT
  ====================================================== */

  var api = {

    url:
      API_URL,

    timeout:
      API_TIMEOUT,

    retries:
      API_RETRIES,

    request:
      request,

    postRequest:
      postRequest,

    post:
      post,

    call:
      call,

    getStatus:
      getStatus,

    setAPIURL:
      setAPIURL,

    resolveAPIURL:
      resolveAPIURL,

    clearAPIMemoryCache:
      clearAPIMemoryCache,

    getInitialData:
      getInitialData,

    getInitialDataFast:
      getInitialDataFast,

    refreshInitialData:
      refreshInitialData,

    fetchInitialData:
      fetchInitialData,

    getBusinesses:
      getBusinesses,

    getDistricts:
      getDistricts,

    getCategories:
      getCategories,

    submitEnquiry:
      submitEnquiry,

    createEnquiry:
      createEnquiry,

    sendEnquiry:
      sendEnquiry,

    detectDistrict:
      detectDistrict,

    detectDistrictByLocation:
      detectDistrictByLocation

  };


  /* =======================================================
     APP NAMESPACE
  ====================================================== */

  App.api =
    api;


  /* =======================================================
     TOP-LEVEL COMPATIBILITY ALIASES
  ====================================================== */

  App.requestAPI =
    request;


  App.callAPI =
    call;


  App.postAPI =
    post;


  App.getInitialData =
    getInitialData;


  App.getInitialDataFast =
    getInitialDataFast;


  App.refreshInitialData =
    refreshInitialData;


  App.fetchInitialData =
    fetchInitialData;


  App.getBusinesses =
    getBusinesses;


  App.getDistricts =
    getDistricts;


  App.getCategories =
    getCategories;


  App.submitEnquiry =
    submitEnquiry;


  App.createEnquiry =
    createEnquiry;


  App.sendEnquiry =
    sendEnquiry;


  App.detectDistrict =
    detectDistrict;


  App.detectDistrictByLocation =
    detectDistrictByLocation;


  App.getAPIStatus =
    getStatus;


  /* =======================================================
     GLOBAL API COMPATIBILITY
  ====================================================== */

  window.UBnuxAPI =
    api;


  window.ZilaBizAPI =
    api;


  /* =======================================================
     READY FLAG
  ====================================================== */

  App.apiReady =
    true;


  window.UBnux =
    App;

  window.ZilaBiz =
    App;


  /* =======================================================
     DEBUG
  ====================================================== */

  try {

    console.log(
      "[UBnux API] API initialized.",
      getStatus()
    );

  } catch (error) {}


})(window, document);
