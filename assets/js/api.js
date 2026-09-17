
/* =========================================================
   UBnux - API Manager
   File: assets/js/api.js

   Responsibilities:
   - Google Apps Script API communication
   - Initial data loading
   - API timeout
   - Retry handling
   - Safe JSON parsing
   - Cache integration
   - Enquiry submission
   - District/location detection
   - Compatibility aliases
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
     API URL
  ====================================================== */

  var API_URL =
    String(
      CONFIG.API_URL ||
      CONFIG.apiUrl ||
      ""
    ).trim();


  /* =======================================================
     API SETTINGS
  ====================================================== */

  var API_TIMEOUT =
    Number(
      CONFIG.API_TIMEOUT ||
      CONFIG.apiTimeout ||
      15000
    );


  var API_RETRIES =
    Number(
      CONFIG.API_RETRIES ??
      CONFIG.RETRIES ??
      2
    );


  var RETRY_DELAY =
    Number(
      CONFIG.RETRY_DELAY ||
      700
    );


  var REQUIRE_API =
    CONFIG.REQUIRE_API !== false;


  /* =======================================================
     HELPERS
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


  function getErrorMessage(
    error
  ) {

    if (!error) {

      return "Unknown API error.";

    }


    if (
      typeof error ===
      "string"
    ) {

      return error;

    }


    if (
      error.message
    ) {

      return String(
        error.message
      );

    }


    return "Unable to communicate with the server.";

  }


  /* =======================================================
     URL VALIDATION
  ====================================================== */

  function isValidAPIURL() {

    if (!API_URL) {

      return false;

    }


    try {

      var url =
        new URL(
          API_URL
        );


      return (
        url.protocol ===
          "https:" ||
        url.protocol ===
          "http:"
      );

    } catch (error) {

      return false;

    }

  }


  /* =======================================================
     BUILD URL
  ====================================================== */

  function buildURL(
    action,
    params
  ) {

    if (
      !isValidAPIURL()
    ) {

      throw new Error(
        "UBnux API URL is not configured."
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
            value ===
              undefined ||
            value ===
              null
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
            String(value)
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


    /*
     * AbortController support.
     */

    var controller =
      typeof AbortController !==
      "undefined"

        ? new AbortController()

        : null;


    var timeoutId =
      null;


    if (controller) {

      options.signal =
        controller.signal;

      timeoutId =
        setTimeout(
          function () {

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

    } finally {

      if (timeoutId) {

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


    if (!text) {

      if (
        response.ok
      ) {

        return {};

      }


      throw new Error(
        "Server returned an empty response."
      );

    }


    var parsed =
      null;


    try {

      parsed =
        JSON.parse(
          text
        );

    } catch (error) {

      /*
       * Sometimes Apps Script /
       * proxy layers may return JSON
       * wrapped in unexpected whitespace.
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


    if (
      parsed === null
    ) {

      if (
        !response.ok
      ) {

        throw new Error(
          "Server error: " +
          text.slice(
            0,
            300
          )
        );

      }


      throw new Error(
        "Server returned invalid JSON."
      );

    }


    if (
      !response.ok
    ) {

      var serverMessage =
        parsed.message ||
        parsed.error ||
        "Server request failed.";


      throw new Error(
        String(
          serverMessage
        )
      );

    }


    return parsed;

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
        response.success !== false,

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
     REQUEST
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
          API_RETRIES + 1
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


        if (
          attempt <
          attempts - 1
        ) {

          await sleep(
            RETRY_DELAY *
            (
              attempt + 1
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
          API_RETRIES + 1
        )
      );


    var lastError =
      null;


    for (
      var attempt = 0;
      attempt < attempts;
      attempt++
    ) {

      var controller =
        typeof AbortController !==
        "undefined"

          ? new AbortController()

          : null;


      var timeoutId =
        null;


      try {

        if (controller) {

          timeoutId =
            setTimeout(
              function () {

                try {

                  controller.abort();

                } catch (ignore) {}

              },
              API_TIMEOUT
            );

        }


        var fetchOptions = {

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

        };


        if (controller) {

          fetchOptions.signal =
            controller.signal;

        }


        var response =
          await fetch(
            url,
            fetchOptions
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
          attempt <
          attempts - 1
        ) {

          await sleep(
            RETRY_DELAY *
            (
              attempt + 1
            )
          );

        }

      } finally {

        if (timeoutId) {

          clearTimeout(
            timeoutId
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
            Number(
              CONFIG.BUSINESS_PAGE_SIZE ||
              18
            )

        },
        options
      );


    var normalized =
      normalizeInitialData(
        response
      );


    /*
     * Save fresh API data into cache.
     */

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

      } else if (
        typeof App.setInitialDataCache ===
        "function"
      ) {

        App.setInitialDataCache(
          normalized
        );

      }

    } catch (cacheError) {

      /*
       * Cache failure must never
       * make a successful API
       * request fail.
       */

    }


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


    if (
      !isValidAPIURL()
    ) {

      var configError =
        new Error(
          "UBnux API URL is missing or invalid."
        );


      if (
        REQUIRE_API
      ) {

        throw configError;

      }


      return {

        success: false,

        message:
          getErrorMessage(
            configError
          ),

        data: {

          districts: [],

          categories: [],

          businesses: [],

          businessMeta: {

            total: 0,

            offset: 0,

            limit: 0,

            hasMore: false

          }

        }

      };

    }


    return fetchInitialData(
      options
    );

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
     * First try valid cache.
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


        if (cached) {

          return cached;

        }

      }

    } catch (error) {}



    /*
     * If no cache exists,
     * request API.
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


    return getInitialData(
      {

        offset:
          options.offset ??
          0,

        limit:
          options.limit ??
          Number(
            CONFIG.BUSINESS_PAGE_SIZE ||
            18
          ),

        retries:
          options.retries ??
          API_RETRIES + 1

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


    var response =
      await request(
        "getbusinesses",
        {

          offset:
            options.offset ??
            0,

          limit:
            options.limit ??
            Number(
              CONFIG.BUSINESS_PAGE_SIZE ||
              18
            ),

          district:
            options.district ??
            "",

          category:
            options.category ??
            "",

          search:
            options.search ??
            "",

          sort:
            options.sort ??
            ""

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
        response.success !== false,

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
            options.offset ??
            0
          ),

        limit:
          Number(
            meta.limit ??
            options.limit ??
            businesses.length
          ),

        hasMore:
          Boolean(
            meta.hasMore
          )

      }

    };

  }


  /* =======================================================
     GET DISTRICTS
  ====================================================== */

  async function getDistricts() {

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


    return {

      success:
        response.success !== false,

      message:
        response.message ||
        "",

      districts:
        Array.isArray(
          source.districts
        )
          ? source.districts
          : []

    };

  }


  /* =======================================================
     GET CATEGORIES
  ====================================================== */

  async function getCategories() {

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


    return {

      success:
        response.success !== false,

      message:
        response.message ||
        "",

      categories:
        Array.isArray(
          source.categories
        )
          ? source.categories
          : []

    };

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
     * Preferred POST endpoint.
     */

    try {

      var response =
        await postRequest(
          "submitenquiry",
          payload
        );


      return {

        success:
          response.success !== false,

        message:
          response.message ||
          "Enquiry submitted successfully.",

        data:
          response.data ||
          null

      };

    } catch (postError) {

      /*
       * Fallback to GET.
       *
       * Useful for Apps Script deployments
       * where POST handling has not yet
       * been implemented.
       */

      try {

        var getResponse =
          await request(
            "submitenquiry",
            payload
          );


        return {

          success:
            getResponse.success !== false,

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
        response.success !== false,

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
     GENERIC API ACTION
  ====================================================== */

  async function call(
    action,
    params,
    options
  ) {

    var response =
      await request(
        action,
        params,
        options
      );


    return response;

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

      timeout:
        API_TIMEOUT,

      retries:
        API_RETRIES,

      requireAPI:
        REQUIRE_API

    };

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

    call:
      call,

    getStatus:
      getStatus,

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


})(window, document);