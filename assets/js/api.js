/* =========================================================
   UBnux API Client
   File: assets/js/api.js

   FINAL FIXED VERSION

   Responsibilities:
   - Centralized Google Apps Script API client
   - Canonical /exec endpoint only
   - Prevent googleusercontent redirect URL persistence
   - GET / POST requests
   - Timeout handling
   - Safe retry handling
   - Request deduplication
   - Initial data loading
   - Cache-first compatibility
   - Background refresh compatibility
   - District / Category / Business APIs
   - Business authentication APIs
   - Enquiry APIs
   - Legacy ZilaBiz compatibility
   ========================================================= */

(function (window, document) {

  "use strict";


  /* =========================================================
     NAMESPACE
     ========================================================= */

  window.UBnux =
    window.UBnux ||
    {};

  window.ZilaBiz =
    window.ZilaBiz ||
    window.UBnux;


  const App =
    window.UBnux;


  /* =========================================================
     CONFIG
     ========================================================= */

  const CONFIG =
    window.UBNux_CONFIG ||
    window.ZILABIZ_CONFIG ||
    {};


  /* =========================================================
     CONSTANTS
     ========================================================= */

  const DEFAULT_API_URL =
    "https://script.google.com/macros/s/AKfycbztutJtJG12CaENibP2XpSg9Mx_N4LFQWTm1R-U9ePTjqhHlhPEjv-UzBxUGSe5yBh-/exec";


  const DEFAULT_TIMEOUT =
    15000;


  const DEFAULT_RETRIES =
    0;


  const DEFAULT_RETRY_DELAY =
    800;


  const CACHE_KEY =
    "UBnux_initial_data";


  const API_URL_STORAGE_KEY =
    "UBnux_API_URL";


  /* =========================================================
     INTERNAL STATE
     ========================================================= */

  let initialDataPromise =
    null;


  let districtsPromise =
    null;


  let categoriesPromise =
    null;


  let businessesPromise =
    null;


  let apiUrl =
    "";


  /* =========================================================
     URL VALIDATION
     ========================================================= */

  function isValidApiUrl(url) {

    if (
      typeof url !== "string"
    ) {

      return false;

    }


    url =
      url.trim();


    if (
      !url
    ) {

      return false;

    }


    /*
      Never allow Google's redirected
      googleusercontent URL to become
      the permanent API endpoint.
    */

    if (
      url.includes(
        "script.googleusercontent.com"
      )
    ) {

      return false;

    }


    if (
      !url.includes(
        "script.google.com/macros/s/"
      )
    ) {

      return false;

    }


    if (
      !url.endsWith(
        "/exec"
      )
    ) {

      return false;

    }


    return true;

  }


  /* =========================================================
     NORMALIZE API URL
     ========================================================= */

  function normalizeApiUrl(url) {

    if (
      typeof url !== "string"
    ) {

      return "";

    }


    url =
      url.trim();


    if (
      !url
    ) {

      return "";

    }


    /*
      Remove accidental query string.
      The client adds ?action=...
      itself.
    */

    const questionIndex =
      url.indexOf("?");


    if (
      questionIndex !== -1
    ) {

      url =
        url.substring(
          0,
          questionIndex
        );

    }


    /*
      Remove trailing slash.
    */

    url =
      url.replace(
        /\/+$/,
        ""
      );


    return url;

  }


  /* =========================================================
     RESOLVE API URL
     ========================================================= */

  function resolveApiUrl() {

    /*
      1. Config has highest priority.
    */

    const configCandidates = [

      CONFIG.API_URL,

      CONFIG.apiUrl,

      CONFIG.API_ENDPOINT,

      CONFIG.apiEndpoint

    ];


    for (
      let i = 0;
      i < configCandidates.length;
      i++
    ) {

      const candidate =
        normalizeApiUrl(
          configCandidates[i]
        );


      if (
        isValidApiUrl(candidate)
      ) {

        return candidate;

      }

    }


    /*
      2. Meta tag.
    */

    const meta =
      document.querySelector(
        'meta[name="ubnux-api-url"]'
      );


    if (
      meta
    ) {

      const candidate =
        normalizeApiUrl(
          meta.getAttribute(
            "content"
          )
        );


      if (
        isValidApiUrl(candidate)
      ) {

        return candidate;

      }

    }


    /*
      3. Previously saved URL.

      IMPORTANT:
      googleusercontent URLs are rejected.
    */

    try {

      const saved =
        normalizeApiUrl(
          localStorage.getItem(
            API_URL_STORAGE_KEY
          )
        );


      if (
        isValidApiUrl(saved)
      ) {

        return saved;

      }

    } catch (
      error
    ) {

      /*
        Ignore localStorage errors.
      */

    }


    /*
      4. Final canonical endpoint.
    */

    return DEFAULT_API_URL;

  }


  /* =========================================================
     SET API URL
     ========================================================= */

  function setApiUrl(url) {

    const normalized =
      normalizeApiUrl(
        url
      );


    if (
      !isValidApiUrl(
        normalized
      )
    ) {

      console.warn(
        "[UBnux API] Invalid API URL ignored:",
        url
      );

      return false;

    }


    apiUrl =
      normalized;


    try {

      localStorage.setItem(
        API_URL_STORAGE_KEY,
        normalized
      );

    } catch (
      error
    ) {

      /*
        Ignore storage failure.
      */

    }


    return true;

  }


  /* =========================================================
     INITIALIZE API URL
     ========================================================= */

  apiUrl =
    resolveApiUrl();


  /*
    Always prefer config/canonical URL
    over a previously stored redirect URL.
  */

  if (
    isValidApiUrl(
      apiUrl
    )
  ) {

    try {

      localStorage.setItem(
        API_URL_STORAGE_KEY,
        apiUrl
      );

    } catch (
      error
    ) {

      /*
        Ignore.
      */

    }

  }


  /* =========================================================
     GET API URL
     ========================================================= */

  function getApiUrl() {

    return apiUrl;

  }


  /* =========================================================
     REQUEST CONFIG
     ========================================================= */

  function getTimeout() {

    const value =
      Number(
        CONFIG.API_TIMEOUT
      );


    if (
      Number.isFinite(value) &&
      value >= 3000
    ) {

      return value;

    }


    return DEFAULT_TIMEOUT;

  }


  function getRetries() {

    const value =
      Number(
        CONFIG.API_RETRIES ??
        CONFIG.API_RETRY_COUNT
      );


    if (
      Number.isFinite(value) &&
      value >= 0
    ) {

      return Math.min(
        value,
        2
      );

    }


    return DEFAULT_RETRIES;

  }


  function getRetryDelay() {

    const value =
      Number(
        CONFIG.RETRY_DELAY ??
        CONFIG.API_RETRY_DELAY
      );


    if (
      Number.isFinite(value) &&
      value >= 0
    ) {

      return value;

    }


    return DEFAULT_RETRY_DELAY;

  }


  /* =========================================================
     BUILD URL
     ========================================================= */

  function buildUrl(
    action,
    params
  ) {

    const base =
      normalizeApiUrl(
        apiUrl
      );


    if (
      !isValidApiUrl(
        base
      )
    ) {

      throw new Error(
        "Invalid UBnux API URL."
      );

    }


    const url =
      new URL(
        base
      );


    url.searchParams.set(
      "action",
      action
    );


    if (
      params &&
      typeof params === "object"
    ) {

      Object.keys(
        params
      ).forEach(
        function (key) {

          const value =
            params[key];


          if (
            value === undefined ||
            value === null
          ) {

            return;

          }


          /*
            Arrays are converted to JSON.
          */

          if (
            Array.isArray(
              value
            )
          ) {

            url.searchParams.set(
              key,
              JSON.stringify(
                value
              )
            );

            return;

          }


          /*
            Objects are converted to JSON.
          */

          if (
            typeof value === "object"
          ) {

            url.searchParams.set(
              key,
              JSON.stringify(
                value
              )
            );

            return;

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


  /* =========================================================
     ABORT / TIMEOUT
     ========================================================= */

  function createTimeoutController(
    timeout
  ) {

    const controller =
      new AbortController();


    const timer =
      setTimeout(
        function () {

          controller.abort();

        },
        timeout
      );


    return {

      controller,

      clear:
        function () {

          clearTimeout(
            timer
          );

        }

    };

  }


  /* =========================================================
     RESPONSE PARSER
     ========================================================= */

  async function parseResponse(
    response
  ) {

    const text =
      await response.text();


    if (
      !text
    ) {

      throw new Error(
        "Empty response received from UBnux API."
      );

    }


    let data;


    try {

      data =
        JSON.parse(
          text
        );

    } catch (
      firstError
    ) {

      /*
        Some Apps Script responses can
        occasionally contain wrapper text.

        Try to locate the first JSON object.
      */

      const start =
        text.indexOf("{");


      const end =
        text.lastIndexOf("}");


      if (
        start !== -1 &&
        end !== -1 &&
        end > start
      ) {

        try {

          data =
            JSON.parse(
              text.substring(
                start,
                end + 1
              )
            );

        } catch (
          secondError
        ) {

          throw new Error(
            "Invalid JSON response from UBnux API."
          );

        }

      } else {

        throw new Error(
          "Invalid response from UBnux API."
        );

      }

    }


    if (
      !data ||
      typeof data !== "object"
    ) {

      throw new Error(
        "Invalid API response format."
      );

    }


    return data;

  }


  /* =========================================================
     SINGLE FETCH
     ========================================================= */

  async function fetchWithTimeout(
    url,
    options
  ) {

    const timeout =
      getTimeout();


    const timeoutController =
      createTimeoutController(
        timeout
      );


    try {

      const fetchOptions =
        Object.assign(
          {},
          options || {},
          {
            signal:
              timeoutController.controller.signal
          }
        );


      console.log(
        "[UBnux API] REQUEST:",
        url
      );


      const response =
        await fetch(
          url,
          fetchOptions
        );


      if (
        !response.ok
      ) {

        const status =
          response.status;


        const statusText =
          response.statusText ||
          "";


        const error =
          new Error(
            "UBnux API HTTP " +
            status +
            (
              statusText
                ? " " + statusText
                : ""
            )
          );


        error.status =
          status;


        /*
          IMPORTANT:
          404/400/401/etc. should NOT
          be blindly retried.
        */

        throw error;

      }


      return await parseResponse(
        response
      );

    } catch (
      error
    ) {

      if (
        error &&
        error.name ===
        "AbortError"
      ) {

        const timeoutError =
          new Error(
            "UBnux API request timed out after " +
            timeout +
            " ms."
          );


        timeoutError.code =
          "TIMEOUT";


        throw timeoutError;

      }


      throw error;

    } finally {

      timeoutController.clear();

    }

  }


  /* =========================================================
     SHOULD RETRY
     ========================================================= */

  function shouldRetry(
    error
  ) {

    if (
      !error
    ) {

      return false;

    }


    if (
      error.code ===
      "TIMEOUT"
    ) {

      return true;

    }


    if (
      error.name ===
      "TypeError"
    ) {

      /*
        Network/fetch failure.
      */

      return true;

    }


    const status =
      Number(
        error.status
      );


    /*
      Retry only server-side errors.
    */

    if (
      status >= 500 &&
      status <= 599
    ) {

      return true;

    }


    return false;

  }


  /* =========================================================
     WAIT
     ========================================================= */

  function wait(
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


  /* =========================================================
     REQUEST
     ========================================================= */

  async function request(
    action,
    params,
    method,
    body
  ) {

    if (
      !isValidApiUrl(
        apiUrl
      )
    ) {

      apiUrl =
        resolveApiUrl();

    }


    if (
      !isValidApiUrl(
        apiUrl
      )
    ) {

      throw new Error(
        "UBnux API endpoint is not configured."
      );

    }


    const requestMethod =
      (
        method ||
        "GET"
      ).toUpperCase();


    let url;


    try {

      url =
        buildUrl(
          action,
          requestMethod === "GET"
            ? params
            : null
        );

    } catch (
      error
    ) {

      throw error;

    }


    const options = {

      method:
        requestMethod,

      headers: {

        "Accept":
          "application/json"

      }

    };


    if (
      requestMethod !==
      "GET"
    ) {

      options.headers[
        "Content-Type"
      ] =
        "application/json";


      if (
        body !== undefined &&
        body !== null
      ) {

        options.body =
          JSON.stringify(
            body
          );

      } else if (
        params
      ) {

        options.body =
          JSON.stringify(
            params
          );

      }

    }


    const retries =
      getRetries();


    const retryDelay =
      getRetryDelay();


    let lastError =
      null;


    for (
      let attempt = 0;
      attempt <= retries;
      attempt++
    ) {

      try {

        const result =
          await fetchWithTimeout(
            url,
            options
          );


        /*
          Log API result in development.
        */

        if (
          CONFIG.DEBUG === true
        ) {

          console.log(
            "[UBnux API] RESPONSE:",
            action,
            result
          );

        }


        return result;

      } catch (
        error
      ) {

        lastError =
          error;


        if (
          attempt >= retries ||
          !shouldRetry(
            error
          )
        ) {

          break;

        }


        await wait(
          retryDelay *
          (attempt + 1)
        );

      }

    }


    throw lastError ||
      new Error(
        "UBnux API request failed."
      );

  }


  /* =========================================================
     REQUEST DEDUPLICATION
     ========================================================= */

  function dedupeRequest(
    promiseVariableName,
    createRequest
  ) {

    /*
      This function is not used directly
      with dynamic variable references.
      It exists for documentation/compatibility.
    */

    return createRequest();

  }


  /* =========================================================
     INITIAL DATA CACHE
     ========================================================= */

  function readInitialDataCache() {

    try {

      const raw =
        localStorage.getItem(
          CACHE_KEY
        );


      if (
        !raw
      ) {

        return null;

      }


      const parsed =
        JSON.parse(
          raw
        );


      if (
        !parsed ||
        typeof parsed !== "object"
      ) {

        return null;

      }


      return parsed;

    } catch (
      error
    ) {

      return null;

    }

  }


  function writeInitialDataCache(
    data
  ) {

    try {

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify(
          data
        )
      );

    } catch (
      error
    ) {

      console.warn(
        "[UBnux API] Unable to save initial data cache:",
        error
      );

    }

  }


  function clearInitialDataCache() {

    try {

      localStorage.removeItem(
        CACHE_KEY
      );

    } catch (
      error
    ) {

      /*
        Ignore.
      */

    }

  }


  /* =========================================================
     NORMALIZE INITIAL DATA
     ========================================================= */

  function normalizeInitialData(
    response
  ) {

    if (
      !response ||
      typeof response !== "object"
    ) {

      throw new Error(
        "Invalid initial data response."
      );

    }


    /*
      API may return:

      {
        success:true,
        data:{
          districts:[],
          categories:[],
          businesses:[]
        }
      }

      OR:

      {
        success:true,
        districts:[],
        categories:[],
        businesses:[]
      }
    */

    const payload =
      (
        response.data &&
        typeof response.data === "object"
      )
        ? response.data
        : response;


    if (
      response.success === false
    ) {

      throw new Error(
        response.message ||
        "UBnux API returned success:false."
      );

    }


    const result = {

      success:
        true,

      districts:
        Array.isArray(
          payload.districts
        )
          ? payload.districts
          : [],

      categories:
        Array.isArray(
          payload.categories
        )
          ? payload.categories
          : [],

      businesses:
        Array.isArray(
          payload.businesses
        )
          ? payload.businesses
          : [],

      businessMeta:
        payload.businessMeta ||
        payload.meta ||
        null

    };


    /*
      If API response has no expected
      collections at all, don't silently
      treat it as valid application data.
    */

    const hasExpectedData =
      Array.isArray(
        payload.districts
      ) ||
      Array.isArray(
        payload.categories
      ) ||
      Array.isArray(
        payload.businesses
      );


    if (
      !hasExpectedData
    ) {

      throw new Error(
        "Initial data response does not contain districts, categories or businesses."
      );

    }


    return result;

  }


  /* =========================================================
     GET INITIAL DATA
     ========================================================= */

  async function getInitialData(
    options
  ) {

    options =
      options ||
      {};


    /*
      Prevent duplicate initial-data
      requests.
    */

    if (
      initialDataPromise
    ) {

      return initialDataPromise;

    }


    initialDataPromise =
      (
        async function () {

          try {

            const response =
              await request(
                "getinitialdata"
              );


            const data =
              normalizeInitialData(
                response
              );


            writeInitialDataCache(
              data
            );


            return data;

          } catch (
            error
          ) {

            /*
              If network/API fails, use
              cached initial data when available.
            */

            const cached =
              readInitialDataCache();


            if (
              cached
            ) {

              console.warn(
                "[UBnux API] Latest initial data failed. Using cached data.",
                error
              );


              return cached;

            }


            throw error;

          } finally {

            initialDataPromise =
              null;

          }

        }
      )();


    return initialDataPromise;

  }


  /* =========================================================
     GET INITIAL DATA FAST
     ========================================================= */

  async function getInitialDataFast() {

    const cached =
      readInitialDataCache();


    if (
      cached
    ) {

      /*
        Return cache immediately.
      */

      return {

        data:
          cached,

        fromCache:
          true

      };

    }


    const data =
      await getInitialData();


    return {

      data,

      fromCache:
        false

    };

  }


  /* =========================================================
     REFRESH INITIAL DATA
     ========================================================= */

  async function refreshInitialData() {

    /*
      A refresh should always hit API.
      But it still uses the same
      deduplicated promise.
    */

    return await getInitialData();

  }


  /* =========================================================
     GET DISTRICTS
     ========================================================= */

  async function getDistricts(
    options
  ) {

    options =
      options ||
      {};


    if (
      districtsPromise
    ) {

      return districtsPromise;

    }


    districtsPromise =
      (
        async function () {

          try {

            const response =
              await request(
                "getdistricts"
              );


            if (
              response.success === false
            ) {

              throw new Error(
                response.message ||
                "Unable to load districts."
              );

            }


            const data =
              Array.isArray(
                response.data
              )
                ? response.data
                : Array.isArray(
                    response.districts
                  )
                  ? response.districts
                  : [];


            return data;

          } finally {

            districtsPromise =
              null;

          }

        }
      )();


    return districtsPromise;

  }


  /* =========================================================
     GET CATEGORIES
     ========================================================= */

  async function getCategories(
    options
  ) {

    options =
      options ||
      {};


    if (
      categoriesPromise
    ) {

      return categoriesPromise;

    }


    categoriesPromise =
      (
        async function () {

          try {

            const response =
              await request(
                "getcategories"
              );


            if (
              response.success === false
            ) {

              throw new Error(
                response.message ||
                "Unable to load categories."
              );

            }


            const data =
              Array.isArray(
                response.data
              )
                ? response.data
                : Array.isArray(
                    response.categories
                  )
                  ? response.categories
                  : [];


            return data;

          } finally {

            categoriesPromise =
              null;

          }

        }
      )();


    return categoriesPromise;

  }


  /* =========================================================
     GET BUSINESSES
     ========================================================= */

  async function getBusinesses(
    params,
    options
  ) {

    options =
      options ||
      {};


    /*
      Create a stable request key.

      This prevents simultaneous identical
      business requests.
    */

    const requestKey =
      JSON.stringify(
        params ||
        {}
      );


    if (
      businessesPromise &&
      businessesPromise.key ===
      requestKey
    ) {

      return businessesPromise.promise;

    }


    const promise =
      (
        async function () {

          try {

            const response =
              await request(
                "getbusinesses",
                params || {}
              );


            if (
              response.success === false
            ) {

              throw new Error(
                response.message ||
                "Unable to load businesses."
              );

            }


            return response;

          } finally {

            if (
              businessesPromise &&
              businessesPromise.key ===
              requestKey
            ) {

              businessesPromise =
                null;

            }

          }

        }
      )();


    businessesPromise = {

      key:
        requestKey,

      promise

    };


    return promise;

  }


  /* =========================================================
     GET SINGLE BUSINESS
     ========================================================= */

  async function getBusiness(
    businessId
  ) {

    return await request(
      "getbusiness",
      {
        businessId:
          businessId
      }
    );

  }


  /* =========================================================
     GET PRODUCTS
     ========================================================= */

  async function getProducts(
    params
  ) {

    return await request(
      "getproducts",
      params || {}
    );

  }


  /* =========================================================
     GET SERVICES
     ========================================================= */

  async function getServices(
    params
  ) {

    return await request(
      "getservices",
      params || {}
    );

  }


  /* =========================================================
     GET STATUS
     ========================================================= */

  async function getStatus() {

    return await request(
      "getstatus"
    );

  }


  /* =========================================================
     BUSINESS LOGIN
     ========================================================= */

  async function businessLogin(
    credentials
  ) {

    return await request(
      "businesslogin",
      credentials || {},
      "POST",
      credentials || {}
    );

  }


  /* =========================================================
     BUSINESS REGISTER
     ========================================================= */

  async function businessRegister(
    data
  ) {

    return await request(
      "businessregister",
      data || {},
      "POST",
      data || {}
    );

  }


  /* =========================================================
     BUSINESS FORGOT PASSWORD
     ========================================================= */

  async function businessForgotPassword(
    data
  ) {

    return await request(
      "businessforgotpassword",
      data || {},
      "POST",
      data || {}
    );

  }


  /* =========================================================
     VERIFY BUSINESS OTP
     ========================================================= */

  async function verifyBusinessOtp(
    data
  ) {

    return await request(
      "verifybusinessotp",
      data || {},
      "POST",
      data || {}
    );

  }


  /* =========================================================
     BUSINESS DASHBOARD
     ========================================================= */

  async function getBusinessDashboard(
    params
  ) {

    return await request(
      "getbusinessdashboard",
      params || {}
    );

  }


  /* =========================================================
     BUSINESS PROFILE
     ========================================================= */

  async function getBusinessProfile(
    params
  ) {

    return await request(
      "getbusinessprofile",
      params || {}
    );

  }


  /* =========================================================
     BUSINESS ENQUIRIES
     ========================================================= */

  async function getBusinessEnquiries(
    params
  ) {

    return await request(
      "getbusinessenquiries",
      params || {}
    );

  }


  /* =========================================================
     BUSINESS SERVICES
     ========================================================= */

  async function getBusinessServices(
    params
  ) {

    return await request(
      "getbusinessservices",
      params || {}
    );

  }


  /* =========================================================
     BUSINESS SETTINGS
     ========================================================= */

  async function getBusinessSettings(
    params
  ) {

    return await request(
      "getbusinesssettings",
      params || {}
    );

  }


  /* =========================================================
     SUBMIT ENQUIRY
     ========================================================= */

  async function submitEnquiry(
    data
  ) {

    const payload =
      data || {};


    /*
      POST is preferred.
    */

    try {

      const response =
        await request(
          "submitenquiry",
          payload,
          "POST",
          payload
        );


      return response;

    } catch (
      postError
    ) {

      /*
        Some older Apps Script deployments
        may not support POST for this action.

        Fallback to GET.
      */

      console.warn(
        "[UBnux API] POST enquiry failed. Trying GET fallback.",
        postError
      );


      return await request(
        "submitenquiry",
        payload
      );

    }

  }


  /* =========================================================
     DETECT DISTRICT
     ========================================================= */

  async function detectDistrictByLocation(
    latitude,
    longitude
  ) {

    return await request(
      "detectdistrict",
      {

        latitude:
          latitude,

        longitude:
          longitude

      }
    );

  }


  /* =========================================================
     HEALTH CHECK
     ========================================================= */

  async function checkApi() {

    try {

      const response =
        await request(
          "getstatus"
        );


      return {

        success:
          true,

        data:
          response

      };

    } catch (
      error
    ) {

      return {

        success:
          false,

        error:
          error

      };

    }

  }


  /* =========================================================
     CLEAR REQUEST STATE
     ========================================================= */

  function resetRequestState() {

    initialDataPromise =
      null;

    districtsPromise =
      null;

    categoriesPromise =
      null;

    businessesPromise =
      null;

  }


  /* =========================================================
     PUBLIC API
     ========================================================= */

  const API = {

    getApiUrl,

    setApiUrl,

    request,

    fetchWithTimeout,

    getInitialData,

    getInitialDataFast,

    refreshInitialData,

    getDistricts,

    getCategories,

    getBusinesses,

    getBusiness,

    getProducts,

    getServices,

    getStatus,

    businessLogin,

    businessRegister,

    businessForgotPassword,

    verifyBusinessOtp,

    getBusinessDashboard,

    getBusinessProfile,

    getBusinessEnquiries,

    getBusinessServices,

    getBusinessSettings,

    submitEnquiry,

    detectDistrictByLocation,

    checkApi,

    readInitialDataCache,

    writeInitialDataCache,

    clearInitialDataCache,

    resetRequestState

  };


  /* =========================================================
     APP NAMESPACE
     ========================================================= */

  App.api =
    API;


  /*
    Legacy namespace compatibility.
  */

  window.ZilaBizAPI =
    API;


  window.UBnuxAPI =
    API;


  /* =========================================================
     LEGACY GLOBAL ALIASES
     ========================================================= */

  App.getInitialData =
    getInitialData;


  App.getDistricts =
    getDistricts;


  App.getCategories =
    getCategories;


  App.getBusinesses =
    getBusinesses;


  App.getBusiness =
    getBusiness;


  App.submitEnquiry =
    submitEnquiry;


  /* =========================================================
     DEBUG INFORMATION
     ========================================================= */

  console.log(
    "[UBnux API] Initialized."
  );


  console.log(
    "[UBnux API] Canonical endpoint:",
    apiUrl
  );


  /*
    Safety check:
    If somehow a googleusercontent URL
    enters runtime state, immediately
    restore canonical endpoint.
  */

  if (
    apiUrl.includes(
      "googleusercontent.com"
    )
  ) {

    console.warn(
      "[UBnux API] Invalid redirected endpoint detected. Restoring canonical /exec endpoint."
    );


    apiUrl =
      DEFAULT_API_URL;

  }


})(window, document);
