/* =========================================================
   UBnux - Business Manager
   File: assets/js/businesses.js

   Responsibilities:
   - Business card rendering
   - Business list rendering
   - Pagination
   - Load more
   - Business count
   - Empty state
   - Skeleton state
   - Business modal integration
   - Search/filter result rendering
   - Robust business status handling
   ========================================================= */

(function (window, document) {

  "use strict";


  /* =======================================================
     SHARED NAMESPACE
     ======================================================= */

  window.UBnux =
    window.ZilaBiz ||
    window.UBnux ||
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
    ) ||
    18;


  /* =======================================================
     DEBUG
     ======================================================= */

  var DEBUG =
    CONFIG.DEBUG === true;


  function debug() {

    if (
      !DEBUG ||
      !window.console ||
      typeof console.log !==
      "function"
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

  function getElement(
    id
  ) {

    return document.getElementById(
      id
    );

  }


  /* =======================================================
     DOM REFERENCES
     ======================================================= */

  var businessGrid =
    getElement(
      "businessGrid"
    );

  var businessCount =
    getElement(
      "businessCount"
    );

  var emptyState =
    getElement(
      "emptyState"
    );

  var loadMoreContainer =
    getElement(
      "loadMoreContainer"
    );

  var loadMoreButton =
    getElement(
      "loadMoreButton"
    );

  var searchStatus =
    getElement(
      "searchStatus"
    );


  /* =======================================================
     REFRESH DOM REFERENCES
     ======================================================= */

  function refreshDOMReferences() {

    if (
      !businessGrid
    ) {

      businessGrid =
        getElement(
          "businessGrid"
        );

    }


    if (
      !businessCount
    ) {

      businessCount =
        getElement(
          "businessCount"
        );

    }


    if (
      !emptyState
    ) {

      emptyState =
        getElement(
          "emptyState"
        );

    }


    if (
      !loadMoreContainer
    ) {

      loadMoreContainer =
        getElement(
          "loadMoreContainer"
        );

    }


    if (
      !loadMoreButton
    ) {

      loadMoreButton =
        getElement(
          "loadMoreButton"
        );

    }


    if (
      !searchStatus
    ) {

      searchStatus =
        getElement(
          "searchStatus"
        );

    }

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
      !Array.isArray(
        fields
      )
    ) {

      return (
        fallback ===
        undefined
          ? ""
          : fallback
      );

    }


    /*
     * Exact property lookup
     */

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
          exactValue !==
            undefined &&
          exactValue !==
            null &&
          String(
            exactValue
          ).trim() !== ""
        ) {

          return exactValue;

        }

      }

    }


    /*
     * Case-insensitive lookup
     */

    var keys =
      Object.keys(
        business
      );


    for (
      var j = 0;
      j < fields.length;
      j++
    ) {

      var target =
        String(
          fields[j]
        )
        .trim()
        .toLowerCase();


      for (
        var k = 0;
        k < keys.length;
        k++
      ) {

        if (
          String(
            keys[k]
          )
          .trim()
          .toLowerCase() ===
          target
        ) {

          var value =
            business[
              keys[k]
            ];


          if (
            value !==
              undefined &&
            value !==
              null &&
            String(
              value
            ).trim() !== ""
          ) {

            return value;

          }

        }

      }

    }


    return (
      fallback ===
      undefined
        ? ""
        : fallback
    );

  }


  /* =======================================================
     TEXT
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


    return String(
      value ===
        null ||
      value ===
        undefined
        ? ""
        : value
    ).trim();

  }


  /* =======================================================
     NUMBER
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
        String(
          value
        )
        .replace(
          /,/g,
          ""
        )
      );


    return Number.isFinite(
      parsed
    )
      ? parsed
      : (
          fallback ===
          undefined
            ? 0
            : fallback
        );

  }


  /* =======================================================
     ESCAPE HTML
     ======================================================= */

  function escapeHTML(
    value
  ) {

    if (
      App.utils &&
      typeof App.utils.escapeHTML ===
      "function"
    ) {

      return App.utils.escapeHTML(
        value
      );

    }


    if (
      value ===
      null ||
      value ===
      undefined
    ) {

      return "";

    }


    return String(
      value
    )
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
     NORMALIZE IMAGE URL
     ======================================================= */

  function normalizeImageURL(
    value
  ) {

    var url =
      String(
        value ||
        ""
      ).trim();


    if (
      !url
    ) {

      return "";

    }


    /*
     * Allow data:image fallback.
     */

    if (
      /^data:image\//i.test(
        url
      )
    ) {

      return url;

    }


    /*
     * Allow normal http/https images.
     */

    if (
      /^https?:\/\//i.test(
        url
      )
    ) {

      return url;

    }


    /*
     * Allow protocol-relative URLs.
     */

    if (
      /^\/\//.test(
        url
      )
    ) {

      return (
        window.location.protocol +
        url
      );

    }


    /*
     * Relative image URL.
     */

    if (
      url.charAt(0) ===
      "/"
    ) {

      return url;

    }


    return url;

  }


  /* =======================================================
     BUSINESS ID
     ======================================================= */

  function getBusinessId(
    business
  ) {

    return text(
      business,
      [
        "BusinessID",
        "businessID",
        "businessId",
        "BusinessId",
        "BusinessCode",
        "businessCode",
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

  function getBusinessName(
    business
  ) {

    return text(
      business,
      [
        "BusinessName",
        "businessName",
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

  function getCategoryName(
    business
  ) {

    if (
      App.filters &&
      typeof App.filters.getCategoryName ===
      "function"
    ) {

      try {

        var filterCategory =
          App.filters.getCategoryName(
            business
          );


        if (
          filterCategory
        ) {

          return filterCategory;

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
        "Category",
        "category",
        "CategoryTitle",
        "categoryTitle",
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

  function getDistrictName(
    business
  ) {

    return text(
      business,
      [
        "DistrictName",
        "districtName",
        "District",
        "district",
        "DistrictTitle",
        "districtTitle",
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

  function getArea(
    business
  ) {

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

  function getAddress(
    business
  ) {

    return text(
      business,
      [
        "Address",
        "address",
        "FullAddress",
        "fullAddress",
        "BusinessAddress",
        "businessAddress"
      ],
      ""
    );

  }


  /* =======================================================
     PHONE
     ======================================================= */

  function getPhone(
    business
  ) {

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

  function getWhatsApp(
    business
  ) {

    return text(
      business,
      [
        "WhatsApp",
        "whatsapp",
        "Whatsapp",
        "WhatsAppNumber",
        "whatsappNumber",
        "WhatsAppMobile",
        "whatsappMobile"
      ],
      ""
    );

  }


  /* =======================================================
     LOGO
     ======================================================= */

  function getLogo(
    business
  ) {

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
        "Image",
        "image",
        "ImageURL",
        "imageURL",
        "ImageUrl",
        "imageUrl",
        "BusinessImage",
        "businessImage"
      ],
      ""
    );

  }


  /* =======================================================
     COVER
     ======================================================= */

  function getCover(
    business
  ) {

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
        "bannerImage"
      ],
      ""
    );

  }


  /* =======================================================
     RATING
     ======================================================= */

  function getRating(
    business
  ) {

    return number(
      business,
      [
        "Rating",
        "rating",
        "AverageRating",
        "averageRating",
        "AvgRating",
        "avgRating"
      ],
      0
    );

  }


  /* =======================================================
     REVIEW COUNT
     ======================================================= */

  function getReviewCount(
    business
  ) {

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

  function getDescription(
    business
  ) {

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
        "details"
      ],
      ""
    );

  }


  /* =======================================================
     FEATURED
     ======================================================= */

  function isFeatured(
    business
  ) {

    var value =
      text(
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
      )
      .toLowerCase();


    return (
      value === "true" ||
      value === "yes" ||
      value === "1" ||
      value === "featured" ||
      value === "active"
    );

  }


  /* =======================================================
     VERIFIED
     ======================================================= */

  function isVerified(
    business
  ) {

    var value =
      text(
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
      )
      .toLowerCase();


    return (
      value === "true" ||
      value === "yes" ||
      value === "1" ||
      value === "verified" ||
      value === "active"
    );

  }


  /* =======================================================
     ACTIVE STATUS
     ======================================================= */

  function isActive(
    business
  ) {

    if (
      !business ||
      typeof business !==
      "object"
    ) {

      return false;

    }


    /*
     * IMPORTANT:
     *
     * Only use a field as a visibility field
     * when that field actually exists.
     *
     * This prevents unrelated fields from
     * accidentally hiding a business.
     */

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


    var raw =
      "";


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
          candidate !==
            undefined &&
          candidate !==
            null &&
          String(
            candidate
          ).trim() !== ""
        ) {

          foundStatus =
            true;

          raw =
            String(
              candidate
            )
            .trim()
            .toLowerCase();

          break;

        }

      }

    }


    /*
     * No status field:
     * business should be visible.
     */

    if (
      !foundStatus
    ) {

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
      inactiveValues.indexOf(
        raw
      ) !== -1
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
      activeValues.indexOf(
        raw
      ) !== -1
    ) {

      return true;

    }


    /*
     * Unknown status:
     *
     * Do NOT hide the business.
     *
     * This is important because backend
     * may use values such as:
     * Pending, Review, Listed, etc.
     */

    return true;

  }


  /* =======================================================
     STAR HTML
     ======================================================= */

  function getStars(
    rating
  ) {

    var value =
      Number(
        rating
      ) || 0;


    value =
      Math.max(
        0,
        Math.min(
          5,
          value
        )
      );


    var rounded =
      Math.round(
        value
      );


    var html =
      "";


    for (
      var i = 1;
      i <= 5;
      i++
    ) {

      html +=
        i <= rounded
          ? '<span class="star filled">★</span>'
          : '<span class="star">☆</span>';

    }


    return html;

  }


  /* =======================================================
     FORMAT RATING
     ======================================================= */

  function formatRating(
    rating
  ) {

    var value =
      Number(
        rating
      ) || 0;


    if (
      value <= 0
    ) {

      return "New";

    }


    return value.toFixed(
      1
    );

  }


  /* =======================================================
     PHONE URL
     ======================================================= */

  function getPhoneURL(
    phone
  ) {

    if (
      !phone
    ) {

      return "";

    }


    var value =
      String(
        phone
      )
      .replace(
        /[^\d+]/g,
        ""
      );


    return value
      ? "tel:" +
        value
      : "";

  }


  /* =======================================================
     WHATSAPP URL
     ======================================================= */

  function getWhatsAppURL(
    phone
  ) {

    if (
      !phone
    ) {

      return "";

    }


    var value =
      String(
        phone
      )
      .replace(
        /\D/g,
        ""
      );


    if (
      value.length ===
      10
    ) {

      value =
        "91" +
        value;

    }


    if (
      value.length <
      10
    ) {

      return "";

    }


    return (
      "https://wa.me/" +
      value
    );

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
          '<text x="300" y="370" text-anchor="middle" font-family="Arial" font-size="22" fill="#6b7280">UBnux</text>' +
        '</svg>'
      )
    );

  }


  /* =======================================================
     SAFE HREF ATTRIBUTE
     ======================================================= */

  function hrefAttribute(
    url
  ) {

    var value =
      String(
        url ||
        ""
      );


    if (
      !/^tel:/i.test(
        value
      ) &&
      !/^https:\/\//i.test(
        value
      ) &&
      !/^http:\/\//i.test(
        value
      )
    ) {

      return "";

    }


    return (
      'href="' +
      escapeHTML(
        value
      ) +
      '"'
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
      typeof business !==
      "object"
    ) {

      return "";

    }


    /*
     * Do not silently fail here.
     *
     * renderBusinesses() already handles
     * active filtering.
     */

    if (
      !isActive(
        business
      )
    ) {

      debug(
        "[UBnux] Business skipped because inactive:",
        business
      );


      return "";

    }


    var id =
      getBusinessId(
        business
      );


    /*
     * If ID is missing, create a temporary
     * stable index-based ID.
     */

    if (
      !id
    ) {

      id =
        "business-" +
        (
          Number(
            index
          ) || 0
        );

    }


    var name =
      getBusinessName(
        business
      );


    var category =
      getCategoryName(
        business
      );


    var area =
      getArea(
        business
      );


    var district =
      getDistrictName(
        business
      );


    var address =
      getAddress(
        business
      );


    var phone =
      getPhone(
        business
      );


    var whatsapp =
      getWhatsApp(
        business
      ) ||
      phone;


    var logo =
      normalizeImageURL(
        getLogo(
          business
        )
      );


    var cover =
      normalizeImageURL(
        getCover(
          business
        )
      );


    var image =
      cover ||
      logo ||
      getFallbackImage();


    var rating =
      getRating(
        business
      );


    var reviewCount =
      getReviewCount(
        business
      );


    var featured =
      isFeatured(
        business
      );


    var verified =
      isVerified(
        business
      );


    var description =
      getDescription(
        business
      );


    var phoneURL =
      getPhoneURL(
        phone
      );


    var whatsappURL =
      getWhatsAppURL(
        whatsapp
      );


    var locationText =
      area ||
      district;


    if (
      area &&
      district &&
      area.toLowerCase() !==
      district.toLowerCase()
    ) {

      locationText =
        area +
        ", " +
        district;

    }


    var safeId =
      escapeHTML(
        id
      );


    var html =
      "";


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
      escapeHTML(
        index
      ) +
      '" ' +
      'tabindex="0" ' +
      'role="article">';


    /* =====================================================
       IMAGE
       ===================================================== */

    html +=
      '<div class="business-card-image-wrap">';


    html +=
      '<img ' +
      'class="business-card-image" ' +
      'src="' +
      escapeHTML(
        image
      ) +
      '" ' +
      'alt="' +
      escapeHTML(
        name
      ) +
      '" ' +
      'loading="lazy" ' +
      'decoding="async" ' +
      'onerror="this.onerror=null;this.src=\'' +
      escapeHTML(
        getFallbackImage()
      ) +
      '\'">';


    /* =====================================================
       BADGES
       ===================================================== */

    html +=
      '<div class="business-card-badges">';


    if (
      featured
    ) {

      html +=
        '<span class="business-badge featured">' +
          '<i class="fa-solid fa-star"></i>' +
          ' Featured' +
        '</span>';

    }


    if (
      verified
    ) {

      html +=
        '<span class="business-badge verified">' +
          '<i class="fa-solid fa-circle-check"></i>' +
          ' Verified' +
        '</span>';

    }


    html +=
      '</div>';


    html +=
      '</div>';


    /* =====================================================
       CONTENT
       ===================================================== */

    html +=
      '<div class="business-card-content">';


    html +=
      '<h3 class="business-card-title">' +
        escapeHTML(
          name
        ) +
      '</h3>';


    /* =====================================================
       CATEGORY
       ===================================================== */

    if (
      category
    ) {

      html +=
        '<div class="business-card-category">' +
          '<i class="fa-solid fa-tag"></i>' +
          '<span>' +
            escapeHTML(
              category
            ) +
          '</span>' +
        '</div>';

    }


    /* =====================================================
       RATING
       ===================================================== */

    if (
      rating > 0
    ) {

      html +=
        '<div class="business-card-rating">' +

          '<span class="business-rating-stars">' +
            getStars(
              rating
            ) +
          '</span>' +

          '<strong>' +
            escapeHTML(
              formatRating(
                rating
              )
            ) +
          '</strong>' +

          (
            reviewCount > 0
              ? '<span class="business-review-count">(' +
                  escapeHTML(
                    reviewCount
                  ) +
                  ')</span>'
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

    if (
      locationText
    ) {

      html +=
        '<div class="business-card-location">' +
          '<i class="fa-solid fa-location-dot"></i>' +
          '<span>' +
            escapeHTML(
              locationText
            ) +
          '</span>' +
        '</div>';

    }


    /* =====================================================
       ADDRESS
       ===================================================== */

    if (
      address
    ) {

      html +=
        '<div class="business-card-address">' +
          '<i class="fa-solid fa-map-pin"></i>' +
          '<span>' +
            escapeHTML(
              address
            ) +
          '</span>' +
        '</div>';

    }


    /* =====================================================
       DESCRIPTION
       ===================================================== */

    if (
      description
    ) {

      var safeDescription =
        escapeHTML(
          description
        );


      html +=
        '<p class="business-card-description">' +
          safeDescription.slice(
            0,
            150
          ) +
          (
            description.length >
            150
              ? "..."
              : ""
          ) +
        '</p>';

    }


    /* =====================================================
       ACTIONS
       ===================================================== */

    html +=
      '<div class="business-card-actions">';


    if (
      phoneURL
    ) {

      html +=
        '<a ' +
        'class="business-card-action call" ' +
        hrefAttribute(
          phoneURL
        ) +
        '>' +

          '<i class="fa-solid fa-phone"></i>' +
          '<span>Call</span>' +

        '</a>';

    }


    if (
      whatsappURL
    ) {

      html +=
        '<a ' +
        'class="business-card-action whatsapp" ' +
        hrefAttribute(
          whatsappURL
        ) +
        ' target="_blank" rel="noopener noreferrer">' +

          '<i class="fa-brands fa-whatsapp"></i>' +
          '<span>WhatsApp</span>' +

        '</a>';

    }


    html +=
      '<button ' +
      'type="button" ' +
      'class="business-card-action view-details" ' +
      'data-business-action="view" ' +
      'data-business-id="' +
      safeId +
      '">' +

        '<i class="fa-solid fa-eye"></i>' +
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
      options ||
      {};


    refreshDOMReferences();


    if (
      !businessGrid
    ) {

      console.error(
        "[UBnux] businessGrid element not found."
      );


      return false;

    }


    var list =
      Array.isArray(
        businesses
      )
        ? businesses
        : [];


    debug(
      "[UBnux] renderBusinesses INPUT:",
      list.length,
      list
    );


    /*
     * IMPORTANT:
     *
     * Do not aggressively filter here.
     * The filter system has already produced
     * filteredBusinesses.
     *
     * We only remove explicitly inactive records.
     */

    var activeBusinesses =
      [];


    for (
      var i = 0;
      i < list.length;
      i++
    ) {

      if (
        isActive(
          list[i]
        )
      ) {

        activeBusinesses.push(
          list[i]
        );

      }
      else {

        debug(
          "[UBnux] Explicitly inactive business:",
          list[i]
        );

      }

    }


    debug(
      "[UBnux] ACTIVE BUSINESS COUNT:",
      activeBusinesses.length
    );


    if (
      !activeBusinesses.length
    ) {

      businessGrid.innerHTML =
        "";


      showEmptyState(
        true
      );


      updateBusinessCount(
        0
      );


      updateLoadMore(
        false
      );


      return true;

    }


    hideEmptyState();


    var html =
      "";


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


    /*
     * If no card HTML was generated,
     * show diagnostic information.
     */

    if (
      !html
    ) {

      console.error(
        "[UBnux] No business card HTML generated.",
        activeBusinesses
      );


      businessGrid.innerHTML =
        "";


      showEmptyState(
        true
      );


      updateBusinessCount(
        0
      );


      updateLoadMore(
        false
      );


      return false;

    }


    businessGrid.innerHTML =
      html;


    var renderedCards =
      businessGrid.querySelectorAll(
        ".business-card"
      );


    debug(
      "[UBnux] BUSINESS CARDS ACTUALLY RENDERED:",
      renderedCards.length
    );


    updateBusinessCount(
      activeBusinesses.length
    );


    bindBusinessCardEvents();


    if (
      options.updateLoadMore !==
      false
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


    if (
      !businessGrid
    ) {

      console.error(
        "[UBnux] Cannot render current page: businessGrid missing."
      );


      return [];

    }


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
      Number(
        state.page
      ) || 1;


    var pageSize =
      Number(
        state.pageSize
      ) ||
      PAGE_SIZE;


    /*
     * Protect against invalid page values.
     */

    if (
      page <
      1
    ) {

      page =
        1;

    }


    if (
      pageSize <
      1
    ) {

      pageSize =
        PAGE_SIZE;

    }


    var end =
      page *
      pageSize;


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

        end:
          end,

        visible:
          visible.length
      }
    );


    var rendered =
      renderBusinesses(
        visible,
        {
          updateLoadMore:
            false
        }
      );


    updateBusinessCount(
      filtered.length
    );


    updateSearchStatus(
      filtered.length,
      state
    );


    updateLoadMore(
      end <
      filtered.length
    );


    debug(
      "[UBnux] renderCurrentPage RESULT:",
      rendered
    );


    return visible;

  }


  /* =======================================================
     LOAD MORE
     ======================================================= */

  function loadMore() {

    var state =
      typeof App.getState ===
      "function"
        ? App.getState()
        : {};


    var currentPage =
      Number(
        state.page
      ) || 1;


    var pageSize =
      Number(
        state.pageSize
      ) ||
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

      updateLoadMore(
        false
      );


      return false;

    }


    var nextPage =
      currentPage +
      1;


    var nextEnd =
      nextPage *
      pageSize;


    if (
      typeof App.setPage ===
      "function"
    ) {

      App.setPage(
        nextPage
      );

    }
    else if (
      typeof App.updateState ===
      "function"
    ) {

      App.updateState(
        {
          page:
            nextPage
        }
      );

    }


    renderCurrentPage();


    updateLoadMore(
      nextEnd <
      filtered.length
    );


    return true;

  }


  /* =======================================================
     RESET PAGINATION
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

      App.setPage(
        1
      );

      return true;

    }


    if (
      typeof App.updateState ===
      "function"
    ) {

      App.updateState(
        {
          page:
            1
        }
      );

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


    resetPagination();


    renderCurrentPage();


    return true;

  }


  /* =======================================================
     UPDATE BUSINESS COUNT
     ======================================================= */

  function updateBusinessCount(
    count
  ) {

    refreshDOMReferences();


    if (
      !businessCount
    ) {

      return;

    }


    var total =
      Number(
        count
      ) || 0;


    businessCount.textContent =
      total.toLocaleString(
        "en-IN"
      );


    businessCount.dataset.count =
      String(
        total
      );

  }


  /* =======================================================
     UPDATE SEARCH STATUS
     ======================================================= */

  function updateSearchStatus(
    count,
    state
  ) {

    refreshDOMReferences();


    if (
      !searchStatus
    ) {

      return;

    }


    var search =
      state &&
      state.search
        ? String(
            state.search
          ).trim()
        : "";


    var district =
      state &&
      state.selectedDistrict
        ? state.selectedDistrict
        : (
            state &&
            state.district
              ? state.district
              : ""
          );


    var category =
      state &&
      state.selectedCategory
        ? state.selectedCategory
        : (
            state &&
            state.category
              ? state.category
              : ""
          );


    var total =
      Number(
        count
      ) || 0;


    if (
      search
    ) {

      searchStatus.textContent =
        total +
        (
          total ===
          1
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
      String(
        district
      ).toUpperCase() !==
      "ALL"
    ) {

      searchStatus.textContent =
        total +
        (
          total ===
          1
            ? " business"
            : " businesses"
        ) +
        " available";


      return;

    }


    if (
      category &&
      String(
        category
      ).toUpperCase() !==
      "ALL"
    ) {

      searchStatus.textContent =
        total +
        (
          total ===
          1
            ? " business"
            : " businesses"
        ) +
        " available";


      return;

    }


    searchStatus.textContent =
      total +
      (
        total ===
        1
          ? " business available"
          : " businesses available"
      );

  }


  /* =======================================================
     EMPTY STATE
     ======================================================= */

  function showEmptyState(
    show
  ) {

    refreshDOMReferences();


    if (
      !emptyState
    ) {

      return;

    }


    if (
      show
    ) {

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


    if (
      !emptyState
    ) {

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


    if (
      !loadMoreContainer
    ) {

      return;

    }


    if (
      hasMore
    ) {

      loadMoreContainer.hidden =
        false;


      loadMoreContainer.style.display =
        "";


      loadMoreContainer.setAttribute(
        "aria-hidden",
        "false"
      );


      if (
        loadMoreButton
      ) {

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


      if (
        loadMoreButton
      ) {

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


    if (
      !loadMoreButton
    ) {

      return;

    }


    loadMoreButton.textContent =
      textValue ||
      "Load More";

  }


  /* =======================================================
     SKELETONS
     ======================================================= */

  function showSkeletons(
    count
  ) {

    refreshDOMReferences();


    if (
      !businessGrid
    ) {

      return;

    }


    var total =
      Number(
        count
      ) ||
      Math.min(
        PAGE_SIZE,
        6
      );


    var html =
      "";


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


    if (
      !businessGrid
    ) {

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

      skeletons[i].remove();

    }

  }


  /* =======================================================
     UPDATE ACTIVE FILTERS
     ======================================================= */

  function updateActiveFilters() {

    var state =
      typeof App.getState ===
      "function"
        ? App.getState()
        : {};


    var search =
      state.search ||
      "";


    var district =
      state.district ||
      state.selectedDistrict ||
      "";


    var category =
      state.category ||
      state.selectedCategory ||
      "";


    var container =
      getElement(
        "activeFilters"
      );


    if (
      !container
    ) {

      return;

    }


    var html =
      "";


    if (
      search
    ) {

      html +=
        '<span class="active-filter">' +
          '<i class="fa-solid fa-magnifying-glass"></i>' +
          escapeHTML(
            search
          ) +
        '</span>';

    }


    if (
      district &&
      String(
        district
      ).toUpperCase() !==
      "ALL"
    ) {

      var districtName =
        getDistrictDisplayName(
          district
        );


      html +=
        '<span class="active-filter">' +
          '<i class="fa-solid fa-location-dot"></i>' +
          escapeHTML(
            districtName
          ) +
        '</span>';

    }


    if (
      category &&
      String(
        category
      ).toUpperCase() !==
      "ALL"
    ) {

      var categoryName =
        getCategoryDisplayName(
          category
        );


      html +=
        '<span class="active-filter">' +
          '<i class="fa-solid fa-tag"></i>' +
          escapeHTML(
            categoryName
          ) +
        '</span>';

    }


    container.innerHTML =
      html;


    container.hidden =
      !html;

  }


  /* =======================================================
     DISTRICT DISPLAY NAME
     ======================================================= */

  function getDistrictDisplayName(
    value
  ) {

    if (
      App.district &&
      typeof App.district.getDisplayName ===
      "function"
    ) {

      return App.district.getDisplayName(
        value
      );

    }


    if (
      App.district &&
      typeof App.district.getDistrictDisplayName ===
      "function"
    ) {

      return App.district.getDistrictDisplayName(
        value
      );

    }


    return String(
      value ||
      ""
    );

  }


  /* =======================================================
     CATEGORY DISPLAY NAME
     ======================================================= */

  function getCategoryDisplayName(
    value
  ) {

    if (
      App.categories &&
      typeof App.categories.getCategoryDisplayName ===
      "function"
    ) {

      return App.categories.getCategoryDisplayName(
        value
      );

    }


    return String(
      value ||
      ""
    );

  }


  /* =======================================================
     OPEN BUSINESS
     ======================================================= */

  function openBusiness(
    business
  ) {

    if (
      !business
    ) {

      return false;

    }


    if (
      App.modal &&
      typeof App.modal.openBusinessModal ===
      "function"
    ) {

      return App.modal.openBusinessModal(
        business
      );

    }


    if (
      typeof App.openBusinessModal ===
      "function"
    ) {

      return App.openBusinessModal(
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
        businessId ||
        ""
      )
      .trim()
      .toLowerCase();


    if (
      !id
    ) {

      return null;

    }


    var state =
      typeof App.getState ===
      "function"
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


    var combined =
      businesses.concat(
        filtered
      );


    /*
     * First try ID.
     */

    for (
      var i = 0;
      i < combined.length;
      i++
    ) {

      var itemId =
        getBusinessId(
          combined[i]
        )
        .toLowerCase();


      if (
        itemId &&
        itemId ===
        id
      ) {

        return combined[i];

      }

    }


    /*
     * If temporary business ID was used,
     * use data-business-index.
     */

    if (
      /^business-\d+$/i.test(
        id
      )
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
        Number.isFinite(
          index
        ) &&
        filtered[index]
      ) {

        return filtered[index];

      }

    }


    return null;

  }


  /* =======================================================
     CARD EVENTS
     ======================================================= */

  function bindBusinessCardEvents() {

    refreshDOMReferences();


    if (
      !businessGrid
    ) {

      return;

    }


    var cards =
      businessGrid.querySelectorAll(
        ".business-card:not(.business-card-skeleton)"
      );


    debug(
      "[UBnux] Binding card events:",
      cards.length
    );


    for (
      var i = 0;
      i < cards.length;
      i++
    ) {

      var card =
        cards[i];


      if (
        card.dataset.ubnuxBound ===
        "true"
      ) {

        continue;

      }


      card.dataset.ubnuxBound =
        "true";


      card.addEventListener(
        "click",
        function (
          event
        ) {

          /*
           * Don't open modal for links.
           */

          if (
            event.target.closest(
              "a"
            )
          ) {

            return;

          }


          var actionButton =
            event.target.closest(
              "[data-business-action]"
            );


          var businessId =
            actionButton
              ? actionButton.getAttribute(
                  "data-business-id"
                )
              : this.getAttribute(
                  "data-business-id"
                );


          var business =
            findBusinessById(
              businessId
            );


          if (
            !business
          ) {

            /*
             * Fallback:
             * Find using card index.
             */

            var cardIndex =
              parseInt(
                this.getAttribute(
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


          if (
            business
          ) {

            openBusiness(
              business
            );

          }
          else {

            debug(
              "[UBnux] Business not found for card:",
              businessId
            );

          }

        }
      );


      card.addEventListener(
        "keydown",
        function (
          event
        ) {

          if (
            event.key !==
              "Enter" &&
            event.key !==
              " "
          ) {

            return;

          }


          if (
            event.target !==
            this
          ) {

            return;

          }


          event.preventDefault();


          var businessId =
            this.getAttribute(
              "data-business-id"
            );


          var business =
            findBusinessById(
              businessId
            );


          if (
            business
          ) {

            openBusiness(
              business
            );

          }

        }
      );

    }

  }


  /* =======================================================
     LOAD MORE EVENT
     ======================================================= */

  function setupLoadMore() {

    refreshDOMReferences();


    if (
      !loadMoreButton
    ) {

      return;

    }


    if (
      loadMoreButton.dataset.ubnuxBound ===
      "true"
    ) {

      return;

    }


    loadMoreButton.dataset.ubnuxBound =
      "true";


    loadMoreButton.addEventListener(
      "click",
      function (
        event
      ) {

        event.preventDefault();


        if (
          this.disabled
        ) {

          return;

        }


        loadMore();

      }
    );

  }


  /* =======================================================
     INIT
     ======================================================= */

  function init() {

    refreshDOMReferences();


    setupLoadMore();


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

    loadMore:
      loadMore,

    resetPagination:
      resetPagination,

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


  App.updateBusinessCount =
    updateBusinessCount;


  App.updateSearchStatus =
    updateSearchStatus;


  App.showBusinessSkeletons =
    showSkeletons;


  App.hideBusinessSkeletons =
    hideSkeletons;


  App.findBusinessById =
    findBusinessById;


  App.openBusiness =
    openBusiness;


  /* =======================================================
     INITIALIZE
     ======================================================= */

  init();


})(window, document);
