/* =========================================================
   UBnux - Business Filters & Search
   File: assets/js/filters.js

   Responsibilities:
   - Business search
   - District filtering
   - Category filtering
   - Sorting
   - Active business filtering
   - Search scoring
   - Search highlighting
   - Suggestions
   - Filter state synchronization

   Namespace:
   window.UBnux
   ========================================================= */

(function (window, document) {

  "use strict";


  /* =======================================================
     SHARED NAMESPACE
     ======================================================= */

  window.UBnux =
    window.UBnux ||
    window.ZilaBiz ||
    {};

  window.ZilaBiz =
    window.UBnux;

  var App =
    window.UBnux;


  /* =======================================================
     CONFIG
     ======================================================= */

  var CONFIG =
    window.UBNux_CONFIG ||
    window.ZILABIZ_CONFIG ||
    {};


  /* =======================================================
     DEFAULTS
     ======================================================= */

  var ALL_VALUE = "ALL";

  var DEFAULT_SEARCH_FIELDS = [

    "BusinessName",
    "CategoryName",
    "Category",
    "Area",
    "Address",
    "Pincode",
    "Description",
    "OwnerName",
    "Mobile",
    "WhatsApp",
    "DistrictName",
    "Products",
    "Services"

  ];


  var SEARCH_FIELDS =
    Array.isArray(CONFIG.SEARCH_FIELDS) &&
    CONFIG.SEARCH_FIELDS.length
      ? CONFIG.SEARCH_FIELDS
      : DEFAULT_SEARCH_FIELDS;


  /* =======================================================
     SEARCH INDEX
     ======================================================= */

  var searchIndex =
    typeof WeakMap !== "undefined"
      ? new WeakMap()
      : null;


  /* =======================================================
     GENERIC HELPERS
     ======================================================= */

  function valueToString(value) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }

    if (
      Array.isArray(value)
    ) {

      return value
        .map(valueToString)
        .join(" ");

    }

    if (
      typeof value === "object"
    ) {

      try {

        return JSON.stringify(value);

      } catch (error) {

        return "";

      }

    }

    return String(value);

  }


  function normalizeText(value) {

    return valueToString(value)

      .toLowerCase()

      .normalize("NFKD")

      .replace(
        /[\u0300-\u036f]/g,
        ""
      )

      .replace(
        /[^\p{L}\p{N}\s]/gu,
        " "
      )

      .replace(
        /\s+/g,
        " "
      )

      .trim();

  }


  function compactText(value) {

    return normalizeText(value)
      .replace(/\s+/g, "");

  }


  function tokenize(value) {

    var normalized =
      normalizeText(value);

    if (!normalized) {

      return [];

    }

    return normalized
      .split(" ")
      .filter(Boolean);

  }


  /* =======================================================
     CASE-INSENSITIVE FIELD LOOKUP
     ======================================================= */

  function getFieldValue(
    business,
    field
  ) {

    if (
      !business ||
      !field
    ) {

      return "";

    }

    if (
      Object.prototype.hasOwnProperty.call(
        business,
        field
      )
    ) {

      return business[field];

    }

    var target =
      String(field)
        .toLowerCase();

    var keys =
      Object.keys(business);

    for (
      var i = 0;
      i < keys.length;
      i++
    ) {

      if (
        String(keys[i])
          .toLowerCase() === target
      ) {

        return business[keys[i]];

      }

    }

    return "";

  }


  /* =======================================================
     CATEGORY
     ======================================================= */

  function getCategoryName(
    business
  ) {

    if (!business) {

      return "";

    }

    var value =
      getFieldValue(
        business,
        "CategoryName"
      );

    if (
      value !== null &&
      value !== undefined &&
      String(value).trim()
    ) {

      return String(value).trim();

    }

    var fields = [

      "Category",
      "categoryName",
      "category",
      "CategoryTitle",
      "Category_Name"

    ];

    for (
      var i = 0;
      i < fields.length;
      i++
    ) {

      value =
        getFieldValue(
          business,
          fields[i]
        );

      if (
        value !== null &&
        value !== undefined &&
        String(value).trim()
      ) {

        return String(value).trim();

      }

    }

    return "";

  }


  /* =======================================================
     DISTRICT
     ======================================================= */

  function getDistrictName(
    business
  ) {

    if (!business) {

      return "";

    }

    var fields = [

      "DistrictName",
      "District",
      "districtName",
      "district"

    ];

    for (
      var i = 0;
      i < fields.length;
      i++
    ) {

      var value =
        getFieldValue(
          business,
          fields[i]
        );

      if (
        value !== null &&
        value !== undefined &&
        String(value).trim()
      ) {

        return String(value).trim();

      }

    }

    return "";

  }


  /* =======================================================
     PRODUCTS
     ======================================================= */

  function getProductsText(
    business
  ) {

    if (!business) {

      return "";

    }

    var fields = [

      "Products",
      "Product",
      "ProductName",
      "ProductNames",
      "ProductsText"

    ];

    var result = [];

    for (
      var i = 0;
      i < fields.length;
      i++
    ) {

      var value =
        getFieldValue(
          business,
          fields[i]
        );

      if (
        value !== null &&
        value !== undefined &&
        String(value).trim()
      ) {

        result.push(
          String(value)
        );

      }

    }

    return result.join(" ");

  }


  /* =======================================================
     SERVICES
     ======================================================= */

  function getServicesText(
    business
  ) {

    if (!business) {

      return "";

    }

    var fields = [

      "Services",
      "Service",
      "ServiceName",
      "ServiceNames",
      "ServicesText"

    ];

    var result = [];

    for (
      var i = 0;
      i < fields.length;
      i++
    ) {

      var value =
        getFieldValue(
          business,
          fields[i]
        );

      if (
        value !== null &&
        value !== undefined &&
        String(value).trim()
      ) {

        result.push(
          String(value)
        );

      }

    }

    return result.join(" ");

  }


  /* =======================================================
     BUSINESS ID
     ======================================================= */

  function getBusinessId(
    business
  ) {

    if (!business) {

      return "";

    }

    var fields = [

      "BusinessID",
      "BusinessId",
      "businessID",
      "businessId",
      "ID",
      "Id",
      "id"

    ];

    for (
      var i = 0;
      i < fields.length;
      i++
    ) {

      var value =
        getFieldValue(
          business,
          fields[i]
        );

      if (
        value !== null &&
        value !== undefined &&
        String(value).trim()
      ) {

        return String(value).trim();

      }

    }

    return "";

  }


  /* =======================================================
     SEARCH INDEX BUILDER
     ======================================================= */

  function buildBusinessIndex(
    business
  ) {

    if (!business) {

      return {

        all: "",
        compact: "",
        fields: {},
        tokens: []

      };

    }


    if (searchIndex) {

      var cached =
        searchIndex.get(
          business
        );

      if (cached) {

        return cached;

      }

    }


    var fields = {};

    var allParts = [];


    for (
      var i = 0;
      i < SEARCH_FIELDS.length;
      i++
    ) {

      var field =
        SEARCH_FIELDS[i];

      var value =
        getFieldValue(
          business,
          field
        );

      var normalized =
        normalizeText(value);

      fields[field] =
        normalized;

      if (normalized) {

        allParts.push(
          normalized
        );

      }

    }


    var category =
      normalizeText(
        getCategoryName(business)
      );

    var district =
      normalizeText(
        getDistrictName(business)
      );

    var products =
      normalizeText(
        getProductsText(business)
      );

    var services =
      normalizeText(
        getServicesText(business)
      );


    if (category) {

      fields.__category =
        category;

      allParts.push(
        category
      );

    }


    if (district) {

      fields.__district =
        district;

      allParts.push(
        district
      );

    }


    if (products) {

      fields.__products =
        products;

      allParts.push(
        products
      );

    }


    if (services) {

      fields.__services =
        services;

      allParts.push(
        services
      );

    }


    var all =
      allParts
        .join(" ")
        .replace(
          /\s+/g,
          " "
        )
        .trim();


    var index = {

      all: all,

      compact:
        all.replace(
          /\s+/g,
          ""
        ),

      fields: fields,

      tokens:
        all
          ? all.split(" ")
          : []

    };


    if (searchIndex) {

      searchIndex.set(
        business,
        index
      );

    }


    return index;

  }


  /* =======================================================
     CLEAR SEARCH INDEX
     ======================================================= */

  function clearSearchIndex() {

    searchIndex =
      typeof WeakMap !== "undefined"
        ? new WeakMap()
        : null;

  }


  /* =======================================================
     DISTRICT MATCH
     ======================================================= */

  function matchesDistrict(
    business,
    district
  ) {

    if (
      !district ||
      String(district)
        .toUpperCase() === ALL_VALUE
    ) {

      return true;

    }


    var target =
      normalizeText(district);


    if (!target) {

      return true;

    }


    var districtIdFields = [

      "DistrictID",
      "DistrictId",
      "districtID",
      "districtId",
      "DistrictCode",
      "districtCode"

    ];


    for (
      var i = 0;
      i < districtIdFields.length;
      i++
    ) {

      var id =
        getFieldValue(
          business,
          districtIdFields[i]
        );

      if (
        normalizeText(id) ===
        target
      ) {

        return true;

      }

    }


    var name =
      normalizeText(
        getDistrictName(
          business
        )
      );


    return (
      name === target ||
      name.indexOf(target) !== -1 ||
      target.indexOf(name) !== -1
    );

  }


  /* =======================================================
     CATEGORY MATCH
     ======================================================= */

  function matchesCategory(
    business,
    category
  ) {

    if (
      !category ||
      String(category)
        .toUpperCase() === ALL_VALUE
    ) {

      return true;

    }


    var target =
      normalizeText(category);


    if (!target) {

      return true;

    }


    var categoryIdFields = [

      "CategoryID",
      "CategoryId",
      "categoryID",
      "categoryId",
      "CategoryCode",
      "categoryCode"

    ];


    for (
      var i = 0;
      i < categoryIdFields.length;
      i++
    ) {

      var id =
        getFieldValue(
          business,
          categoryIdFields[i]
        );

      if (
        normalizeText(id) ===
        target
      ) {

        return true;

      }

    }


    var name =
      normalizeText(
        getCategoryName(
          business
        )
      );


    return (
      name === target ||
      name.indexOf(target) !== -1 ||
      target.indexOf(name) !== -1
    );

  }


  /* =======================================================
     ACTIVE BUSINESS
     ======================================================= */

  function isBusinessActive(
    business
  ) {

    if (!business) {

      return false;

    }


    var statusFields = [

      "Status",
      "BusinessStatus",
      "ListingStatus",
      "ActiveStatus",
      "IsActive",
      "Active",
      "Availability"

    ];


    var foundStatus =
      false;


    for (
      var i = 0;
      i < statusFields.length;
      i++
    ) {

      var value =
        getFieldValue(
          business,
          statusFields[i]
        );


      if (
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
      ) {

        foundStatus =
          true;

        var status =
          normalizeText(value);


        if (
          status === "active" ||
          status === "open" ||
          status === "available" ||
          status === "live" ||
          status === "published" ||
          status === "approved" ||
          status === "yes" ||
          status === "true" ||
          status === "1"
        ) {

          return true;

        }


        if (
          status === "inactive" ||
          status === "closed" ||
          status === "unavailable" ||
          status === "offline" ||
          status === "disabled" ||
          status === "blocked" ||
          status === "no" ||
          status === "false" ||
          status === "0"
        ) {

          return false;

        }

      }

    }


    /*
     * If no recognizable status exists,
     * keep the business visible.
     */

    if (!foundStatus) {

      return true;

    }


    /*
     * Unknown status:
     * keep visible rather than hiding
     * potentially valid businesses.
     */

    return true;

  }


  /* =======================================================
     SEARCH SCORE
     ======================================================= */

  function calculateSearchScore(
    business,
    query
  ) {

    if (!business) {

      return 0;

    }


    var normalizedQuery =
      normalizeText(query);


    if (!normalizedQuery) {

      return 0;

    }


    var compactQuery =
      compactText(
        normalizedQuery
      );


    var index =
      buildBusinessIndex(
        business
      );


    var score = 0;


    var name =
      normalizeText(
        getFieldValue(
          business,
          "BusinessName"
        ) ||
        getFieldValue(
          business,
          "Name"
        ) ||
        getFieldValue(
          business,
          "Title"
        )
      );


    var category =
      normalizeText(
        getCategoryName(
          business
        )
      );


    var area =
      normalizeText(
        getFieldValue(
          business,
          "Area"
        )
      );


    var district =
      normalizeText(
        getDistrictName(
          business
        )
      );


    if (
      name === normalizedQuery
    ) {

      score += 1000;

    }
    else if (
      name.indexOf(
        normalizedQuery
      ) === 0
    ) {

      score += 700;

    }
    else if (
      name.indexOf(
        normalizedQuery
      ) !== -1
    ) {

      score += 500;

    }


    if (
      category === normalizedQuery
    ) {

      score += 800;

    }
    else if (
      category.indexOf(
        normalizedQuery
      ) !== -1
    ) {

      score += 400;

    }


    if (
      area === normalizedQuery
    ) {

      score += 700;

    }
    else if (
      area.indexOf(
        normalizedQuery
      ) !== -1
    ) {

      score += 350;

    }


    if (
      district === normalizedQuery
    ) {

      score += 500;

    }


    if (
      index.all.indexOf(
        normalizedQuery
      ) !== -1
    ) {

      score += 200;

    }


    if (
      compactQuery &&
      index.compact.indexOf(
        compactQuery
      ) !== -1
    ) {

      score += 150;

    }


    var queryTokens =
      tokenize(
        normalizedQuery
      );


    for (
      var i = 0;
      i < queryTokens.length;
      i++
    ) {

      var token =
        queryTokens[i];

      if (
        index.tokens.indexOf(
          token
        ) !== -1
      ) {

        score += 75;

      }

    }


    return score;

  }


  /* =======================================================
     SEARCH MATCH
     ======================================================= */

  function matchesSearch(
    business,
    query
  ) {

    var normalizedQuery =
      normalizeText(query);


    if (!normalizedQuery) {

      return true;

    }


    var index =
      buildBusinessIndex(
        business
      );


    if (!index.all) {

      return false;

    }


    if (
      index.all.indexOf(
        normalizedQuery
      ) !== -1
    ) {

      return true;

    }


    var compactQuery =
      compactText(
        normalizedQuery
      );


    if (
      compactQuery &&
      index.compact.indexOf(
        compactQuery
      ) !== -1
    ) {

      return true;

    }


    var queryTokens =
      tokenize(
        normalizedQuery
      );


    if (!queryTokens.length) {

      return false;

    }


    /*
     * Every query token must match
     * somewhere in the indexed text.
     */

    for (
      var i = 0;
      i < queryTokens.length;
      i++
    ) {

      if (
        index.all.indexOf(
          queryTokens[i]
        ) === -1
      ) {

        return false;

      }

    }


    return true;

  }


  /* =======================================================
     SORT HELPERS
     ======================================================= */

  function numberValue(
    value
  ) {

    var number =
      parseFloat(
        String(value)
          .replace(
            /[^0-9.-]/g,
            ""
          )
      );


    return isNaN(number)
      ? 0
      : number;

  }


  function getRating(
    business
  ) {

    return numberValue(
      getFieldValue(
        business,
        "Rating"
      ) ||
      getFieldValue(
        business,
        "AverageRating"
      )
    );

  }


  function getReviewCount(
    business
  ) {

    return numberValue(
      getFieldValue(
        business,
        "ReviewCount"
      ) ||
      getFieldValue(
        business,
        "Reviews"
      ) ||
      getFieldValue(
        business,
        "TotalReviews"
      )
    );

  }


  function isFeatured(
    business
  ) {

    var value =
      normalizeText(
        getFieldValue(
          business,
          "Featured"
        ) ||
        getFieldValue(
          business,
          "IsFeatured"
        )
      );


    return (
      value === "yes" ||
      value === "true" ||
      value === "1" ||
      value === "featured"
    );

  }


  function getBusinessName(
    business
  ) {

    return String(

      getFieldValue(
        business,
        "BusinessName"
      ) ||

      getFieldValue(
        business,
        "Name"
      ) ||

      getFieldValue(
        business,
        "Title"
      ) ||

      "Business"

    ).trim();

  }


  function sortBusinesses(
    businesses,
    sort
  ) {

    if (
      !Array.isArray(
        businesses
      )
    ) {

      return [];

    }


    var mode =
      normalizeText(
        sort || "featured"
      );


    var result =
      businesses.slice();


    result.sort(
      function (a, b) {

        if (
          mode === "rating" ||
          mode === "highestrating"
        ) {

          var ratingDifference =
            getRating(b) -
            getRating(a);


          if (
            ratingDifference !== 0
          ) {

            return ratingDifference;

          }


          return (
            getReviewCount(b) -
            getReviewCount(a)
          );

        }


        if (
          mode === "reviews" ||
          mode === "mostreviewed"
        ) {

          var reviewDifference =
            getReviewCount(b) -
            getReviewCount(a);


          if (
            reviewDifference !== 0
          ) {

            return reviewDifference;

          }


          return (
            getRating(b) -
            getRating(a)
          );

        }


        if (
          mode === "nameaz" ||
          mode === "a-z" ||
          mode === "name"
        ) {

          return getBusinessName(a)
            .localeCompare(
              getBusinessName(b),
              undefined,
              {
                sensitivity:
                  "base"
              }
            );

        }


        if (
          mode === "nameza" ||
          mode === "z-a"
        ) {

          return getBusinessName(b)
            .localeCompare(
              getBusinessName(a),
              undefined,
              {
                sensitivity:
                  "base"
              }
            );

        }


        /*
         * Default:
         * Featured → Rating → Reviews → Name
         */

        var featuredA =
          isFeatured(a)
            ? 1
            : 0;

        var featuredB =
          isFeatured(b)
            ? 1
            : 0;


        if (
          featuredA !==
          featuredB
        ) {

          return (
            featuredB -
            featuredA
          );

        }


        var ratingA =
          getRating(a);

        var ratingB =
          getRating(b);


        if (
          ratingA !== ratingB
        ) {

          return (
            ratingB -
            ratingA
          );

        }


        var reviewsA =
          getReviewCount(a);

        var reviewsB =
          getReviewCount(b);


        if (
          reviewsA !== reviewsB
        ) {

          return (
            reviewsB -
            reviewsA
          );

        }


        return getBusinessName(a)
          .localeCompare(
            getBusinessName(b),
            undefined,
            {
              sensitivity:
                "base"
            }
          );

      }
    );


    return result;

  }


  /* =======================================================
     FILTER BUSINESSES
     ======================================================= */

  function filterBusinesses(
    businesses,
    options
  ) {

    if (
      !Array.isArray(
        businesses
      )
    ) {

      return [];

    }


    options =
      options || {};


    var state =
      typeof App.getState ===
      "function"

        ? App.getState()

        : {};


    var search =
      options.search !== undefined

        ? options.search

        : (
            state.search ||
            ""
          );


    var district =
      options.district !== undefined

        ? options.district

        : (
            state.selectedDistrict ||
            state.district ||
            ALL_VALUE
          );


    var category =
      options.category !== undefined

        ? options.category

        : (
            state.selectedCategory ||
            state.category ||
            ALL_VALUE
          );


    var sort =
      options.sort !== undefined

        ? options.sort

        : (
            state.sort ||
            "featured"
          );


    var includeInactive =
      options.includeInactive === true;


    var normalizedSearch =
      normalizeText(
        search
      );


    var results = [];


    for (
      var i = 0;
      i < businesses.length;
      i++
    ) {

      var business =
        businesses[i];


      if (!business) {

        continue;

      }


      if (
        !includeInactive &&
        !isBusinessActive(
          business
        )
      ) {

        continue;

      }


      if (
        !matchesDistrict(
          business,
          district
        )
      ) {

        continue;

      }


      if (
        !matchesCategory(
          business,
          category
        )
      ) {

        continue;

      }


      if (
        normalizedSearch &&
        !matchesSearch(
          business,
          normalizedSearch
        )
      ) {

        continue;

      }


      var score =
        normalizedSearch

          ? calculateSearchScore(
              business,
              normalizedSearch
            )

          : 0;


      results.push({

        business:
          business,

        score:
          score,

        originalIndex:
          i

      });

    }


    /*
     * Search mode:
     * relevance first.
     */

    if (
      normalizedSearch
    ) {

      results.sort(
        function (a, b) {

          if (
            b.score !==
            a.score
          ) {

            return (
              b.score -
              a.score
            );

          }


          return (
            a.originalIndex -
            b.originalIndex
          );

        }
      );


      return results.map(
        function (item) {

          return item.business;

        }
      );

    }


    return sortBusinesses(

      results.map(
        function (item) {

          return item.business;

        }
      ),

      sort

    );

  }


  /* =======================================================
     APPLY FILTERS
     ======================================================= */

  function applyFilters(
    options
  ) {

    options =
      options || {};


    var state =
      typeof App.getState ===
      "function"

        ? App.getState()

        : null;


    if (!state) {

      return [];

    }


    var businesses =
      Array.isArray(
        state.businesses
      )

        ? state.businesses

        : [];


    var results =
      filterBusinesses(
        businesses,
        options
      );


    if (
      typeof App.setFilteredBusinesses ===
      "function"
    ) {

      App.setFilteredBusinesses(
        results
      );

    }
    else {

      /*
       * Compatibility fallback.
       */

      if (state) {

        state.filteredBusinesses =
          results;

      }

    }


    return results;

  }


  /* =======================================================
     SEARCH
     ======================================================= */

  function search(
    query
  ) {

    query =
      query === null ||
      query === undefined

        ? ""

        : String(query);


    if (
      typeof App.setSearch ===
      "function"
    ) {

      App.setSearch(
        query
      );

    }


    return applyFilters();

  }


  /* =======================================================
     DISTRICT FILTER
     ======================================================= */

  function filterByDistrict(
    district
  ) {

    district =
      district ||
      ALL_VALUE;


    if (
      typeof App.setDistrict ===
      "function"
    ) {

      App.setDistrict(
        district
      );

    }


    return applyFilters();

  }


  /* =======================================================
     CATEGORY FILTER
     ======================================================= */

  function filterByCategory(
    category
  ) {

    category =
      category ||
      ALL_VALUE;


    if (
      typeof App.setCategory ===
      "function"
    ) {

      App.setCategory(
        category
      );

    }


    return applyFilters();

  }


  /* =======================================================
     SORT
     ======================================================= */

  function sortBy(
    sort
  ) {

    sort =
      sort ||
      "featured";


    if (
      typeof App.setSort ===
      "function"
    ) {

      App.setSort(
        sort
      );

    }


    return applyFilters();

  }


  /* =======================================================
     RESET
     ======================================================= */

  function resetFilters() {

    if (
      typeof App.resetFilters ===
      "function"
    ) {

      App.resetFilters();

    }
    else {

      if (
        typeof App.setSearch ===
        "function"
      ) {

        App.setSearch("");

      }


      if (
        typeof App.setDistrict ===
        "function"
      ) {

        App.setDistrict(
          ALL_VALUE
        );

      }


      if (
        typeof App.setCategory ===
        "function"
      ) {

        App.setCategory(
          ALL_VALUE
        );

      }


      if (
        typeof App.setSort ===
        "function"
      ) {

        App.setSort(
          "featured"
        );

      }

    }


    return applyFilters();

  }


  /* =======================================================
     HIGHLIGHT SEARCH TEXT
     ======================================================= */

  function escapeRegExp(
    value
  ) {

    return String(value)
      .replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

  }


  function getHighlightParts(
    text,
    query
  ) {

    var source =
      valueToString(
        text
      );


    var normalizedQuery =
      normalizeText(
        query
      );


    if (
      !source ||
      !normalizedQuery
    ) {

      return [
        {
          text: source,
          match: false
        }
      ];

    }


    var tokens =
      tokenize(
        normalizedQuery
      );


    if (!tokens.length) {

      return [
        {
          text: source,
          match: false
        }
      ];

    }


    var pattern =
      tokens
        .sort(
          function (a, b) {

            return (
              b.length -
              a.length
            );

          }
        )
        .map(
          escapeRegExp
        )
        .join("|");


    if (!pattern) {

      return [
        {
          text: source,
          match: false
        }
      ];

    }


    var regex =
      new RegExp(
        "(" +
        pattern +
        ")",
        "ig"
      );


    var parts =
      source.split(
        regex
      );


    return parts.map(
      function (part) {

        return {

          text:
            part,

          match:
            tokens.some(
              function (token) {

                return (
                  normalizeText(
                    part
                  ) === token
                );

              }
            )

        };

      }
    );

  }


  /* =======================================================
     SUGGESTIONS
     ======================================================= */

  function getSuggestions(
    query,
    businesses,
    limit
  ) {

    query =
      normalizeText(
        query
      );


    limit =
      Number(limit) ||
      8;


    if (
      !Array.isArray(
        businesses
      ) ||
      !query
    ) {

      return [];

    }


    var suggestions = [];

    var seen =
      Object.create(null);


    for (
      var i = 0;
      i < businesses.length;
      i++
    ) {

      var business =
        businesses[i];


      var name =
        getBusinessName(
          business
        );


      if (!name) {

        continue;

      }


      var normalizedName =
        normalizeText(
          name
        );


      if (
        normalizedName.indexOf(
          query
        ) === -1
      ) {

        continue;

      }


      if (
        seen[normalizedName]
      ) {

        continue;

      }


      seen[normalizedName] =
        true;


      suggestions.push(name);


      if (
        suggestions.length >=
        limit
      ) {

        break;

      }

    }


    return suggestions;

  }


  /* =======================================================
     MATCH COUNT
     ======================================================= */

  function getMatchCount(
    query,
    businesses
  ) {

    if (
      !Array.isArray(
        businesses
      )
    ) {

      return 0;

    }


    var count = 0;


    for (
      var i = 0;
      i < businesses.length;
      i++
    ) {

      if (
        matchesSearch(
          businesses[i],
          query
        )
      ) {

        count++;

      }

    }


    return count;

  }


  /* =======================================================
     PUBLIC API
     ======================================================= */

  App.filters = {

    normalizeText:
      normalizeText,

    compactText:
      compactText,

    tokenize:
      tokenize,

    getFieldValue:
      getFieldValue,

    getCategoryName:
      getCategoryName,

    getDistrictName:
      getDistrictName,

    getProductsText:
      getProductsText,

    getServicesText:
      getServicesText,

    getBusinessId:
      getBusinessId,

    buildBusinessIndex:
      buildBusinessIndex,

    clearSearchIndex:
      clearSearchIndex,

    calculateSearchScore:
      calculateSearchScore,

    matchesSearch:
      matchesSearch,

    matchesDistrict:
      matchesDistrict,

    matchesCategory:
      matchesCategory,

    isBusinessActive:
      isBusinessActive,

    sortBusinesses:
      sortBusinesses,

    filterBusinesses:
      filterBusinesses,

    applyFilters:
      applyFilters,

    search:
      search,

    filterByDistrict:
      filterByDistrict,

    filterByCategory:
      filterByCategory,

    sortBy:
      sortBy,

    resetFilters:
      resetFilters,

    getHighlightParts:
      getHighlightParts,

    getSuggestions:
      getSuggestions,

    getMatchCount:
      getMatchCount

  };


  /* =======================================================
     TOP-LEVEL COMPATIBILITY API
     ======================================================= */

  App.applyFilters =
    applyFilters;


  App.filterBusinesses =
    filterBusinesses;


  App.searchBusinesses =
    search;


  App.filterByDistrict =
    filterByDistrict;


  App.filterByCategory =
    filterByCategory;


  App.sortBusinesses =
    sortBusinesses;


  App.resetBusinessFilters =
    resetFilters;


  /* =======================================================
     READY FLAG
     ======================================================= */

  App.filtersReady =
    true;


  window.UBnux =
    App;

  window.ZilaBiz =
    App;


})(window, document);