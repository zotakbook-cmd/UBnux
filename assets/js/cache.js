
/* =========================================================
   UBnux - Cache Manager
   File: assets/js/cache.js

   Responsibilities:
   - Initial data localStorage cache
   - Cache-first support
   - Cache TTL / expiry
   - Safe read/write
   - Legacy compatibility
   - Cache metadata
   - Clear cache
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

  var CACHE_VERSION =
    "1.0.0";

  var CACHE_KEY =
    "ubnux_initial_data";

  var LEGACY_CACHE_KEYS = [

    "zilaBiz_initial_data",

    "zilabiz_initial_data",

    "UBnux_initial_data",

    "UBNUX_INITIAL_DATA"

  ];


  var DEFAULT_TTL =
    15 * 60 * 1000;


  /* =======================================================
     TTL
  ====================================================== */

  function getCacheTTL() {

    var configuredTTL =
      Number(
        CONFIG.CACHE_TTL ||
        CONFIG.CACHE_DURATION ||
        CONFIG.CACHE_EXPIRY ||
        0
      );


    if (
      Number.isFinite(
        configuredTTL
      ) &&
      configuredTTL > 0
    ) {

      /*
       * If the value looks like seconds,
       * convert it to milliseconds.
       */

      if (
        configuredTTL < 100000
      ) {

        return (
          configuredTTL *
          1000
        );

      }


      return configuredTTL;

    }


    return DEFAULT_TTL;

  }


  /* =======================================================
     LOCAL STORAGE AVAILABILITY
  ====================================================== */

  function getStorage() {

    try {

      if (
        !window.localStorage
      ) {

        return null;

      }


      var testKey =
        "__ubnux_storage_test__";


      window.localStorage.setItem(
        testKey,
        "1"
      );


      window.localStorage.removeItem(
        testKey
      );


      return window.localStorage;

    } catch (error) {

      return null;

    }

  }


  /* =======================================================
     STORAGE
  ====================================================== */

  var storage =
    getStorage();


  /* =======================================================
     SAFE JSON PARSE
  ====================================================== */

  function parseJSON(
    value
  ) {

    if (
      typeof value !==
      "string"
    ) {

      return null;

    }


    try {

      return JSON.parse(
        value
      );

    } catch (error) {

      return null;

    }

  }


  /* =======================================================
     SAFE JSON STRINGIFY
  ====================================================== */

  function stringifyJSON(
    value
  ) {

    try {

      return JSON.stringify(
        value
      );

    } catch (error) {

      return null;

    }

  }


  /* =======================================================
     CURRENT TIMESTAMP
  ====================================================== */

  function now() {

    return Date.now();

  }


  /* =======================================================
     NORMALIZE DATA
  ====================================================== */

  function normalizeData(
    payload
  ) {

    if (
      !payload ||
      typeof payload !==
      "object"
    ) {

      return {

        success: false,

        message: "",

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


    /*
     * Some callers may provide:
     *
     * {
     *   success,
     *   message,
     *   data
     * }
     *
     * Others may provide:
     *
     * {
     *   districts,
     *   categories,
     *   businesses,
     *   businessMeta
     * }
     */


    var source =
      payload.data &&
      typeof payload.data ===
      "object"

        ? payload.data

        : payload;


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


    var businessMeta =
      source.businessMeta &&
      typeof source.businessMeta ===
      "object"

        ? source.businessMeta

        : {

            total:
              businesses.length,

            offset: 0,

            limit:
              businesses.length,

            hasMore: false

          };


    return {

      success:
        payload.success !== false,

      message:
        payload.message ||
        "",

      data: {

        districts:
          districts,

        categories:
          categories,

        businesses:
          businesses,

        businessMeta: {

          total:
            Number(
              businessMeta.total ??
              businesses.length
            ),

          offset:
            Number(
              businessMeta.offset ??
              0
            ),

          limit:
            Number(
              businessMeta.limit ??
              businesses.length
            ),

          hasMore:
            Boolean(
              businessMeta.hasMore
            )

        }

      }

    };

  }


  /* =======================================================
     CREATE CACHE OBJECT
  ====================================================== */

  function createCacheObject(
    payload
  ) {

    var normalized =
      normalizeData(
        payload
      );


    return {

      version:
        CACHE_VERSION,

      timestamp:
        now(),

      ttl:
        getCacheTTL(),

      success:
        normalized.success,

      message:
        normalized.message,

      data:
        normalized.data

    };

  }


  /* =======================================================
     READ RAW CACHE
  ====================================================== */

  function readRawCache(
    key
  ) {

    if (!storage) {

      return null;

    }


    try {

      var raw =
        storage.getItem(
          key
        );


      if (!raw) {

        return null;

      }


      return parseJSON(
        raw
      );

    } catch (error) {

      return null;

    }

  }


  /* =======================================================
     FIND CACHE
  ====================================================== */

  function readCacheObject() {

    var cached =
      readRawCache(
        CACHE_KEY
      );


    if (cached) {

      return cached;

    }


    /*
     * Legacy fallback.
     */

    for (
      var i = 0;
      i < LEGACY_CACHE_KEYS.length;
      i++
    ) {

      var legacy =
        readRawCache(
          LEGACY_CACHE_KEYS[i]
        );


      if (legacy) {

        return legacy;

      }

    }


    return null;

  }


  /* =======================================================
     VALID CACHE CHECK
  ====================================================== */

  function isValidCacheObject(
    cached
  ) {

    if (
      !cached ||
      typeof cached !==
      "object"
    ) {

      return false;

    }


    if (
      !cached.timestamp
    ) {

      return false;

    }


    /*
     * Old cache without version
     * can still be accepted.
     */

    var timestamp =
      Number(
        cached.timestamp
      );


    if (
      !Number.isFinite(
        timestamp
      )
    ) {

      return false;

    }


    var ttl =
      Number(
        cached.ttl ||
        getCacheTTL()
      );


    if (
      !Number.isFinite(
        ttl
      ) ||
      ttl <= 0
    ) {

      return false;

    }


    if (
      now() -
      timestamp >
      ttl
    ) {

      return false;

    }


    if (
      !cached.data ||
      typeof cached.data !==
      "object"
    ) {

      return false;

    }


    return true;

  }


  /* =======================================================
     CACHE AGE
  ====================================================== */

  function getCacheAge() {

    var cached =
      readCacheObject();


    if (
      !cached ||
      !cached.timestamp
    ) {

      return null;

    }


    var age =
      now() -
      Number(
        cached.timestamp
      );


    if (
      !Number.isFinite(
        age
      )
    ) {

      return null;

    }


    return Math.max(
      0,
      age
    );

  }


  /* =======================================================
     CACHE EXPIRY
  ====================================================== */

  function isCacheExpired() {

    var cached =
      readCacheObject();


    if (!cached) {

      return true;

    }


    if (
      !cached.timestamp
    ) {

      return true;

    }


    var ttl =
      Number(
        cached.ttl ||
        getCacheTTL()
      );


    var age =
      now() -
      Number(
        cached.timestamp
      );


    return (
      !Number.isFinite(
        age
      ) ||
      age >
      ttl
    );

  }


  /* =======================================================
     GET CACHE
  ====================================================== */

  function getInitialDataCache(
    options
  ) {

    options =
      options ||
      {};


    var cached =
      readCacheObject();


    if (!cached) {

      return null;

    }


    var expired =
      isCacheExpired();


    /*
     * By default expired cache
     * is not returned.
     *
     * options.allowExpired === true
     * allows stale data.
     */

    if (
      expired &&
      options.allowExpired !== true
    ) {

      return null;

    }


    var normalized =
      normalizeData(
        cached
      );


    return {

      success:
        normalized.success,

      message:
        normalized.message,

      data:
        normalized.data,

      cached:
        true,

      expired:
        expired,

      timestamp:
        cached.timestamp,

      age:
        getCacheAge(),

      ttl:
        Number(
          cached.ttl ||
          getCacheTTL()
        ),

      version:
        cached.version ||
        null

    };

  }


  /* =======================================================
     GET CACHED DATA
  ====================================================== */

  function getCachedData(
    options
  ) {

    var result =
      getInitialDataCache(
        options
      );


    if (!result) {

      return null;

    }


    return result.data;

  }


  /* =======================================================
     GET VALID CACHE DATA
  ====================================================== */

  function getValidCachedData() {

    return getCachedData({
      allowExpired: false
    });

  }


  /* =======================================================
     HAS CACHE
  ====================================================== */

  function hasCache(
    options
  ) {

    options =
      options ||
      {};


    var cached =
      getInitialDataCache(
        options
      );


    return !!cached;

  }


  /* =======================================================
     HAS VALID CACHE
  ====================================================== */

  function hasValidCache() {

    return hasCache({

      allowExpired:
        false

    });

  }


  /* =======================================================
     SAVE CACHE
  ====================================================== */

  function setInitialDataCache(
    payload
  ) {

    if (!storage) {

      return false;

    }


    var cacheObject =
      createCacheObject(
        payload
      );


    var serialized =
      stringifyJSON(
        cacheObject
      );


    if (!serialized) {

      return false;

    }


    try {

      storage.setItem(
        CACHE_KEY,
        serialized
      );


      /*
       * Remove old cache keys
       * after successful write.
       */

      for (
        var i = 0;
        i < LEGACY_CACHE_KEYS.length;
        i++
      ) {

        try {

          storage.removeItem(
            LEGACY_CACHE_KEYS[i]
          );

        } catch (ignore) {}

      }


      return true;

    } catch (error) {

      /*
       * localStorage may be full.
       *
       * Try removing the old cache
       * and writing once more.
       */

      try {

        storage.removeItem(
          CACHE_KEY
        );


        storage.setItem(
          CACHE_KEY,
          serialized
        );


        return true;

      } catch (retryError) {

        return false;

      }

    }

  }


  /* =======================================================
     SAVE CACHED DATA
  ====================================================== */

  function saveCachedData(
    data
  ) {

    return setInitialDataCache(
      data
    );

  }


  /* =======================================================
     UPDATE CACHE
  ====================================================== */

  function updateCache(
    payload
  ) {

    return setInitialDataCache(
      payload
    );

  }


  /* =======================================================
     CLEAR CACHE
  ====================================================== */

  function clearCache() {

    var success =
      false;


    if (!storage) {

      return false;

    }


    try {

      storage.removeItem(
        CACHE_KEY
      );


      success =
        true;

    } catch (error) {

      success =
        false;

    }


    /*
     * Remove legacy keys too.
     */

    for (
      var i = 0;
      i < LEGACY_CACHE_KEYS.length;
      i++
    ) {

      try {

        storage.removeItem(
          LEGACY_CACHE_KEYS[i]
        );

      } catch (ignore) {}

    }


    return success;

  }


  /* =======================================================
     REMOVE EXPIRED CACHE
  ====================================================== */

  function removeExpiredCache() {

    var cached =
      readCacheObject();


    if (!cached) {

      return false;

    }


    if (
      isCacheExpired()
    ) {

      return clearCache();

    }


    return false;

  }


  /* =======================================================
     CACHE INFO
  ====================================================== */

  function getCacheInfo() {

    var cached =
      readCacheObject();


    if (!cached) {

      return {

        exists: false,

        valid: false,

        expired: true,

        timestamp: null,

        age: null,

        ttl:
          getCacheTTL(),

        version:
          CACHE_VERSION,

        size: 0

      };

    }


    var raw =
      storage
        ? storage.getItem(
            CACHE_KEY
          )
        : null;


    return {

      exists: true,

      valid:
        isValidCacheObject(
          cached
        ),

      expired:
        isCacheExpired(),

      timestamp:
        cached.timestamp ||
        null,

      age:
        getCacheAge(),

      ttl:
        Number(
          cached.ttl ||
          getCacheTTL()
        ),

      version:
        cached.version ||
        null,

      size:
        raw
          ? raw.length
          : 0

    };

  }


  /* =======================================================
     CACHE AGE IN SECONDS
  ====================================================== */

  function getCacheAgeSeconds() {

    var age =
      getCacheAge();


    if (
      age === null
    ) {

      return null;

    }


    return Math.floor(
      age / 1000
    );

  }


  /* =======================================================
     CACHE AGE IN MINUTES
  ====================================================== */

  function getCacheAgeMinutes() {

    var age =
      getCacheAge();


    if (
      age === null
    ) {

      return null;

    }


    return Math.floor(
      age / 60000
    );

  }


  /* =======================================================
     MARK CACHE READY
  ====================================================== */

  function markCacheState() {

    try {

      if (
        typeof App.setCacheState ===
        "function"
      ) {

        App.setCacheState(
          hasValidCache()
        );

      }

    } catch (error) {}

  }


  /* =======================================================
     PUBLIC CACHE OBJECT
  ====================================================== */

  var cacheAPI = {

    version:
      CACHE_VERSION,

    key:
      CACHE_KEY,

    getTTL:
      getCacheTTL,

    getInitialDataCache:
      getInitialDataCache,

    getCachedData:
      getCachedData,

    getValidCachedData:
      getValidCachedData,

    setInitialDataCache:
      setInitialDataCache,

    saveCachedData:
      saveCachedData,

    updateCache:
      updateCache,

    hasCache:
      hasCache,

    hasValidCache:
      hasValidCache,

    isCacheExpired:
      isCacheExpired,

    getCacheAge:
      getCacheAge,

    getCacheAgeSeconds:
      getCacheAgeSeconds,

    getCacheAgeMinutes:
      getCacheAgeMinutes,

    getCacheInfo:
      getCacheInfo,

    clearCache:
      clearCache,

    removeExpiredCache:
      removeExpiredCache

  };


  /* =======================================================
     APPLICATION NAMESPACE
  ====================================================== */

  App.cache =
    cacheAPI;


  /* =======================================================
     TOP-LEVEL COMPATIBILITY METHODS
  ====================================================== */

  App.getInitialDataCache =
    getInitialDataCache;


  App.getCachedData =
    getCachedData;


  App.getValidCachedData =
    getValidCachedData;


  App.setInitialDataCache =
    setInitialDataCache;


  App.saveCachedData =
    saveCachedData;


  App.updateCache =
    updateCache;


  App.hasCache =
    hasCache;


  App.hasValidCache =
    hasValidCache;


  App.isCacheExpired =
    isCacheExpired;


  App.getCacheAge =
    getCacheAge;


  App.getCacheInfo =
    getCacheInfo;


  App.clearCache =
    clearCache;


  App.removeExpiredCache =
    removeExpiredCache;


  /* =======================================================
     INITIAL CACHE CLEANUP
  ====================================================== */

  try {

    removeExpiredCache();

  } catch (error) {

    /*
     * Cache cleanup must never
     * stop application startup.
     */

  }


  /* =======================================================
     UPDATE STATE CACHE FLAG
  ====================================================== */

  try {

    markCacheState();

  } catch (error) {}



  /* =======================================================
     READY FLAG
  ====================================================== */

  App.cacheReady =
    true;


  window.UBnux =
    App;

  window.ZilaBiz =
    App;


})(window, document);
