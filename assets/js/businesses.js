/* =========================================================
   UBnux - Business Manager
   File: assets/js/businesses.js

   RESPONSIBILITIES
   ---------------------------------------------------------
   • Business card rendering
   • Business list rendering
   • Pagination
   • Load More
   • Business count
   • Empty state
   • Skeleton state
   • Business modal integration
   • Search/filter result rendering
   • Active/Inactive status handling
   • Robust field detection
   • Image fallback
   • Card event handling
   • Accessibility
   • Top-level compatibility aliases
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
    window.ZilaBizConfig ||
    {};

  var PAGE_SIZE =
    Number(
      CONFIG.BUSINESS_PAGE_SIZE
    ) || 18;

  var DEBUG =
    CONFIG.DEBUG === true;


  /* =======================================================
     DEBUG LOGGER
     ======================================================= */

  function debug() {

    if (
      !DEBUG ||
      !window.console ||
      typeof console.log !== "function"
    ) {

      return;

    }

    try {

      console.log.apply(
        console,
        arguments
      );

    }
    catch (error) {

      /* Ignore debug errors */

    }

  }


  /* =======================================================
     DOM HELPER
     ======================================================= */

  function getElement(id) {

    if (!id) {

      return null;

    }

    return document.getElementById(id);

  }


  /* =======================================================
     DOM REFERENCES
     ======================================================= */

  var businessGrid =
    getElement("businessGrid");

  var businessCount =
    getElement("businessCount");

  var emptyState =
    getElement("emptyState");

  var loadMoreContainer =
    getElement("loadMoreContainer");

  var loadMoreButton =
    getElement("loadMoreButton");

  var searchStatus =
    getElement("searchStatus");


  /* =======================================================
     REFRESH DOM REFERENCES

     Important because this script can initialize before
     some dynamically-created elements exist.
     ======================================================= */

  function refreshDOMReferences() {

    businessGrid =
      businessGrid ||
      getElement("businessGrid");

    businessCount =
      businessCount ||
      getElement("businessCount");

    emptyState =
      emptyState ||
      getElement("emptyState");

    loadMoreContainer =
      loadMoreContainer ||
      getElement("loadMoreContainer");

    loadMoreButton =
      loadMoreButton ||
      getElement("loadMoreButton");

    searchStatus =
      searchStatus ||
      getElement("searchStatus");

  }


  /* =======================================================
     GENERIC VALUE READER
     ======================================================= */

  function getValue(
    business,
    fields,
    fallback
  ) {

    if (
      !business ||
      typeof business !== "object" ||
      !Array.isArray(fields)
    ) {

      return (
        fallback === undefined
          ? ""
          : fallback
      );

    }


    /* -----------------------------------------------------
       EXACT LOOKUP
       ----------------------------------------------------- */

    for (
      var i = 0;
      i < fields.length;
      i++
    ) {

      var field =
        fields[i];

      if (
        Object.prototype.hasOwnProperty.call(
          business,
          field
        )
      ) {

        var exactValue =
          business[field];

        if (
          exactValue !== undefined &&
          exactValue !== null &&
          String(exactValue).trim() !== ""
        ) {

          return exactValue;

        }

      }

    }


    /* -----------------------------------------------------
       CASE-INSENSITIVE LOOKUP
       ----------------------------------------------------- */

    var keys =
      Object.keys(business);

    for (
      var j = 0;
      j < fields.length;
      j++
    ) {

      var target =
        String(fields[j])
          .trim()
          .toLowerCase();

      for (
        var k = 0;
        k < keys.length;
        k++
      ) {

        if (
          String(keys[k])
            .trim()
            .toLowerCase() === target
        ) {

          var value =
            business[keys[k]];

          if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
          ) {

            return value;

          }

        }

      }

    }


    return (
      fallback === undefined
        ? ""
        : fallback
    );

  }


  /* =======================================================
     TEXT READER
     ======================================================= */

  function text(
    business,
    fields,
    fallback
  ) {

    var value =
      getValue(
        business,
        fields,
        fallback
      );

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }

    return String(value).trim();

  }


  /* =======================================================
     NUMBER READER
     ======================================================= */

  function number(
    business,
    fields,
    fallback
  ) {

    var value =
      getValue(
        business,
        fields,
        ""
      );

    var parsed =
      parseFloat(
        String(value)
          .replace(/,/g, "")
          .trim()
      );

    if (
      Number.isFinite(parsed)
    ) {

      return parsed;

    }

    return (
      fallback === undefined
        ? 0
        : fallback
    );

  }


  /* =======================================================
     BOOLEAN NORMALIZER
     ======================================================= */

  function toBoolean(value) {

    if (
      typeof value === "boolean"
    ) {

      return value;

    }

    var normalized =
      String(
        value === null ||
        value === undefined
          ? ""
          : value
      )
        .trim()
        .toLowerCase();

    if (
      [
        "true",
        "yes",
        "1",
        "active",
        "enabled",
        "open",
        "online",
        "available",
        "published",
        "approved",
        "verified",
        "live",
        "featured"
      ].indexOf(normalized) !== -1
    ) {

      return true;

    }

    return false;

  }


  /* =======================================================
     ESCAPE HTML
     ======================================================= */

  function escapeHTML(value) {

    if (
      App.utils &&
      typeof App.utils.escapeHTML === "function"
    ) {

      try {

        return App.utils.escapeHTML(
          value
        );

      }
      catch (error) {

        debug(
          "[UBnux] utils.escapeHTML failed:",
          error
        );

      }

    }

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  /* =======================================================
     NORMALIZE IMAGE URL
     ======================================================= */

  function normalizeImageURL(value) {

    var url =
      String(value || "").trim();

    if (!url) {

      return "";

    }

    /* Data image */

    if (
      /^data:image\//i.test(url)
    ) {

      return url;

    }

    /* HTTP/HTTPS */

    if (
      /^https?:\/\//i.test(url)
    ) {

      return url;

    }

    /* Protocol relative */

    if (
      /^\/\//.test(url)
    ) {

      return (
        window.location.protocol +
        url
      );

    }

    /* Root relative */

    if (
      url.charAt(0) === "/"
    ) {

      return url;

    }

    /*
     * Relative URL.
     * Keep as-is because GitHub/Cloudflare
     * may use relative assets.
     */

    return url;

  }


  /* =======================================================
     FALLBACK IMAGE
     ======================================================= */

  function getFallbackImage() {

    return (
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">' +
          '<rect width="600" height="400" fill="#f3f4f6"/>' +
          '<circle cx="300" cy="145" r="55" fill="#d1d5db"/>' +
          '<path d="M190 330c20-75 75-110 110-110s90 35 110 110" fill="#d1d5db"/>' +
          '<text x="300" y="370" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#6b7280">UBnux</text>' +
        '</svg>'
      )
    );

  }


  /* =======================================================
     BUSINESS ID
     ======================================================= */

  function getBusinessId(business) {

    return text(
      business,
      [
        "BusinessID",
        "businessID",
        "businessId",
        "BusinessId",
        "BusinessCode",
        "businessCode",
        "BusinessUID",
        "businessUID",
        "UID",
        "uid",
        "Code",
        "code",
        "ID",
        "Id",
        "id"
      ],
      ""
    );

  }


  /* =======================================================
     BUSINESS NAME
     ======================================================= */

  function getBusinessName(business) {

    return text(
      business,
      [
        "BusinessName",
        "businessName",
        "BusinessTitle",
        "businessTitle",
        "Name",
        "name",
        "Title",
        "title"
      ],
      "Business"
    );

  }


  /* =======================================================
     CATEGORY
     ======================================================= */

  function getCategoryName(business) {

    /*
     * Prefer filter module resolver if available.
     */

    if (
      App.filters &&
      typeof App.filters.getCategoryName === "function"
    ) {

      try {

        var filterCategory =
          App.filters.getCategoryName(
            business
          );

        if (filterCategory) {

          return String(
            filterCategory
          ).trim();

        }

      }
      catch (error) {

        debug(
          "[UBnux] Category resolver error:",
          error
        );

      }

    }


    return text(
      business,
      [
        "CategoryName",
        "categoryName",
        "CategoryTitle",
        "categoryTitle",
        "Category",
        "category",
        "CategoryID",
        "categoryID",
        "categoryId"
      ],
      ""
    );

  }


  /* =======================================================
     DISTRICT
     ======================================================= */

  function getDistrictName(business) {

    return text(
      business,
      [
        "DistrictName",
        "districtName",
        "DistrictTitle",
        "districtTitle",
        "District",
        "district",
        "DistrictID",
        "districtID",
        "districtId"
      ],
      ""
    );

  }


  /* =======================================================
     AREA
     ======================================================= */

  function getArea(business) {

    return text(
      business,
      [
        "Area",
        "area",
        "Locality",
        "locality",
        "Location",
        "location",
        "Village",
        "village",
        "Town",
        "town",
        "City",
        "city"
      ],
      ""
    );

  }


  /* =======================================================
     ADDRESS
     ======================================================= */

  function getAddress(business) {

    return text(
      business,
      [
        "Address",
        "address",
        "FullAddress",
        "fullAddress",
        "BusinessAddress",
        "businessAddress",
        "LocationAddress",
        "locationAddress"
      ],
      ""
    );

  }


  /* =======================================================
     PHONE
     ======================================================= */

  function getPhone(business) {

    return text(
      business,
      [
        "Mobile",
        "mobile",
        "Phone",
        "phone",
        "MobileNumber",
        "mobileNumber",
        "Contact",
        "contact",
        "ContactNumber",
        "contactNumber",
        "PhoneNumber",
        "phoneNumber"
      ],
      ""
    );

  }


  /* =======================================================
     WHATSAPP
     ======================================================= */

  function getWhatsApp(business) {

    return text(
      business,
      [
        "WhatsApp",
        "whatsapp",
        "Whatsapp",
        "WhatsAppNumber",
        "whatsappNumber",
        "WhatsAppMobile",
        "whatsappMobile",
        "WhatsAppNo",
        "whatsappNo"
      ],
      ""
    );

  }


  /* =======================================================
     LOGO
     ======================================================= */

  function getLogo(business) {

    return text(
      business,
      [
        "Logo",
        "logo",
        "LogoURL",
        "logoURL",
        "LogoUrl",
        "logoUrl",
        "LogoImage",
        "logoImage",
        "LogoImageURL",
        "logoImageURL",
        "Image",
        "image",
        "ImageURL",
        "imageURL",
        "ImageUrl",
        "imageUrl",
        "BusinessImage",
        "businessImage",
        "BusinessLogo",
        "businessLogo"
      ],
      ""
    );

  }


  /* =======================================================
     COVER
     ======================================================= */

  function getCover(business) {

    return text(
      business,
      [
        "Cover",
        "cover",
        "CoverImage",
        "coverImage",
        "CoverURL",
        "coverURL",
        "CoverUrl",
        "coverUrl",
        "Banner",
        "banner",
        "BannerImage",
        "bannerImage",
        "BannerURL",
        "bannerURL"
      ],
      ""
    );

  }


  /* =======================================================
     RATING
     ======================================================= */

  function getRating(business) {

    return number(
      business,
      [
        "Rating",
        "rating",
        "AverageRating",
        "averageRating",
        "AvgRating",
        "avgRating",
        "RatingValue",
        "ratingValue"
      ],
      0
    );

  }


  /* =======================================================
     REVIEW COUNT
     ======================================================= */

  function getReviewCount(business) {

    return number(
      business,
      [
        "ReviewCount",
        "reviewCount",
        "Reviews",
        "reviews",
        "TotalReviews",
        "totalReviews",
        "ReviewTotal",
        "reviewTotal"
      ],
      0
    );

  }


  /* =======================================================
     DESCRIPTION
     ======================================================= */

  function getDescription(business) {

    return text(
      business,
      [
        "Description",
        "description",
        "About",
        "about",
        "BusinessDescription",
        "businessDescription",
        "Details",
        "details",
        "BusinessDetails",
        "businessDetails"
      ],
      ""
    );

  }


  /* =======================================================
     FEATURED
     ======================================================= */

  function isFeatured(business) {

    var value =
      getValue(
        business,
        [
          "Featured",
          "featured",
          "IsFeatured",
          "isFeatured",
          "FeaturedStatus",
          "featuredStatus"
        ],
        ""
      );

    return toBoolean(value);

  }


  /* =======================================================
     VERIFIED
     ======================================================= */

  function isVerified(business) {

    var value =
      getValue(
        business,
        [
          "Verified",
          "verified",
          "IsVerified",
          "isVerified",
          "VerifiedStatus",
          "verifiedStatus"
        ],
        ""
      );

    return toBoolean(value);

  }


  /* =======================================================
     ACTIVE STATUS

     IMPORTANT:
     -------------------------------------------------------
     • No status field = visible
     • Explicit inactive values = hidden
     • Explicit active values = visible
     • Unknown values = visible

     This prevents backend fields like:
     Pending, Listed, Review, etc.
     from accidentally hiding businesses.
     ======================================================= */

  function isActive(business) {

    if (
      !business ||
      typeof business !== "object"
    ) {

      return false;

    }


    var statusFields = [

      "BusinessStatus",
      "businessStatus",

      "Status",
      "status",

      "Active",
      "active",

      "Published",
      "published",

      "Approved",
      "approved",

      "Live",
      "live",

      "Availability",
      "availability"

    ];


    var foundStatus =
      false;

    var raw = "";


    for (
      var i = 0;
      i < statusFields.length;
      i++
    ) {

      var field =
        statusFields[i];

      if (
        Object.prototype.hasOwnProperty.call(
          business,
          field
        )
      ) {

        var candidate =
          business[field];

        if (
          candidate !== undefined &&
          candidate !== null &&
          String(candidate).trim() !== ""
        ) {

          foundStatus =
            true;

          raw =
            String(candidate)
              .trim()
              .toLowerCase();

          break;

        }

      }

    }


    /*
     * No status:
     * visible by default.
     */

    if (!foundStatus) {

      return true;

    }


    /*
     * Explicit inactive values.
     */

    var inactiveValues = [

      "inactive",
      "disabled",
      "blocked",
      "closed",
      "offline",
      "unavailable",
      "unpublished",
      "rejected",
      "deleted",
      "removed",
      "suspended",
      "no",
      "false",
      "0"

    ];


    if (
      inactiveValues.indexOf(raw) !== -1
    ) {

      return false;

    }


    /*
     * Explicit active values.
     */

    var activeValues = [

      "active",
      "enabled",
      "open",
      "online",
      "available",
      "published",
      "approved",
      "verified",
      "live",
      "yes",
      "true",
      "1",
      "featured"

    ];


    if (
      activeValues.indexOf(raw) !== -1
    ) {

      return true;

    }


    /*
     * Unknown status:
     * keep visible.
     */

    return true;

  }


  /* =======================================================
     STARS
     ======================================================= */

  function getStars(rating) {

    var value =
      Number(rating) || 0;

    value =
      Math.max(
        0,
        Math.min(
          5,
          value
        )
      );

    var rounded =
      Math.round(value);

    var html = "";

    for (
      var i = 1;
      i <= 5;
      i++
    ) {

      html +=
        i <= rounded
          ? '<span class="star filled" aria-hidden="true">★</span>'
          : '<span class="star" aria-hidden="true">☆</span>';

    }

    return html;

  }


  /* =======================================================
     FORMAT RATING
     ======================================================= */

  function formatRating(rating) {

    var value =
      Number(rating) || 0;

    if (value <= 0) {

      return "New";

    }

    return value.toFixed(1);

  }


  /* =======================================================
     PHONE URL
     ======================================================= */

  function getPhoneURL(phone) {

    if (!phone) {

      return "";

    }

    var value =
      String(phone)
        .replace(/[^\d+]/g, "");

    if (!value) {

      return "";

    }

    return "tel:" + value;

  }


  /* =======================================================
     WHATSAPP URL
     ======================================================= */

  function getWhatsAppURL(phone) {

    if (!phone) {

      return "";

    }

    var value =
      String(phone)
        .replace(/\D/g, "");

    /*
     * Indian 10 digit number.
     */

    if (
      value.length === 10
    ) {

      value =
        "91" +
        value;

    }

    /*
     * If number already contains
     * country code, keep it.
     */

    if (
      value.length < 10
    ) {

      return "";

    }

    return (
      "https://wa.me/" +
      value
    );

  }


  /* =======================================================
     SAFE HREF ATTRIBUTE
     ======================================================= */

  function hrefAttribute(url) {

    var value =
      String(url || "");

    if (
      !/^tel:/i.test(value) &&
      !/^https:\/\//i.test(value) &&
      !/^http:\/\//i.test(value)
    ) {

      return "";

    }

    return (
      'href="' +
      escapeHTML(value) +
      '"'
    );

  }


  /* =======================================================
     LOCATION TEXT
     ======================================================= */

  function getLocationText(business) {

    var area =
      getArea(business);

    var district =
      getDistrictName(business);

    if (
      area &&
      district &&
      area.toLowerCase() !==
        district.toLowerCase()
    ) {

      return (
        area +
        ", " +
        district
      );

    }

    return (
      area ||
      district ||
      ""
    );

  }


  /* =======================================================
     CREATE BUSINESS CARD
     ======================================================= */

  function createBusinessCard(
    business,
    index
  ) {

    if (
      !business ||
      typeof business !== "object"
    ) {

      return "";

    }


    /*
     * Explicit inactive records should
     * never be rendered.
     */

    if (!isActive(business)) {

      debug(
        "[UBnux] Skipping inactive business:",
        business
      );

      return "";

    }


    var id =
      getBusinessId(business);


    /*
     * Temporary ID only when backend ID
     * is genuinely missing.
     */

    if (!id) {

      id =
        "business-" +
        String(
          Number(index) || 0
        );

    }


    var name =
      getBusinessName(business);

    var category =
      getCategoryName(business);

    var locationText =
      getLocationText(business);

    var address =
      getAddress(business);

    var phone =
      getPhone(business);

    var whatsapp =
      getWhatsApp(business) ||
      phone;

    var logo =
      normalizeImageURL(
        getLogo(business)
      );

    var cover =
      normalizeImageURL(
        getCover(business)
      );

    var image =
      cover ||
      logo ||
      getFallbackImage();

    var rating =
      getRating(business);

    var reviewCount =
      getReviewCount(business);

    var featured =
      isFeatured(business);

    var verified =
      isVerified(business);

    var description =
      getDescription(business);

    var phoneURL =
      getPhoneURL(phone);

    var whatsappURL =
      getWhatsAppURL(whatsapp);

    var safeId =
      escapeHTML(id);


    var html = "";


    /* =====================================================
       CARD
       ===================================================== */

    html +=
      '<article ' +
      'class="business-card" ' +
      'data-business-id="' +
      safeId +
      '" ' +
      'data-business-index="' +
      escapeHTML(index) +
      '" ' +
      'tabindex="0" ' +
      'role="article" ' +
      'aria-label="' +
      escapeHTML(name) +
      '">';


    /* =====================================================
       IMAGE
       ===================================================== */

    html +=
      '<div class="business-card-image-wrap">';

    html +=
      '<img ' +
      'class="business-card-image" ' +
      'src="' +
      escapeHTML(image) +
      '" ' +
      'alt="' +
      escapeHTML(name) +
      '" ' +
      'loading="lazy" ' +
      'decoding="async" ' +
      'onerror="this.onerror=null;this.src=\'' +
      escapeHTML(getFallbackImage()) +
      '\'">';


    /* =====================================================
       BADGES
       ===================================================== */

    if (
      featured ||
      verified
    ) {

      html +=
        '<div class="business-card-badges">';

      if (featured) {

        html +=
          '<span class="business-badge featured">' +
            '<i class="fa-solid fa-star"></i>' +
            '<span>Featured</span>' +
          '</span>';

      }

      if (verified) {

        html +=
          '<span class="business-badge verified">' +
            '<i class="fa-solid fa-circle-check"></i>' +
            '<span>Verified</span>' +
          '</span>';

      }

      html +=
        '</div>';

    }


    html +=
      '</div>';


    /* =====================================================
       CONTENT
       ===================================================== */

    html +=
      '<div class="business-card-content">';


    /* =====================================================
       NAME
       ===================================================== */

    html +=
      '<h3 class="business-card-title">' +
        escapeHTML(name) +
      '</h3>';


    /* =====================================================
       CATEGORY
       ===================================================== */

    if (category) {

      html +=
        '<div class="business-card-category">' +
          '<i class="fa-solid fa-tag" aria-hidden="true"></i>' +
          '<span>' +
            escapeHTML(category) +
          '</span>' +
        '</div>';

    }


    /* =====================================================
       RATING
       ===================================================== */

    if (rating > 0) {

      html +=
        '<div class="business-card-rating">' +

          '<span class="business-rating-stars" aria-label="Rating ' +
            escapeHTML(
              formatRating(rating)
            ) +
            ' out of 5">' +

            getStars(rating) +

          '</span>' +

          '<strong>' +
            escapeHTML(
              formatRating(rating)
            ) +
          '</strong>' +

          (
            reviewCount > 0
              ? '<span class="business-review-count">' +
                  '(' +
                  escapeHTML(reviewCount) +
                  ')' +
                '</span>'
              : ""
          ) +

        '</div>';

    }
    else {

      html +=
        '<div class="business-card-rating new-business">' +
          '<span>New business</span>' +
        '</div>';

    }


    /* =====================================================
       LOCATION
       ===================================================== */

    if (locationText) {

      html +=
        '<div class="business-card-location">' +
          '<i class="fa-solid fa-location-dot" aria-hidden="true"></i>' +
          '<span>' +
            escapeHTML(locationText) +
          '</span>' +
        '</div>';

    }


    /* =====================================================
       ADDRESS
       ===================================================== */

    if (address) {

      html +=
        '<div class="business-card-address">' +
          '<i class="fa-solid fa-map-pin" aria-hidden="true"></i>' +
          '<span>' +
            escapeHTML(address) +
          '</span>' +
        '</div>';

    }


    /* =====================================================
       DESCRIPTION
       ===================================================== */

    if (description) {

      var truncated =
        description.length > 150
          ? description.slice(0, 150) + "..."
          : description;

      html +=
        '<p class="business-card-description">' +
          escapeHTML(truncated) +
        '</p>';

    }


    /* =====================================================
       ACTIONS
       ===================================================== */

    html +=
      '<div class="business-card-actions">';


    /* CALL */

    if (phoneURL) {

      html +=
        '<a ' +
        'class="business-card-action call" ' +
        hrefAttribute(phoneURL) +
        'aria-label="Call ' +
        escapeHTML(name) +
        '">' +

          '<i class="fa-solid fa-phone" aria-hidden="true"></i>' +
          '<span>Call</span>' +

        '</a>';

    }


    /* WHATSAPP */

    if (whatsappURL) {

      html +=
        '<a ' +
        'class="business-card-action whatsapp" ' +
        hrefAttribute(whatsappURL) +
        'target="_blank" ' +
        'rel="noopener noreferrer" ' +
        'aria-label="WhatsApp ' +
        escapeHTML(name) +
        '">' +

          '<i class="fa-brands fa-whatsapp" aria-hidden="true"></i>' +
          '<span>WhatsApp</span>' +

        '</a>';

    }


    /* VIEW DETAILS */

    html +=
      '<button ' +
      'type="button" ' +
      'class="business-card-action view-details" ' +
      'data-business-action="view" ' +
      'data-business-id="' +
      safeId +
      '" ' +
      'aria-label="View details of ' +
      escapeHTML(name) +
      '">' +

        '<i class="fa-solid fa-eye" aria-hidden="true"></i>' +
        '<span>View Details</span>' +

      '</button>';


    html +=
      '</div>';


    html +=
      '</div>';


    html +=
      '</article>';


    return html;

  }


  /* =======================================================
     RENDER BUSINESS LIST
     ======================================================= */

  function renderBusinesses(
    businesses,
    options
  ) {

    options =
      options || {};

    refreshDOMReferences();

    if (!businessGrid) {

      console.error(
        "[UBnux] #businessGrid not found."
      );

      return false;

    }


    var list =
      Array.isArray(businesses)
        ? businesses
        : [];


    debug(
      "[UBnux] renderBusinesses input:",
      list.length
    );


    /*
     * Only remove explicitly inactive
     * records.
     */

    var activeBusinesses = [];

    for (
      var i = 0;
      i < list.length;
      i++
    ) {

      if (
        isActive(list[i])
      ) {

        activeBusinesses.push(
          list[i]
        );

      }

    }


    /*
     * No businesses.
     */

    if (
      activeBusinesses.length === 0
    ) {

      businessGrid.innerHTML =
        "";

      showEmptyState(true);

      updateBusinessCount(0);

      updateLoadMore(false);

      return true;

    }


    hideEmptyState();


    var html = "";


    for (
      var j = 0;
      j < activeBusinesses.length;
      j++
    ) {

      try {

        html +=
          createBusinessCard(
            activeBusinesses[j],
            j
          );

      }
      catch (error) {

        console.error(
          "[UBnux] Business card render error:",
          error,
          activeBusinesses[j]
        );

      }

    }


    if (!html) {

      console.error(
        "[UBnux] Business HTML generation returned empty."
      );

      businessGrid.innerHTML =
        "";

      showEmptyState(true);

      updateBusinessCount(0);

      updateLoadMore(false);

      return false;

    }


    businessGrid.innerHTML =
      html;


    var renderedCards =
      businessGrid.querySelectorAll(
        ".business-card:not(.business-card-skeleton)"
      );


    debug(
      "[UBnux] Cards rendered:",
      renderedCards.length
    );


    updateBusinessCount(
      activeBusinesses.length
    );


    /*
     * Event binding is delegated,
     * but this keeps compatibility with
     * existing code.
     */

    bindBusinessCardEvents();


    if (
      options.updateLoadMore !== false
    ) {

      updateLoadMore();

    }


    return true;

  }


  /* =======================================================
     RENDER CURRENT PAGE
     ======================================================= */

  function renderCurrentPage() {

    refreshDOMReferences();

    if (!businessGrid) {

      console.error(
        "[UBnux] Cannot render: #businessGrid missing."
      );

      return [];

    }


    var state =
      typeof App.getState === "function"
        ? App.getState()
        : {};


    var filtered =
      Array.isArray(
        state.filteredBusinesses
      )
        ? state.filteredBusinesses
        : [];


    var page =
      Number(state.page) || 1;

    var pageSize =
      Number(state.pageSize) ||
      PAGE_SIZE;


    if (page < 1) {

      page = 1;

    }

    if (pageSize < 1) {

      pageSize =
        PAGE_SIZE;

    }


    var end =
      page * pageSize;


    var visible =
      filtered.slice(
        0,
        end
      );


    debug(
      "[UBnux] renderCurrentPage:",
      {
        totalFiltered:
          filtered.length,

        page:
          page,

        pageSize:
          pageSize,

        visible:
          visible.length
      }
    );


    renderBusinesses(
      visible,
      {
        updateLoadMore:
          false
      }
    );


    /*
     * Count should represent
     * complete filtered result,
     * not only visible cards.
     */

    updateBusinessCount(
      filtered.length
    );


    updateSearchStatus(
      filtered.length,
      state
    );


    updateActiveFilters();


    updateLoadMore(
      end <
      filtered.length
    );


    return visible;

  }


  /* =======================================================
     LOAD MORE
     ======================================================= */

  function loadMore() {

    var state =
      typeof App.getState === "function"
        ? App.getState()
        : {};


    var currentPage =
      Number(state.page) || 1;

    var pageSize =
      Number(state.pageSize) ||
      PAGE_SIZE;

    var filtered =
      Array.isArray(
        state.filteredBusinesses
      )
        ? state.filteredBusinesses
        : [];


    var currentEnd =
      currentPage *
      pageSize;


    if (
      currentEnd >=
      filtered.length
    ) {

      updateLoadMore(false);

      return false;

    }


    var nextPage =
      currentPage + 1;


    if (
      typeof App.setPage === "function"
    ) {

      App.setPage(
        nextPage
      );

    }
    else if (
      typeof App.updateState === "function"
    ) {

      App.updateState({
        page:
          nextPage
      });

    }


    renderCurrentPage();


    return true;

  }


  /* =======================================================
     RESET PAGINATION

     IMPORTANT:
     State module owns resetPagination().
     ======================================================= */

  function resetPagination() {

    if (
      typeof App.resetPagination ===
      "function"
    ) {

      App.resetPagination();

      return true;

    }


    if (
      typeof App.setPage ===
      "function"
    ) {

      App.setPage(1);

      return true;

    }


    if (
      typeof App.updateState ===
      "function"
    ) {

      App.updateState({
        page: 1
      });

      return true;

    }


    return false;

  }


  /* =======================================================
     RENDER FILTERED BUSINESSES
     ======================================================= */

  function renderFilteredBusinesses() {

    resetPagination();


    if (
      App.filters &&
      typeof App.filters.applyFilters ===
      "function"
    ) {

      App.filters.applyFilters();

    }
    else if (
      typeof App.applyFilters ===
      "function"
    ) {

      App.applyFilters();

    }


    renderCurrentPage();


    return true;

  }


  /* =======================================================
     REFRESH BUSINESS LIST
     ======================================================= */

  function refreshBusinessList() {

    hideSkeletons();


    if (
      App.filters &&
      typeof App.filters.applyFilters ===
      "function"
    ) {

      App.filters.applyFilters();

    }
    else if (
      typeof App.applyFilters ===
      "function"
    ) {

      App.applyFilters();

    }


    resetPagination();

    renderCurrentPage();


    return true;

  }


  /* =======================================================
     UPDATE BUSINESS COUNT
     ======================================================= */

  function updateBusinessCount(count) {

    refreshDOMReferences();

    if (!businessCount) {

      return;

    }


    var total =
      Number(count) || 0;


    businessCount.textContent =
      total.toLocaleString("en-IN");


    businessCount.dataset.count =
      String(total);

  }


  /* =======================================================
     UPDATE SEARCH STATUS
     ======================================================= */

  function updateSearchStatus(
    count,
    state
  ) {

    refreshDOMReferences();

    if (!searchStatus) {

      return;

    }


    state =
      state || {};


    var search =
      state.search
        ? String(
            state.search
          ).trim()
        : "";


    var district =
      state.selectedDistrict ||
      state.district ||
      "";


    var category =
      state.selectedCategory ||
      state.category ||
      "";


    var total =
      Number(count) || 0;


    if (search) {

      searchStatus.textContent =
        total +
        (
          total === 1
            ? " business found"
            : " businesses found"
        ) +
        ' for "' +
        search +
        '"';

      return;

    }


    if (
      district &&
      String(district)
        .toUpperCase() !==
        "ALL"
    ) {

      searchStatus.textContent =
        total +
        (
          total === 1
            ? " business"
            : " businesses"
        ) +
        " available";

      return;

    }


    if (
      category &&
      String(category)
        .toUpperCase() !==
        "ALL"
    ) {

      searchStatus.textContent =
        total +
        (
          total === 1
            ? " business"
            : " businesses"
        ) +
        " available";

      return;

    }


    searchStatus.textContent =
      total +
      (
        total === 1
          ? " business available"
          : " businesses available"
      );

  }


  /* =======================================================
     EMPTY STATE
     ======================================================= */

  function showEmptyState(show) {

    refreshDOMReferences();

    if (!emptyState) {

      return;

    }


    if (show) {

      emptyState.hidden =
        false;

      emptyState.style.display =
        "";

      emptyState.setAttribute(
        "aria-hidden",
        "false"
      );

    }
    else {

      hideEmptyState();

    }

  }


  function hideEmptyState() {

    refreshDOMReferences();

    if (!emptyState) {

      return;

    }


    emptyState.hidden =
      true;

    emptyState.style.display =
      "none";

    emptyState.setAttribute(
      "aria-hidden",
      "true"
    );

  }


  /* =======================================================
     LOAD MORE UI
     ======================================================= */

  function updateLoadMore(
    hasMore
  ) {

    refreshDOMReferences();

    if (!loadMoreContainer) {

      return;

    }


    /*
     * If hasMore wasn't supplied,
     * calculate it from current state.
     */

    if (
      typeof hasMore !== "boolean"
    ) {

      var state =
        typeof App.getState ===
        "function"
          ? App.getState()
          : {};

      var filtered =
        Array.isArray(
          state.filteredBusinesses
        )
          ? state.filteredBusinesses
          : [];

      var page =
        Number(state.page) || 1;

      var pageSize =
        Number(state.pageSize) ||
        PAGE_SIZE;

      hasMore =
        page * pageSize <
        filtered.length;

    }


    if (hasMore) {

      loadMoreContainer.hidden =
        false;

      loadMoreContainer.style.display =
        "";

      loadMoreContainer.setAttribute(
        "aria-hidden",
        "false"
      );


      if (loadMoreButton) {

        loadMoreButton.disabled =
          false;

      }

    }
    else {

      loadMoreContainer.hidden =
        true;

      loadMoreContainer.style.display =
        "none";

      loadMoreContainer.setAttribute(
        "aria-hidden",
        "true"
      );


      if (loadMoreButton) {

        loadMoreButton.disabled =
          false;

      }

    }

  }


  /* =======================================================
     LOAD MORE TEXT
     ======================================================= */

  function updateLoadMoreText(
    textValue
  ) {

    refreshDOMReferences();

    if (!loadMoreButton) {

      return;

    }

    loadMoreButton.textContent =
      textValue ||
      "Load More";

  }


  /* =======================================================
     SKELETONS
     ======================================================= */

  function showSkeletons(count) {

    refreshDOMReferences();

    if (!businessGrid) {

      return;

    }


    var total =
      Number(count) ||
      Math.min(
        PAGE_SIZE,
        6
      );


    total =
      Math.max(
        1,
        total
      );


    var html = "";


    for (
      var i = 0;
      i < total;
      i++
    ) {

      html +=
        '<div class="business-card business-card-skeleton" aria-hidden="true">' +

          '<div class="skeleton skeleton-image"></div>' +

          '<div class="business-card-content">' +

            '<div class="skeleton skeleton-title"></div>' +

            '<div class="skeleton skeleton-line"></div>' +

            '<div class="skeleton skeleton-line short"></div>' +

            '<div class="skeleton skeleton-line"></div>' +

            '<div class="skeleton skeleton-button"></div>' +

          '</div>' +

        '</div>';

    }


    businessGrid.innerHTML =
      html;


    hideEmptyState();

  }


  /* =======================================================
     HIDE SKELETONS
     ======================================================= */

  function hideSkeletons() {

    refreshDOMReferences();

    if (!businessGrid) {

      return;

    }


    var skeletons =
      businessGrid.querySelectorAll(
        ".business-card-skeleton"
      );


    for (
      var i = 0;
      i < skeletons.length;
      i++
    ) {

      if (
        skeletons[i] &&
        typeof skeletons[i].remove ===
        "function"
      ) {

        skeletons[i].remove();

      }

    }

  }


  /* =======================================================
     GET DISTRICT DISPLAY NAME
     ======================================================= */

  function getDistrictDisplayName(
    value
  ) {

    if (
      App.district &&
      typeof App.district.getDisplayName ===
      "function"
    ) {

      try {

        return App.district.getDisplayName(
          value
        );

      }
      catch (error) {

        debug(
          "[UBnux] District display error:",
          error
        );

      }

    }


    if (
      App.district &&
      typeof App.district.getDistrictDisplayName ===
      "function"
    ) {

      try {

        return App.district.getDistrictDisplayName(
          value
        );

      }
      catch (error2) {

        debug(
          "[UBnux] District display error:",
          error2
        );

      }

    }


    return String(
      value || ""
    );

  }


  /* =======================================================
     GET CATEGORY DISPLAY NAME
     ======================================================= */

  function getCategoryDisplayName(
    value
  ) {

    if (
      App.categories &&
      typeof App.categories.getCategoryDisplayName ===
      "function"
    ) {

      try {

        return App.categories.getCategoryDisplayName(
          value
        );

      }
      catch (error) {

        debug(
          "[UBnux] Category display error:",
          error
        );

      }

    }


    return String(
      value || ""
    );

  }


  /* =======================================================
     UPDATE ACTIVE FILTERS
     ======================================================= */

  function updateActiveFilters() {

    var container =
      getElement("activeFilters");

    if (!container) {

      return;

    }


    var state =
      typeof App.getState === "function"
        ? App.getState()
        : {};


    var search =
      state.search || "";

    var district =
      state.selectedDistrict ||
      state.district ||
      "";

    var category =
      state.selectedCategory ||
      state.category ||
      "";


    var html = "";


    if (search) {

      html +=
        '<span class="active-filter">' +
          '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
          '<span>' +
            escapeHTML(search) +
          '</span>' +
        '</span>';

    }


    if (
      district &&
      String(district)
        .toUpperCase() !==
        "ALL"
    ) {

      html +=
        '<span class="active-filter">' +
          '<i class="fa-solid fa-location-dot" aria-hidden="true"></i>' +
          '<span>' +
            escapeHTML(
              getDistrictDisplayName(
                district
              )
            ) +
          '</span>' +
        '</span>';

    }


    if (
      category &&
      String(category)
        .toUpperCase() !==
        "ALL"
    ) {

      html +=
        '<span class="active-filter">' +
          '<i class="fa-solid fa-tag" aria-hidden="true"></i>' +
          '<span>' +
            escapeHTML(
              getCategoryDisplayName(
                category
              )
            ) +
          '</span>' +
        '</span>';

    }


    container.innerHTML =
      html;

    container.hidden =
      !html;

  }


  /* =======================================================
     OPEN BUSINESS MODAL
     ======================================================= */

  function openBusiness(
    business
  ) {

    if (!business) {

      return false;

    }


    /*
     * Preferred modal module API.
     */

    if (
      App.modal &&
      typeof App.modal.openBusinessModal ===
      "function"
    ) {

      try {

        return (
          App.modal.openBusinessModal(
            business
          ) !== false
        );

      }
      catch (error) {

        console.error(
          "[UBnux] Business modal error:",
          error
        );

      }

    }


    /*
     * Top-level compatibility.
     */

    if (
      typeof App.openBusinessModal ===
      "function"
    ) {

      try {

        return (
          App.openBusinessModal(
            business
          ) !== false
        );

      }
      catch (error2) {

        console.error(
          "[UBnux] Top-level business modal error:",
          error2
        );

      }

    }


    /*
     * Store selected business if
     * state module supports it.
     */

    if (
      typeof App.setSelectedBusiness ===
      "function"
    ) {

      App.setSelectedBusiness(
        business
      );

    }


    return false;

  }


  /* =======================================================
     FIND BUSINESS BY ID
     ======================================================= */

  function findBusinessById(
    businessId
  ) {

    var id =
      String(
        businessId || ""
      )
        .trim()
        .toLowerCase();


    if (!id) {

      return null;

    }


    var state =
      typeof App.getState === "function"
        ? App.getState()
        : {};


    var businesses =
      Array.isArray(
        state.businesses
      )
        ? state.businesses
        : [];


    var filtered =
      Array.isArray(
        state.filteredBusinesses
      )
        ? state.filteredBusinesses
        : [];


    /*
     * Search filtered first.
     */

    for (
      var i = 0;
      i < filtered.length;
      i++
    ) {

      var filteredId =
        getBusinessId(
          filtered[i]
        )
          .trim()
          .toLowerCase();


      if (
        filteredId &&
        filteredId === id
      ) {

        return filtered[i];

      }

    }


    /*
     * Then search complete dataset.
     */

    for (
      var j = 0;
      j < businesses.length;
      j++
    ) {

      var itemId =
        getBusinessId(
          businesses[j]
        )
          .trim()
          .toLowerCase();


      if (
        itemId &&
        itemId === id
      ) {

        return businesses[j];

      }

    }


    /*
     * Temporary business-N ID.
     */

    if (
      /^business-\d+$/i.test(id)
    ) {

      var index =
        parseInt(
          id.replace(
            /^business-/i,
            ""
          ),
          10
        );


      if (
        Number.isFinite(index)
      ) {

        if (
          filtered[index]
        ) {

          return filtered[index];

        }

        if (
          businesses[index]
        ) {

          return businesses[index];

        }

      }

    }


    return null;

  }


  /* =======================================================
     CARD EVENT HANDLING

     Uses event delegation so dynamically rendered cards
     always work without repeatedly attaching many listeners.
     ======================================================= */

  var cardEventsBound =
    false;


  function bindBusinessCardEvents() {

    refreshDOMReferences();

    if (!businessGrid) {

      return;

    }


    if (cardEventsBound) {

      return;

    }


    cardEventsBound =
      true;


    businessGrid.addEventListener(
      "click",
      function (event) {

        var target =
          event.target;


        if (!target) {

          return;

        }


        /*
         * Never intercept normal links.
         */

        var link =
          target.closest
            ? target.closest("a")
            : null;


        if (link) {

          return;

        }


        /*
         * Ignore skeleton cards.
         */

        var skeleton =
          target.closest
            ? target.closest(
                ".business-card-skeleton"
              )
            : null;


        if (skeleton) {

          return;

        }


        var card =
          target.closest
            ? target.closest(
                ".business-card"
              )
            : null;


        if (!card) {

          return;

        }


        var action =
          target.closest
            ? target.closest(
                "[data-business-action]"
              )
            : null;


        var businessId =
          action
            ? action.getAttribute(
                "data-business-id"
              )
            : card.getAttribute(
                "data-business-id"
              );


        var business =
          findBusinessById(
            businessId
          );


        /*
         * Fallback by card index.
         */

        if (!business) {

          var cardIndex =
            parseInt(
              card.getAttribute(
                "data-business-index"
              ),
              10
            );


          var state =
            typeof App.getState ===
            "function"
              ? App.getState()
              : {};


          if (
            Number.isFinite(cardIndex) &&
            Array.isArray(
              state.filteredBusinesses
            ) &&
            state.filteredBusinesses[
              cardIndex
            ]
          ) {

            business =
              state.filteredBusinesses[
                cardIndex
              ];

          }

        }


        if (business) {

          openBusiness(
            business
          );

        }
        else {

          debug(
            "[UBnux] Business not found:",
            businessId
          );

        }

      }
    );


    businessGrid.addEventListener(
      "keydown",
      function (event) {

        if (
          event.key !== "Enter" &&
          event.key !== " "
        ) {

          return;

        }


        var card =
          event.target &&
          event.target.closest
            ? event.target.closest(
                ".business-card"
              )
            : null;


        if (!card) {

          return;

        }


        /*
         * Don't intercept when focus
         * is on a button/link.
         */

        if (
          event.target !== card
        ) {

          return;

        }


        event.preventDefault();


        var businessId =
          card.getAttribute(
            "data-business-id"
          );


        var business =
          findBusinessById(
            businessId
          );


        if (business) {

          openBusiness(
            business
          );

        }

      }
    );

  }


  /* =======================================================
     LOAD MORE EVENT
     ======================================================= */

  var loadMoreBound =
    false;


  function setupLoadMore() {

    refreshDOMReferences();

    if (!loadMoreButton) {

      return;

    }


    if (loadMoreBound) {

      return;

    }


    loadMoreBound =
      true;


    loadMoreButton.addEventListener(
      "click",
      function (event) {

        event.preventDefault();


        if (
          this.disabled
        ) {

          return;

        }


        this.disabled =
          true;


        try {

          loadMore();

        }
        finally {

          /*
           * renderCurrentPage()
           * will update Load More state.
           */

          setTimeout(
            function () {

              if (
                loadMoreButton
              ) {

                loadMoreButton.disabled =
                  false;

              }

              updateLoadMore();

            },
            50
          );

        }

      }
    );

  }


  /* =======================================================
     INITIALIZE
     ======================================================= */

  function init() {

    refreshDOMReferences();

    setupLoadMore();

    bindBusinessCardEvents();


    App.businessesReady =
      true;


    debug(
      "[UBnux] businesses.js initialized.",
      {
        businessGrid:
          !!businessGrid,

        businessCount:
          !!businessCount,

        emptyState:
          !!emptyState,

        loadMore:
          !!loadMoreButton
      }
    );


    return true;

  }


  /* =======================================================
     PUBLIC API
     ======================================================= */

  App.businesses = {

    /* Helpers */

    escapeHTML:
      escapeHTML,

    getBusinessId:
      getBusinessId,

    getBusinessName:
      getBusinessName,

    getCategoryName:
      getCategoryName,

    getDistrictName:
      getDistrictName,

    getArea:
      getArea,

    getAddress:
      getAddress,

    getPhone:
      getPhone,

    getWhatsApp:
      getWhatsApp,

    getLogo:
      getLogo,

    getCover:
      getCover,

    getRating:
      getRating,

    getReviewCount:
      getReviewCount,

    getDescription:
      getDescription,

    isFeatured:
      isFeatured,

    isVerified:
      isVerified,

    isActive:
      isActive,

    getStars:
      getStars,

    formatRating:
      formatRating,

    getPhoneURL:
      getPhoneURL,

    getWhatsAppURL:
      getWhatsAppURL,

    normalizeImageURL:
      normalizeImageURL,

    getFallbackImage:
      getFallbackImage,


    /* Rendering */

    createBusinessCard:
      createBusinessCard,

    renderBusinesses:
      renderBusinesses,

    renderCurrentPage:
      renderCurrentPage,

    renderFilteredBusinesses:
      renderFilteredBusinesses,

    refreshBusinessList:
      refreshBusinessList,


    /* Pagination */

    loadMore:
      loadMore,

    resetPagination:
      resetPagination,


    /* UI */

    showSkeletons:
      showSkeletons,

    hideSkeletons:
      hideSkeletons,

    updateBusinessCount:
      updateBusinessCount,

    updateSearchStatus:
      updateSearchStatus,

    updateLoadMore:
      updateLoadMore,

    updateLoadMoreText:
      updateLoadMoreText,

    showEmptyState:
      showEmptyState,

    hideEmptyState:
      hideEmptyState,

    updateActiveFilters:
      updateActiveFilters,


    /* Lookup / modal */

    getDistrictDisplayName:
      getDistrictDisplayName,

    getCategoryDisplayName:
      getCategoryDisplayName,

    findBusinessById:
      findBusinessById,

    openBusiness:
      openBusiness,

    bindBusinessCardEvents:
      bindBusinessCardEvents,


    /* Initialization */

    init:
      init

  };


  /* =======================================================
     TOP-LEVEL COMPATIBILITY ALIASES
     ======================================================= */

  App.renderBusinesses =
    renderBusinesses;


  App.renderCurrentPage =
    renderCurrentPage;


  App.renderFilteredBusinesses =
    renderFilteredBusinesses;


  App.refreshBusinessList =
    refreshBusinessList;


  App.loadMoreBusinesses =
    loadMore;


  App.resetBusinessPagination =
    resetPagination;


  App.updateBusinessCount =
    updateBusinessCount;


  App.updateSearchStatus =
    updateSearchStatus;


  App.showBusinessSkeletons =
    showSkeletons;


  App.hideBusinessSkeletons =
    hideSkeletons;


  App.updateBusinessLoadMore =
    updateLoadMore;


  App.findBusinessById =
    findBusinessById;


  App.openBusiness =
    openBusiness;


  App.createBusinessCard =
    createBusinessCard;


  /* =======================================================
     INITIALIZE
     ======================================================= */

  init();


  /* =======================================================
     DEBUG READY MESSAGE
     ======================================================= */

  debug(
    "[UBnux] businesses.js ready."
  );


})(window, document);
