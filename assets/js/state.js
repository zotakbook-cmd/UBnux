/* =========================================================
   UBnux - Application State
   File: assets/js/state.js

   Responsibilities:
   - Single source of truth for application state
   - Businesses
   - Categories
   - Districts
   - Filters
   - Search
   - Pagination
   - Loading
   - Cache status
   - UI state

   IMPORTANT:
   Other modules should use this state instead of creating
   their own duplicate state objects.
   ========================================================= */

(function (window) {

  "use strict";


  /* =======================================================
     NAMESPACE
     ======================================================= */

  var App =
    window.UBnux ||
    window.ZilaBiz ||
    {};

  window.UBnux = App;

  window.ZilaBiz = App;


  /* =======================================================
     CONFIG
     ======================================================= */

  var CONFIG =
    window.UBNux_CONFIG ||
    window.ZILABIZ_CONFIG ||
    {};


  /* =======================================================
     DEFAULT VALUES
     ======================================================= */

  var DEFAULT_DISTRICT =
    CONFIG.DEFAULT_DISTRICT ||
    "ALL";


  var DEFAULT_CATEGORY =
    CONFIG.DEFAULT_CATEGORY ||
    "ALL";


  var DEFAULT_SORT =
    CONFIG.DEFAULT_SORT ||
    "featured";


  var DEFAULT_PAGE_SIZE =
    Number(
      CONFIG.BUSINESS_PAGE_SIZE
    ) || 18;


  var DEFAULT_MAX_SEARCH_RESULTS =
    Number(
      CONFIG.MAX_SEARCH_RESULTS
    ) || 100;


  /* =======================================================
     DEFAULT STATE
     ======================================================= */

  var DEFAULT_STATE = {

    /* -----------------------------------------------------
       APPLICATION
       ----------------------------------------------------- */

    initialized: false,

    initializing: false,

    loading: false,

    refreshing: false,

    error: null,


    /* -----------------------------------------------------
       DATA
       ----------------------------------------------------- */

    districts: [],

    categories: [],

    businesses: [],

    filteredBusinesses: [],


    /* -----------------------------------------------------
       BUSINESS META
       ----------------------------------------------------- */

    businessMeta: {

      total: 0,

      offset: 0,

      limit: DEFAULT_PAGE_SIZE,

      hasMore: false

    },


    /* -----------------------------------------------------
       FILTERS
       ----------------------------------------------------- */

    search: "",

    district: DEFAULT_DISTRICT,

    selectedDistrict: DEFAULT_DISTRICT,

    category: DEFAULT_CATEGORY,

    selectedCategory: DEFAULT_CATEGORY,

    sort: DEFAULT_SORT,


    /* -----------------------------------------------------
       PAGINATION
       ----------------------------------------------------- */

    page: 1,

    pageSize: DEFAULT_PAGE_SIZE,

    hasMore: false,


    /* -----------------------------------------------------
       CACHE
       ----------------------------------------------------- */

    cacheLoaded: false,

    cacheTimestamp: 0,

    cacheSource: null,


    /* -----------------------------------------------------
       UI
       ----------------------------------------------------- */

    selectedBusiness: null,

    activeModal: null,

    mobileMenuOpen: false,

    locationDetected: false,

    locationLoading: false,

    searchFocused: false,

    searchResultCount: 0,

    lastUpdated: null,


    /* -----------------------------------------------------
       REQUEST
       ----------------------------------------------------- */

    requestId: 0,

    lastRequestId: null

  };


  /* =======================================================
     CLONE DEFAULT STATE
     ======================================================= */

  function cloneDefaultState() {

    return {

      initialized:
        DEFAULT_STATE.initialized,

      initializing:
        DEFAULT_STATE.initializing,

      loading:
        DEFAULT_STATE.loading,

      refreshing:
        DEFAULT_STATE.refreshing,

      error:
        DEFAULT_STATE.error,


      districts:
        [],

      categories:
        [],

      businesses:
        [],

      filteredBusinesses:
        [],


      businessMeta: {

        total: 0,

        offset: 0,

        limit:
          DEFAULT_PAGE_SIZE,

        hasMore: false

      },


      search:
        DEFAULT_STATE.search,

      district:
        DEFAULT_STATE.district,

      selectedDistrict:
        DEFAULT_STATE.selectedDistrict,

      category:
        DEFAULT_STATE.category,

      selectedCategory:
        DEFAULT_STATE.selectedCategory,

      sort:
        DEFAULT_STATE.sort,


      page: 1,

      pageSize:
        DEFAULT_PAGE_SIZE,

      hasMore: false,


      cacheLoaded: false,

      cacheTimestamp: 0,

      cacheSource: null,


      selectedBusiness: null,

      activeModal: null,

      mobileMenuOpen: false,

      locationDetected: false,

      locationLoading: false,

      searchFocused: false,

      searchResultCount: 0,

      lastUpdated: null,


      requestId: 0,

      lastRequestId: null

    };

  }


  /* =======================================================
     INTERNAL STATE
     ======================================================= */

  var state =
    cloneDefaultState();


  /* =======================================================
     NORMALIZATION HELPERS
     ======================================================= */

  function normalizeArray(value) {

    return Array.isArray(value)
      ? value
      : [];

  }


  function normalizeString(value) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }

    return String(value).trim();

  }


  function normalizeFilter(value, fallback) {

    var result =
      normalizeString(value);

    return result
      ? result
      : fallback;

  }


  /* =======================================================
     GET STATE
     ======================================================= */

  function getState() {

    return state;

  }


  /* =======================================================
     GET STATE SNAPSHOT
     ======================================================= */

  function getStateSnapshot() {

    return {

      initialized:
        state.initialized,

      initializing:
        state.initializing,

      loading:
        state.loading,

      refreshing:
        state.refreshing,

      error:
        state.error,


      districts:
        state.districts.slice(),

      categories:
        state.categories.slice(),

      businesses:
        state.businesses.slice(),

      filteredBusinesses:
        state.filteredBusinesses.slice(),


      businessMeta:
        Object.assign(
          {},
          state.businessMeta
        ),


      search:
        state.search,

      district:
        state.district,

      selectedDistrict:
        state.selectedDistrict,

      category:
        state.category,

      selectedCategory:
        state.selectedCategory,

      sort:
        state.sort,


      page:
        state.page,

      pageSize:
        state.pageSize,

      hasMore:
        state.hasMore,


      cacheLoaded:
        state.cacheLoaded,

      cacheTimestamp:
        state.cacheTimestamp,

      cacheSource:
        state.cacheSource,


      selectedBusiness:
        state.selectedBusiness,

      activeModal:
        state.activeModal,

      mobileMenuOpen:
        state.mobileMenuOpen,

      locationDetected:
        state.locationDetected,

      locationLoading:
        state.locationLoading,

      searchFocused:
        state.searchFocused,

      searchResultCount:
        state.searchResultCount,

      lastUpdated:
        state.lastUpdated,

      requestId:
        state.requestId,

      lastRequestId:
        state.lastRequestId

    };

  }


  /* =======================================================
     SET STATE
     ======================================================= */

  function setState(updates) {

    if (
      !updates ||
      typeof updates !== "object"
    ) {

      return state;

    }


    Object.keys(updates)
      .forEach(function (key) {

        if (
          Object.prototype.hasOwnProperty
            .call(state, key)
        ) {

          state[key] =
            updates[key];

        }

      });


    return state;

  }


  /* =======================================================
     UPDATE STATE
     ======================================================= */

  function updateState(updates) {

    return setState(updates);

  }


  /* =======================================================
     SEARCH
     ======================================================= */

  function getSearch() {

    return state.search;

  }


  function setSearch(value) {

    state.search =
      normalizeString(value);

    state.page = 1;

    return state.search;

  }


  /* =======================================================
     DISTRICT
     ======================================================= */

  function getDistrict() {

    return state.district;

  }


  function getSelectedDistrict() {

    return state.selectedDistrict;

  }


  function setDistrict(value) {

    var district =
      normalizeFilter(
        value,
        DEFAULT_DISTRICT
      );


    state.district =
      district;

    state.selectedDistrict =
      district;

    state.page = 1;


    return district;

  }


  function setSelectedDistrict(value) {

    return setDistrict(value);

  }


  /* =======================================================
     CATEGORY
     ======================================================= */

  function getCategory() {

    return state.category;

  }


  function getSelectedCategory() {

    return state.selectedCategory;

  }


  function setCategory(value) {

    var category =
      normalizeFilter(
        value,
        DEFAULT_CATEGORY
      );


    state.category =
      category;

    state.selectedCategory =
      category;

    state.page = 1;


    return category;

  }


  function setSelectedCategory(value) {

    return setCategory(value);

  }


  /* =======================================================
     SORT
     ======================================================= */

  function getSort() {

    return state.sort;

  }


  function setSort(value) {

    state.sort =
      normalizeFilter(
        value,
        DEFAULT_SORT
      );


    state.page = 1;


    return state.sort;

  }


  /* =======================================================
     DISTRICTS
     ======================================================= */

  function getDistricts() {

    return state.districts;

  }


  function setDistricts(value) {

    state.districts =
      normalizeArray(value);


    return state.districts;

  }


  /* =======================================================
     CATEGORIES
     ======================================================= */

  function getCategories() {

    return state.categories;

  }


  function setCategories(value) {

    state.categories =
      normalizeArray(value);


    return state.categories;

  }


  /* =======================================================
     BUSINESSES
     ======================================================= */

  function getBusinesses() {

    return state.businesses;

  }


  function setBusinesses(value) {

    state.businesses =
      normalizeArray(value);


    state.page =
      1;


    return state.businesses;

  }


  /* =======================================================
     FILTERED BUSINESSES
     ======================================================= */

  function getFilteredBusinesses() {

    return state.filteredBusinesses;

  }


  function setFilteredBusinesses(value) {

    state.filteredBusinesses =
      normalizeArray(value);


    state.page =
      1;


    state.searchResultCount =
      state.filteredBusinesses.length;


    state.hasMore =
      (
        state.filteredBusinesses.length >
        state.pageSize
      );


    return state.filteredBusinesses;

  }


  /* =======================================================
     BUSINESS META
     ======================================================= */

  function getBusinessMeta() {

    return state.businessMeta;

  }


  function setBusinessMeta(value) {

    if (
      !value ||
      typeof value !== "object"
    ) {

      value = {};

    }


    state.businessMeta = {

      total:
        Number(value.total) || 0,

      offset:
        Number(value.offset) || 0,

      limit:
        Number(value.limit) ||
        state.pageSize,

      hasMore:
        value.hasMore === true

    };


    state.hasMore =
      state.businessMeta.hasMore;


    return state.businessMeta;

  }


  /* =======================================================
     PAGINATION
     ======================================================= */

  function getPage() {

    return state.page;

  }


  function setPage(value) {

    var page =
      parseInt(
        value,
        10
      );


    if (
      !Number.isFinite(page) ||
      page < 1
    ) {

      page = 1;

    }


    state.page =
      page;


    return state.page;

  }


  function getPageSize() {

    return state.pageSize;

  }


  function setPageSize(value) {

    var size =
      parseInt(
        value,
        10
      );


    if (
      !Number.isFinite(size) ||
      size < 1
    ) {

      size =
        DEFAULT_PAGE_SIZE;

    }


    state.pageSize =
      size;


    return size;

  }


  function resetPagination() {

    state.page = 1;

    state.hasMore =
      state.filteredBusinesses.length >
      state.pageSize;


    return state.page;

  }


  function loadNextPage() {

    var total =
      state.filteredBusinesses.length;


    var nextStart =
      state.page *
      state.pageSize;


    if (
      nextStart >= total
    ) {

      state.hasMore =
        false;

      return false;

    }


    state.page += 1;


    state.hasMore =
      (
        state.page *
        state.pageSize
      ) < total;


    return true;

  }


  function getVisibleBusinesses() {

    var start =
      0;

    var end =
      state.page *
      state.pageSize;


    return state.filteredBusinesses
      .slice(
        start,
        end
      );

  }


  /* =======================================================
     SELECTED BUSINESS
     ======================================================= */

  function getSelectedBusiness() {

    return state.selectedBusiness;

  }


  function setSelectedBusiness(value) {

    state.selectedBusiness =
      value || null;


    return state.selectedBusiness;

  }


  function clearSelectedBusiness() {

    state.selectedBusiness =
      null;


    return null;

  }


  /* =======================================================
     LOADING
     ======================================================= */

  function isLoading() {

    return state.loading;

  }


  function setLoading(value) {

    state.loading =
      value === true;


    return state.loading;

  }


  function isRefreshing() {

    return state.refreshing;

  }


  function setRefreshing(value) {

    state.refreshing =
      value === true;


    return state.refreshing;

  }


  /* =======================================================
     INITIALIZATION
     ======================================================= */

  function isInitialized() {

    return state.initialized;

  }


  function markInitialized(value) {

    state.initialized =
      value !== false;


    return state.initialized;

  }


  function setInitializing(value) {

    state.initializing =
      value === true;


    return state.initializing;

  }


  /* =======================================================
     ERROR
     ======================================================= */

  function getError() {

    return state.error;

  }


  function setError(error) {

    state.error =
      error || null;


    return state.error;

  }


  function clearError() {

    state.error =
      null;


    return null;

  }


  /* =======================================================
     CACHE
     ======================================================= */

  function setCacheState(

    loaded,
    timestamp,
    source

  ) {

    state.cacheLoaded =
      loaded === true;


    state.cacheTimestamp =
      Number(timestamp) || 0;


    state.cacheSource =
      source || null;


    return {

      loaded:
        state.cacheLoaded,

      timestamp:
        state.cacheTimestamp,

      source:
        state.cacheSource

    };

  }


  function isCacheLoaded() {

    return state.cacheLoaded;

  }


  function getCacheTimestamp() {

    return state.cacheTimestamp;

  }


  function getCacheSource() {

    return state.cacheSource;

  }


  /* =======================================================
     UI
     ======================================================= */

  function setActiveModal(value) {

    state.activeModal =
      value || null;


    return state.activeModal;

  }


  function getActiveModal() {

    return state.activeModal;

  }


  function setMobileMenuOpen(value) {

    state.mobileMenuOpen =
      value === true;


    return state.mobileMenuOpen;

  }


  function isMobileMenuOpen() {

    return state.mobileMenuOpen;

  }


  function setLocationDetected(value) {

    state.locationDetected =
      value === true;


    return state.locationDetected;

  }


  function setLocationLoading(value) {

    state.locationLoading =
      value === true;


    return state.locationLoading;

  }


  function setSearchFocused(value) {

    state.searchFocused =
      value === true;


    return state.searchFocused;

  }


  /* =======================================================
     SEARCH RESULT COUNT
     ======================================================= */

  function getSearchResultCount() {

    return state.searchResultCount;

  }


  function setSearchResultCount(value) {

    state.searchResultCount =
      Number(value) || 0;


    return state.searchResultCount;

  }


  /* =======================================================
     REQUEST ID
     ======================================================= */

  function createRequestId() {

    state.requestId += 1;

    state.lastRequestId =
      state.requestId;


    return state.requestId;

  }


  function getRequestId() {

    return state.requestId;

  }


  function getLastRequestId() {

    return state.lastRequestId;

  }


  /* =======================================================
     RESET FILTERS
     ======================================================= */

  function resetFilters() {

    state.search =
      "";

    state.district =
      DEFAULT_DISTRICT;

    state.selectedDistrict =
      DEFAULT_DISTRICT;

    state.category =
      DEFAULT_CATEGORY;

    state.selectedCategory =
      DEFAULT_CATEGORY;

    state.sort =
      DEFAULT_SORT;

    state.page =
      1;


    return {

      search:
        state.search,

      district:
        state.district,

      category:
        state.category,

      sort:
        state.sort

    };

  }


  /* =======================================================
     RESET DATA
     ======================================================= */

  function resetData() {

    state.districts = [];

    state.categories = [];

    state.businesses = [];

    state.filteredBusinesses = [];

    state.businessMeta = {

      total: 0,

      offset: 0,

      limit:
        state.pageSize,

      hasMore: false

    };

    state.page = 1;

    state.hasMore = false;

    state.searchResultCount = 0;


    return state;

  }


  /* =======================================================
     RESET UI
     ======================================================= */

  function resetUI() {

    state.selectedBusiness = null;

    state.activeModal = null;

    state.mobileMenuOpen = false;

    state.locationDetected = false;

    state.locationLoading = false;

    state.searchFocused = false;


    return state;

  }


  /* =======================================================
     RESET REQUEST STATE
     ======================================================= */

  function resetRequestState() {

    state.loading = false;

    state.refreshing = false;

    state.error = null;

    state.initializing = false;


    return state;

  }


  /* =======================================================
     RESET CACHE STATE
     ======================================================= */

  function resetCacheState() {

    state.cacheLoaded = false;

    state.cacheTimestamp = 0;

    state.cacheSource = null;


    return state;

  }


  /* =======================================================
     RESET COMPLETE STATE
     ======================================================= */

  function resetState() {

    state =
      cloneDefaultState();


    return state;

  }


  /* =======================================================
     RESET DATA BUT KEEP FILTERS
     ======================================================= */

  function resetDataKeepFilters() {

    var search =
      state.search;

    var district =
      state.district;

    var selectedDistrict =
      state.selectedDistrict;

    var category =
      state.category;

    var selectedCategory =
      state.selectedCategory;

    var sort =
      state.sort;


    resetData();


    state.search =
      search;

    state.district =
      district;

    state.selectedDistrict =
      selectedDistrict;

    state.category =
      category;

    state.selectedCategory =
      selectedCategory;

    state.sort =
      sort;


    return state;

  }


  /* =======================================================
     DEFAULT STATE
     ======================================================= */

  function getDefaultState() {

    return cloneDefaultState();

  }


  function getStateConfig() {

    return {

      defaultDistrict:
        DEFAULT_DISTRICT,

      defaultCategory:
        DEFAULT_CATEGORY,

      defaultSort:
        DEFAULT_SORT,

      defaultPageSize:
        DEFAULT_PAGE_SIZE,

      maxSearchResults:
        DEFAULT_MAX_SEARCH_RESULTS

    };

  }


  /* =======================================================
     PUBLIC API
     ======================================================= */

  App.getState =
    getState;

  App.getStateSnapshot =
    getStateSnapshot;

  App.setState =
    setState;

  App.updateState =
    updateState;


  /* Search */

  App.getSearch =
    getSearch;

  App.setSearch =
    setSearch;


  /* District */

  App.getDistrict =
    getDistrict;

  App.getSelectedDistrict =
    getSelectedDistrict;

  App.setDistrict =
    setDistrict;

  App.setSelectedDistrict =
    setSelectedDistrict;


  /* Category */

  App.getCategory =
    getCategory;

  App.getSelectedCategory =
    getSelectedCategory;

  App.setCategory =
    setCategory;

  App.setSelectedCategory =
    setSelectedCategory;


  /* Sort */

  App.getSort =
    getSort;

  App.setSort =
    setSort;


  /* Data */

  App.getDistricts =
    getDistricts;

  App.setDistricts =
    setDistricts;

  App.getCategories =
    getCategories;

  App.setCategories =
    setCategories;

  App.getBusinesses =
    getBusinesses;

  App.setBusinesses =
    setBusinesses;

  App.getFilteredBusinesses =
    getFilteredBusinesses;

  App.setFilteredBusinesses =
    setFilteredBusinesses;


  /* Business meta */

  App.getBusinessMeta =
    getBusinessMeta;

  App.setBusinessMeta =
    setBusinessMeta;


  /* Pagination */

  App.getPage =
    getPage;

  App.setPage =
    setPage;

  App.getPageSize =
    getPageSize;

  App.setPageSize =
    setPageSize;

  App.resetPagination =
    resetPagination;

  App.loadNextPage =
    loadNextPage;

  App.getVisibleBusinesses =
    getVisibleBusinesses;


  /* Selected business */

  App.getSelectedBusiness =
    getSelectedBusiness;

  App.setSelectedBusiness =
    setSelectedBusiness;

  App.clearSelectedBusiness =
    clearSelectedBusiness;


  /* Loading */

  App.isLoading =
    isLoading;

  App.setLoading =
    setLoading;

  App.isRefreshing =
    isRefreshing;

  App.setRefreshing =
    setRefreshing;


  /* Initialization */

  App.isInitialized =
    isInitialized;

  App.markInitialized =
    markInitialized;

  App.setInitializing =
    setInitializing;


  /* Error */

  App.getError =
    getError;

  App.setError =
    setError;

  App.clearError =
    clearError;


  /* Cache */

  App.setCacheState =
    setCacheState;

  App.isCacheLoaded =
    isCacheLoaded;

  App.getCacheTimestamp =
    getCacheTimestamp;

  App.getCacheSource =
    getCacheSource;


  /* UI */

  App.setActiveModal =
    setActiveModal;

  App.getActiveModal =
    getActiveModal;

  App.setMobileMenuOpen =
    setMobileMenuOpen;

  App.isMobileMenuOpen =
    isMobileMenuOpen;

  App.setLocationDetected =
    setLocationDetected;

  App.setLocationLoading =
    setLocationLoading;

  App.setSearchFocused =
    setSearchFocused;


  /* Search count */

  App.getSearchResultCount =
    getSearchResultCount;

  App.setSearchResultCount =
    setSearchResultCount;


  /* Request */

  App.createRequestId =
    createRequestId;

  App.getRequestId =
    getRequestId;

  App.getLastRequestId =
    getLastRequestId;


  /* Reset */

  App.resetFilters =
    resetFilters;

  App.resetData =
    resetData;

  App.resetUI =
    resetUI;

  App.resetRequestState =
    resetRequestState;

  App.resetCacheState =
    resetCacheState;

  App.resetState =
    resetState;

  App.resetDataKeepFilters =
    resetDataKeepFilters;


  /* Defaults */

  App.getDefaultState =
    getDefaultState;

  App.getStateConfig =
    getStateConfig;


  /* Compatibility */

  App.state =
    state;


  /* =======================================================
     READY
     ======================================================= */

  App.stateReady =
    true;


  if (CONFIG.DEBUG) {

    console.log(
      "[UBnux] State module loaded."
    );

    console.log(
      "[UBnux] Initial state:",
      state
    );

  }


})(window);