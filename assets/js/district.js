/* =========================================================
   UBnux - District Manager
   File: assets/js/district.js

   Responsibilities:
   - Load / read districts from state
   - District dropdown
   - District modal
   - Saved district
   - Browser geolocation
   - Backend / location detection integration
   - District filtering
   - Header district display
   - District persistence
   - Safe HTML
   - Compatibility aliases
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


  var ALL_VALUE =
    String(
      CONFIG.ALL_VALUE ||
      "ALL"
    ).trim();


  var DEFAULT_DISTRICT =
    String(
      CONFIG.DEFAULT_DISTRICT ||
      ALL_VALUE
    ).trim();


  var STORAGE_KEY =
    String(
      CONFIG.DISTRICT_STORAGE_KEY ||
      "ubnux_selected_district"
    ).trim();


  var LEGACY_STORAGE_KEYS = [

    "ubnux_selected_district",

    "UBnux_selected_district",

    "zilabiz_selected_district",

    "zila_selected_district",

    "selectedDistrict"

  ];


  /* =======================================================
     DEBUG
     ======================================================= */

  function debug() {

    if (
      !CONFIG.DEBUG ||
      !window.console ||
      !console.log
    ) {

      return;

    }


    try {

      console.log.apply(
        console,
        arguments
      );

    } catch (error) {}

  }


  function debugWarn() {

    if (
      !CONFIG.DEBUG ||
      !window.console ||
      !console.warn
    ) {

      return;

    }


    try {

      console.warn.apply(
        console,
        arguments
      );

    } catch (error) {}

  }


  /* =======================================================
     DOM HELPERS
     ======================================================= */

  function $(id) {

    return document.getElementById(
      id
    );

  }


  function qs(selector) {

    try {

      return document.querySelector(
        selector
      );

    } catch (error) {

      return null;

    }

  }


  function qsa(selector) {

    try {

      return Array.prototype.slice.call(
        document.querySelectorAll(
          selector
        )
      );

    } catch (error) {

      return [];

    }

  }


  /* =======================================================
     SAFE HTML
     ======================================================= */

  function escapeHTML(value) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }


    return String(value)

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
     GENERIC FIELD READER
     ======================================================= */

  function getField(
    object,
    fields
  ) {

    if (
      !object ||
      typeof object !== "object"
    ) {

      return "";

    }


    if (
      !Array.isArray(fields)
    ) {

      fields = [
        fields
      ];

    }


    var keys =
      Object.keys(
        object
      );


    for (
      var i = 0;
      i < fields.length;
      i++
    ) {

      var requested =
        fields[i];


      if (
        requested === null ||
        requested === undefined
      ) {

        continue;

      }


      /* ---------------------------------------------------
         DIRECT PROPERTY
         --------------------------------------------------- */

      if (
        Object.prototype.hasOwnProperty.call(
          object,
          requested
        )
      ) {

        var direct =
          object[
            requested
          ];


        if (
          direct !== null &&
          direct !== undefined &&
          String(
            direct
          ).trim() !== ""
        ) {

          return direct;

        }

      }


      /* ---------------------------------------------------
         CASE-INSENSITIVE PROPERTY
         --------------------------------------------------- */

      var lowerRequested =
        String(
          requested
        ).toLowerCase();


      for (
        var j = 0;
        j < keys.length;
        j++
      ) {

        if (
          String(
            keys[j]
          ).toLowerCase() ===
          lowerRequested
        ) {

          var value =
            object[
              keys[j]
            ];


          if (
            value !== null &&
            value !== undefined &&
            String(
              value
            ).trim() !== ""
          ) {

            return value;

          }


          break;

        }

      }

    }


    return "";

  }


  /* =======================================================
     TEXT HELPER
     ======================================================= */

  function text(
    object,
    fields,
    fallback
  ) {

    var value =
      getField(
        object,
        fields
      );


    if (
      value === null ||
      value === undefined ||
      String(
        value
      ).trim() === ""
    ) {

      return (
        fallback ||
        ""
      );

    }


    return String(
      value
    ).trim();

  }


  /* =======================================================
     BOOLEAN HELPER
     ======================================================= */

  function toBoolean(
    value,
    fallback
  ) {

    if (
      value === true
    ) {

      return true;

    }


    if (
      value === false
    ) {

      return false;

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
      normalized === "true" ||
      normalized === "1" ||
      normalized === "yes" ||
      normalized === "active" ||
      normalized === "enabled" ||
      normalized === "on"
    ) {

      return true;

    }


    if (
      normalized === "false" ||
      normalized === "0" ||
      normalized === "no" ||
      normalized === "inactive" ||
      normalized === "disabled" ||
      normalized === "off"
    ) {

      return false;

    }


    return (
      fallback !== undefined
        ? fallback
        : true
    );

  }


  /* =======================================================
     NUMBER HELPER
     ======================================================= */

  function toNumber(
    value,
    fallback
  ) {

    var number =
      Number(
        value
      );


    if (
      Number.isFinite(
        number
      )
    ) {

      return number;

    }


    return (
      fallback !== undefined
        ? fallback
        : 0
    );

  }


  /* =======================================================
     DISTRICT ID
     ======================================================= */

  function getDistrictId(
    district
  ) {

    if (
      typeof district === "string" ||
      typeof district === "number"
    ) {

      return String(
        district
      ).trim();

    }


    return text(
      district,
      [

        "districtId",

        "DistrictID",

        "DistrictId",

        "districtID",

        "ID",

        "Id",

        "id"

      ],
      ""
    );

  }


  /* =======================================================
     DISTRICT NAME
     ======================================================= */

  function getDistrictName(
    district
  ) {

    if (
      typeof district === "string" ||
      typeof district === "number"
    ) {

      return String(
        district
      ).trim();

    }


    return text(
      district,
      [

        "districtName",

        "DistrictName",

        "District Name",

        "Name",

        "name",

        "Title",

        "title",

        "Label",

        "label"

      ],
      ""
    );

  }


  /* =======================================================
     DISTRICT CODE
     ======================================================= */

  function getDistrictCode(
    district
  ) {

    return text(
      district,
      [

        "districtCode",

        "DistrictCode",

        "District Code",

        "code",

        "Code"

      ],
      ""
    );

  }


  /* =======================================================
     DISTRICT SLUG
     ======================================================= */

  function getDistrictSlug(
    district
  ) {

    return text(
      district,
      [

        "slug",

        "Slug",

        "districtSlug",

        "DistrictSlug"

      ],
      ""
    );

  }


  /* =======================================================
     DISTRICT STATE
     ======================================================= */

  function getDistrictState(
    district
  ) {

    return text(
      district,
      [

        "state",

        "State",

        "stateName",

        "StateName"

      ],
      ""
    );

  }


  /* =======================================================
     STATE CODE
     ======================================================= */

  function getDistrictStateCode(
    district
  ) {

    return text(
      district,
      [

        "stateCode",

        "StateCode",

        "State Code"

      ],
      ""
    );

  }


  /* =======================================================
     DISTRICT PINCODE
     ======================================================= */

  function getDistrictPincode(
    district
  ) {

    return text(
      district,
      [

        "pincode",

        "Pincode",

        "PIN",

        "Pin",

        "pin",

        "PostalCode",

        "postalCode"

      ],
      ""
    );

  }


  /* =======================================================
     DISTRICT LATITUDE
     ======================================================= */

  function getLatitude(
    district
  ) {

    return text(
      district,
      [

        "latitude",

        "Latitude",

        "lat",

        "Lat"

      ],
      ""
    );

  }


  /* =======================================================
     DISTRICT LONGITUDE
     ======================================================= */

  function getLongitude(
    district
  ) {

    return text(
      district,
      [

        "longitude",

        "Longitude",

        "lng",

        "Lng",

        "long",

        "Long"

      ],
      ""
    );

  }


  /* =======================================================
     ACTIVE STATUS
     ======================================================= */

  function isDistrictActive(
    district
  ) {

    if (
      !district ||
      typeof district !== "object"
    ) {

      return true;

    }


    var value =
      getField(
        district,
        [

          "active",

          "Active",

          "isActive",

          "IsActive",

          "status",

          "Status",

          "enabled",

          "Enabled"

        ]
      );


    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {

      return true;

    }


    return toBoolean(
      value,
      true
    );

  }


  /* =======================================================
     SORT ORDER
     ======================================================= */

  function getSortOrder(
    district
  ) {

    return toNumber(
      getField(
        district,
        [

          "sortOrder",

          "SortOrder",

          "Sort",

          "sort"

        ]
      ),
      999999
    );

  }


  /* =======================================================
     GET DISTRICTS FROM STATE
     ======================================================= */

  function getDistricts() {

    var districts;


    /* ---------------------------------------------------
       Preferred: App.getDistricts()
       --------------------------------------------------- */

    if (
      typeof App.getDistricts ===
      "function"
    ) {

      try {

        districts =
          App.getDistricts();


        if (
          Array.isArray(
            districts
          )
        ) {

          return districts;

        }


        /*
         * Some state implementations may return
         * { data: [...] }
         */

        if (
          districts &&
          Array.isArray(
            districts.data
          )
        ) {

          return districts.data;

        }

      } catch (error) {

        debugWarn(
          "[UBnux] App.getDistricts() failed.",
          error
        );

      }

    }


    /* ---------------------------------------------------
       App.state.getDistricts()
       --------------------------------------------------- */

    if (
      App.state &&
      typeof App.state.getDistricts ===
      "function"
    ) {

      try {

        districts =
          App.state.getDistricts();


        if (
          Array.isArray(
            districts
          )
        ) {

          return districts;

        }


        if (
          districts &&
          Array.isArray(
            districts.data
          )
        ) {

          return districts.data;

        }

      } catch (error) {

        debugWarn(
          "[UBnux] App.state.getDistricts() failed.",
          error
        );

      }

    }


    /* ---------------------------------------------------
       App.districts
       --------------------------------------------------- */

    if (
      Array.isArray(
        App.districts
      )
    ) {

      return App.districts;

    }


    /* ---------------------------------------------------
       Nested data support
       --------------------------------------------------- */

    if (
      App.districts &&
      Array.isArray(
        App.districts.data
      )
    ) {

      return App.districts.data;

    }


    return [];

  }


  /* =======================================================
     EXTRACT DISTRICT ARRAY
     ======================================================= */

  function extractDistrictArray(
    value
  ) {

    if (
      Array.isArray(
        value
      )
    ) {

      return value;

    }


    if (
      !value ||
      typeof value !== "object"
    ) {

      return [];

    }


    if (
      Array.isArray(
        value.data
      )
    ) {

      return value.data;

    }


    if (
      value.data &&
      Array.isArray(
        value.data.data
      )
    ) {

      return value.data.data;

    }


    if (
      Array.isArray(
        value.districts
      )
    ) {

      return value.districts;

    }


    if (
      value.data &&
      Array.isArray(
        value.data.districts
      )
    ) {

      return value.data.districts;

    }


    return [];

  }


  /* =======================================================
     NORMALIZE DISTRICT
     ======================================================= */

  function normalizeDistrict(
    district
  ) {

    if (
      typeof district === "string" ||
      typeof district === "number"
    ) {

      var simple =
        String(
          district
        ).trim();


      return {

        id:
          simple,

        districtId:
          simple,

        name:
          simple,

        districtName:
          simple,

        code:
          "",

        districtCode:
          "",

        slug:
          simple
            .toLowerCase()
            .replace(
              /\s+/g,
              "-"
            ),

        state:
          "",

        stateCode:
          "",

        pincode:
          "",

        latitude:
          "",

        longitude:
          "",

        active:
          true,

        sortOrder:
          999999,

        raw:
          district

      };

    }


    district =
      district ||
      {};


    var id =
      getDistrictId(
        district
      );


    var name =
      getDistrictName(
        district
      );


    var code =
      getDistrictCode(
        district
      );


    var slug =
      getDistrictSlug(
        district
      );


    if (
      !slug &&
      name
    ) {

      slug =
        name
          .toLowerCase()
          .replace(
            /[^a-z0-9]+/g,
            "-"
          )
          .replace(
            /^-+|-+$/g,
            ""
          );

    }


    if (
      !id
    ) {

      id =
        code ||
        slug ||
        name;

    }


    if (
      !name
    ) {

      name =
        code ||
        slug ||
        id;

    }


    return {

      id:
        String(
          id || ""
        ).trim(),

      districtId:
        String(
          id || ""
        ).trim(),

      name:
        String(
          name || ""
        ).trim(),

      districtName:
        String(
          name || ""
        ).trim(),

      code:
        String(
          code || ""
        ).trim(),

      districtCode:
        String(
          code || ""
        ).trim(),

      slug:
        String(
          slug || ""
        ).trim(),

      state:
        getDistrictState(
          district
        ),

      stateCode:
        getDistrictStateCode(
          district
        ),

      pincode:
        getDistrictPincode(
          district
        ),

      latitude:
        getLatitude(
          district
        ),

      longitude:
        getLongitude(
          district
        ),

      active:
        isDistrictActive(
          district
        ),

      sortOrder:
        getSortOrder(
          district
        ),

      raw:
        district

    };

  }


  /* =======================================================
     NORMALIZE ALL DISTRICTS
     ======================================================= */

  function normalizeDistricts(
    districts
  ) {

    districts =
      extractDistrictArray(
        districts
      );


    if (
      districts.length === 0
    ) {

      return [];

    }


    var result = [];


    districts.forEach(
      function (
        district
      ) {

        var normalized =
          normalizeDistrict(
            district
          );


        if (
          !normalized.id &&
          !normalized.name
        ) {

          return;

        }


        if (
          !normalized.id
        ) {

          normalized.id =
            normalized.name;

        }


        if (
          !normalized.name
        ) {

          normalized.name =
            normalized.id;

        }


        /*
         * Do not show explicitly inactive districts.
         */

        if (
          normalized.active === false
        ) {

          return;

        }


        result.push(
          normalized
        );

      }
    );


    /* ---------------------------------------------------
       Sort by sortOrder first, then name
       --------------------------------------------------- */

    result.sort(
      function (
        a,
        b
      ) {

        var orderA =
          Number(
            a.sortOrder
          );


        var orderB =
          Number(
            b.sortOrder
          );


        if (
          orderA !== orderB
        ) {

          return (
            orderA -
            orderB
          );

        }


        return String(
          a.name || ""
        ).localeCompare(
          String(
            b.name || ""
          ),
          "en",
          {
            sensitivity:
              "base"
          }
        );

      }
    );


    /* ---------------------------------------------------
       Remove duplicate districts
       --------------------------------------------------- */

    var unique = [];

    var seen = {};


    result.forEach(
      function (
        district
      ) {

        var key =
          String(
            district.id ||
            district.code ||
            district.slug ||
            district.name
          )
            .trim()
            .toLowerCase();


        if (
          !key
        ) {

          return;

        }


        if (
          seen[key]
        ) {

          return;

        }


        seen[key] =
          true;


        unique.push(
          district
        );

      }
    );


    return unique;

  }


  /* =======================================================
     FIND DISTRICT
     ======================================================= */

  function findDistrict(
    value
  ) {

    var districts =
      normalizeDistricts(
        getDistricts()
      );


    var wanted =
      String(
        value === null ||
        value === undefined
          ? ""
          : value
      )
        .trim()
        .toLowerCase();


    if (
      !wanted
    ) {

      return null;

    }


    if (
      wanted ===
      ALL_VALUE.toLowerCase()
    ) {

      return null;

    }


    /* ---------------------------------------------------
       Exact matching
       --------------------------------------------------- */

    for (
      var i = 0;
      i < districts.length;
      i++
    ) {

      var district =
        districts[i];


      var candidates = [

        district.id,

        district.districtId,

        district.code,

        district.districtCode,

        district.slug,

        district.name,

        district.districtName

      ];


      for (
        var j = 0;
        j < candidates.length;
        j++
      ) {

        if (
          candidates[j] ===
          null ||
          candidates[j] ===
          undefined
        ) {

          continue;

        }


        if (
          String(
            candidates[j]
          )
            .trim()
            .toLowerCase() ===
          wanted
        ) {

          return district;

        }

      }

    }


    return null;

  }


  /* =======================================================
     DISPLAY NAME
     ======================================================= */

  function getDisplayName(
    value
  ) {

    if (
      value === null ||
      value === undefined ||
      String(
        value
      ).trim() === ""
    ) {

      return "All Districts";

    }


    if (
      String(
        value
      )
        .trim()
        .toUpperCase() ===
      ALL_VALUE.toUpperCase()
    ) {

      return "All Districts";

    }


    var district =
      findDistrict(
        value
      );


    if (
      district &&
      district.name
    ) {

      return district.name;

    }


    return String(
      value
    ).trim();

  }


  /* =======================================================
     CURRENT DISTRICT
     ======================================================= */

  function getSelectedDistrict() {

    /* ---------------------------------------------------
       App.getDistrict()
       --------------------------------------------------- */

    if (
      typeof App.getDistrict ===
      "function"
    ) {

      try {

        var current =
          App.getDistrict();


        if (
          current !== null &&
          current !== undefined &&
          String(
            current
          ).trim() !== ""
        ) {

          return String(
            current
          ).trim();

        }

      } catch (error) {}

    }


    /* ---------------------------------------------------
       App.getSelectedDistrict()
       --------------------------------------------------- */

    if (
      typeof App.getSelectedDistrict ===
      "function"
    ) {

      try {

        var selected =
          App.getSelectedDistrict();


        if (
          selected !== null &&
          selected !== undefined &&
          String(
            selected
          ).trim() !== ""
        ) {

          return String(
            selected
          ).trim();

        }

      } catch (error) {}

    }


    /* ---------------------------------------------------
       App.state.getDistrict()
       --------------------------------------------------- */

    if (
      App.state &&
      typeof App.state.getDistrict ===
      "function"
    ) {

      try {

        var stateDistrict =
          App.state.getDistrict();


        if (
          stateDistrict !== null &&
          stateDistrict !== undefined &&
          String(
            stateDistrict
          ).trim() !== ""
        ) {

          return String(
            stateDistrict
          ).trim();

        }

      } catch (error) {}

    }


    /* ---------------------------------------------------
       Direct state properties
       --------------------------------------------------- */

    if (
      App.state
    ) {

      var directState =
        App.state.district ||
        App.state.selectedDistrict;


      if (
        directState
      ) {

        return String(
          directState
        ).trim();

      }

    }


    /* ---------------------------------------------------
       Direct App property
       --------------------------------------------------- */

    if (
      App.district &&
      typeof App.district !== "object"
    ) {

      return String(
        App.district
      ).trim();

    }


    return DEFAULT_DISTRICT;

  }


  /* =======================================================
     SET DISTRICT
     ======================================================= */

  function setDistrict(
    value,
    options
  ) {

    options =
      options ||
      {};


    var districtValue =
      String(
        value === null ||
        value === undefined ||
        String(
          value
        ).trim() === ""
          ? ALL_VALUE
          : value
      )
        .trim();


    /* ---------------------------------------------------
       Normalize known district to ID
       --------------------------------------------------- */

    if (
      districtValue.toUpperCase() !==
      ALL_VALUE.toUpperCase()
    ) {

      var found =
        findDistrict(
          districtValue
        );


      if (
        found
      ) {

        districtValue =
          found.id ||
          found.districtId ||
          found.code ||
          found.slug ||
          found.name;

      }

    }


    /* ---------------------------------------------------
       Set through App API
       --------------------------------------------------- */

    if (
      typeof App.setDistrict ===
      "function" &&
      App.setDistrict !==
      setDistrict
    ) {

      try {

        App.setDistrict(
          districtValue
        );

      } catch (error) {

        debugWarn(
          "[UBnux] App.setDistrict() failed.",
          error
        );

        App.district =
          districtValue;

      }

    }

    else if (
      App.state &&
      typeof App.state.setDistrict ===
      "function"
    ) {

      try {

        App.state.setDistrict(
          districtValue
        );

      } catch (error) {

        debugWarn(
          "[UBnux] App.state.setDistrict() failed.",
          error
        );

        App.district =
          districtValue;

      }

    }

    else {

      App.district =
        districtValue;

    }


    /* ---------------------------------------------------
       Direct fallback state values
       --------------------------------------------------- */

    if (
      App.state &&
      typeof App.state !== "function"
    ) {

      try {

        if (
          !App.state.district
        ) {

          App.state.district =
            districtValue;

        }

      } catch (error) {}

    }


    /* ---------------------------------------------------
       Save
       --------------------------------------------------- */

    if (
      options.save !== false
    ) {

      saveDistrict(
        districtValue
      );

    }


    /* ---------------------------------------------------
       Update UI
       --------------------------------------------------- */

    if (
      options.updateUI !== false
    ) {

      syncDistrictUI(
        districtValue
      );

    }


    return districtValue;

  }


  /* =======================================================
     SAVE DISTRICT
     ======================================================= */

  function saveDistrict(
    value
  ) {

    var districtValue =
      String(
        value ||
        ALL_VALUE
      )
        .trim();


    try {

      localStorage.setItem(
        STORAGE_KEY,
        districtValue
      );


      return true;

    } catch (error) {

      return false;

    }

  }


  /* =======================================================
     READ SAVED DISTRICT
     ======================================================= */

  function getSavedDistrict() {

    try {

      var saved =
        localStorage.getItem(
          STORAGE_KEY
        );


      if (
        saved
      ) {

        return String(
          saved
        ).trim();

      }


      for (
        var i = 0;
        i < LEGACY_STORAGE_KEYS.length;
        i++
      ) {

        var legacy =
          localStorage.getItem(
            LEGACY_STORAGE_KEYS[i]
          );


        if (
          legacy
        ) {

          return String(
            legacy
          ).trim();

        }

      }

    } catch (error) {

      return "";

    }


    return "";

  }


  /* =======================================================
     CLEAR SAVED DISTRICT
     ======================================================= */

  function clearSavedDistrict() {

    try {

      localStorage.removeItem(
        STORAGE_KEY
      );


      LEGACY_STORAGE_KEYS.forEach(
        function (
          key
        ) {

          try {

            localStorage.removeItem(
              key
            );

          } catch (error) {}

        }
      );


      return true;

    } catch (error) {

      return false;

    }

  }


  /* =======================================================
     VALIDATE DISTRICT
     ======================================================= */

  function isValidDistrict(
    value
  ) {

    var normalized =
      String(
        value ||
        ""
      )
        .trim();


    if (
      !normalized
    ) {

      return false;

    }


    if (
      normalized.toUpperCase() ===
      ALL_VALUE.toUpperCase()
    ) {

      return true;

    }


    return !!findDistrict(
      normalized
    );

  }


  /* =======================================================
     CREATE DISTRICT OPTION
     ======================================================= */

  function createDistrictOption(
    district
  ) {

    if (
      !district
    ) {

      return null;

    }


    var option =
      document.createElement(
        "option"
      );


    var value =
      district.id ||
      district.districtId ||
      district.code ||
      district.slug ||
      district.name;


    var label =
      district.name ||
      district.districtName ||
      district.code ||
      district.id;


    option.value =
      String(
        value || ""
      ).trim();


    option.textContent =
      String(
        label || ""
      ).trim();


    /* ---------------------------------------------------
       Additional useful data
       --------------------------------------------------- */

    if (
      district.code
    ) {

      option.dataset.districtCode =
        district.code;

    }


    if (
      district.slug
    ) {

      option.dataset.districtSlug =
        district.slug;

    }


    if (
      district.state
    ) {

      option.dataset.state =
        district.state;

    }


    return option;

  }


  /* =======================================================
     POPULATE DISTRICT SELECT
     ======================================================= */

  function populateDistrictSelect(
    select
  ) {

    select =
      select ||
      $("districtFilter");


    if (
      !select
    ) {

      return false;

    }


    var districts =
      normalizeDistricts(
        getDistricts()
      );


    var selected =
      getSelectedDistrict();


    /* ---------------------------------------------------
       Build using DocumentFragment
       --------------------------------------------------- */

    var fragment =
      document.createDocumentFragment();


    /* ---------------------------------------------------
       All Districts
       --------------------------------------------------- */

    var allOption =
      document.createElement(
        "option"
      );


    allOption.value =
      ALL_VALUE;


    allOption.textContent =
      "All Districts";


    fragment.appendChild(
      allOption
    );


    /* ---------------------------------------------------
       Districts
       --------------------------------------------------- */

    districts.forEach(
      function (
        district
      ) {

        var option =
          createDistrictOption(
            district
          );


        if (
          option &&
          option.value
        ) {

          fragment.appendChild(
            option
          );

        }

      }
    );


    /* ---------------------------------------------------
       Replace options
       --------------------------------------------------- */

    select.innerHTML =
      "";


    select.appendChild(
      fragment
    );


    /* ---------------------------------------------------
       Sync selected value
       --------------------------------------------------- */

    syncDistrictSelect(
      selected,
      select
    );


    debug(
      "[UBnux] District dropdown populated:",
      districts.length
    );


    return true;

  }


  /* =======================================================
     SYNC DISTRICT SELECT
     ======================================================= */

  function syncDistrictSelect(
    value,
    select
  ) {

    select =
      select ||
      $("districtFilter");


    if (
      !select
    ) {

      return false;

    }


    var wanted =
      String(
        value ||
        ALL_VALUE
      )
        .trim()
        .toLowerCase();


    var found =
      false;


    /* ---------------------------------------------------
       Direct option value
       --------------------------------------------------- */

    Array.prototype.forEach.call(
      select.options,
      function (
        option
      ) {

        var optionValue =
          String(
            option.value ||
            ""
          )
            .trim()
            .toLowerCase();


        var optionText =
          String(
            option.textContent ||
            ""
          )
            .trim()
            .toLowerCase();


        var optionCode =
          String(
            option.dataset.districtCode ||
            ""
          )
            .trim()
            .toLowerCase();


        var optionSlug =
          String(
            option.dataset.districtSlug ||
            ""
          )
            .trim()
            .toLowerCase();


        if (
          optionValue === wanted ||
          optionText === wanted ||
          optionCode === wanted ||
          optionSlug === wanted
        ) {

          select.value =
            option.value;

          found =
            true;

        }

      }
    );


    /* ---------------------------------------------------
       If not found, try district lookup
       --------------------------------------------------- */

    if (
      !found &&
      wanted !==
      ALL_VALUE.toLowerCase()
    ) {

      var district =
        findDistrict(
          wanted
        );


      if (
        district
      ) {

        var districtValue =
          String(
            district.id ||
            district.districtId ||
            district.code ||
            district.slug ||
            district.name
          )
            .trim()
            .toLowerCase();


        Array.prototype.forEach.call(
          select.options,
          function (
            option
          ) {

            if (
              String(
                option.value
              )
                .trim()
                .toLowerCase() ===
              districtValue
            ) {

              select.value =
                option.value;

              found =
                true;

            }

          }
        );

      }

    }


    /* ---------------------------------------------------
       Fallback
       --------------------------------------------------- */

    if (
      !found
    ) {

      var allFound =
        Array.prototype.some.call(
          select.options,
          function (
            option
          ) {

            return (
              String(
                option.value
              )
                .trim()
                .toLowerCase() ===
              ALL_VALUE.toLowerCase()
            );

          }
        );


      if (
        allFound
      ) {

        select.value =
          ALL_VALUE;

      }

    }


    return found;

  }


  /* =======================================================
     HEADER DISTRICT DISPLAY
     ======================================================= */

  function updateHeaderDistrict(
    value
  ) {

    var display =
      getDisplayName(
        value
      );


    var currentDistrict =
      $("currentDistrict");


    if (
      currentDistrict
    ) {

      currentDistrict.textContent =
        display;

    }


    var button =
      $("districtButton");


    if (
      button
    ) {

      button.setAttribute(
        "aria-label",
        "Selected district: " +
        display
      );

    }


    var mobileButton =
      $("mobileDistrictButton");


    if (
      mobileButton
    ) {

      mobileButton.setAttribute(
        "aria-label",
        "Selected district: " +
        display
      );

    }


    updateDistrictButtons(
      value
    );

  }


  /* =======================================================
     DISTRICT MODAL
     ======================================================= */

  function openDistrictModal() {

    var modal =
      $("districtModal");


    if (
      !modal
    ) {

      return false;

    }


    populateDistrictModal();


    modal.hidden =
      false;


    modal.classList.add(
      "active"
    );


    modal.classList.add(
      "show"
    );


    modal.setAttribute(
      "aria-hidden",
      "false"
    );


    document.body.classList.add(
      "modal-open"
    );


    var select =
      $("districtModalSelect");


    if (
      select
    ) {

      syncDistrictSelect(
        getSelectedDistrict(),
        select
      );


      setTimeout(
        function () {

          try {

            select.focus();

          } catch (error) {}

        },
        50
      );

    }


    return true;

  }


  function closeDistrictModal() {

    var modal =
      $("districtModal");


    if (
      !modal
    ) {

      return false;

    }


    modal.classList.remove(
      "active"
    );


    modal.classList.remove(
      "show"
    );


    modal.setAttribute(
      "aria-hidden",
      "true"
    );


    modal.hidden =
      true;


    document.body.classList.remove(
      "modal-open"
    );


    return true;

  }


  /* =======================================================
     POPULATE MODAL SELECT
     ======================================================= */

  function populateDistrictModal() {

    var select =
      $("districtModalSelect");


    if (
      !select
    ) {

      return false;

    }


    populateDistrictSelect(
      select
    );


    return true;

  }


  /* =======================================================
     SAVE MODAL DISTRICT
     ======================================================= */

  function saveModalDistrict() {

    var select =
      $("districtModalSelect");


    if (
      !select
    ) {

      return false;

    }


    var value =
      String(
        select.value ||
        ALL_VALUE
      )
        .trim();


    setDistrict(
      value,
      {

        save:
          true,

        updateUI:
          true

      }
    );


    applyDistrictFilter();


    closeDistrictModal();


    showLocationMessage(
      "District saved successfully.",
      "success"
    );


    return true;

  }


  /* =======================================================
     SELECT DISTRICT
     ======================================================= */

  function selectDistrict(
    value,
    options
  ) {

    options =
      options ||
      {};


    var districtValue =
      String(
        value === null ||
        value === undefined ||
        String(
          value
        ).trim() === ""
          ? ALL_VALUE
          : value
      )
        .trim();


    /* ---------------------------------------------------
       Resolve ID/code/slug/name to canonical ID
       --------------------------------------------------- */

    if (
      districtValue.toUpperCase() !==
      ALL_VALUE.toUpperCase()
    ) {

      var district =
        findDistrict(
          districtValue
        );


      if (
        district
      ) {

        districtValue =
          district.id ||
          district.districtId ||
          district.code ||
          district.slug ||
          district.name;

      }

    }


    setDistrict(
      districtValue,
      {

        save:
          options.save !== false,

        updateUI:
          true

      }
    );


    syncDistrictSelect(
      districtValue
    );


    var modalSelect =
      $("districtModalSelect");


    if (
      modalSelect
    ) {

      syncDistrictSelect(
        districtValue,
        modalSelect
      );

    }


    if (
      options.applyFilter !== false
    ) {

      applyDistrictFilter();

    }


    return true;

  }


  /* =======================================================
     APPLY DISTRICT FILTER
     ======================================================= */

  function applyDistrictFilter() {

    var applied =
      false;


    /* ---------------------------------------------------
       Preferred filters module
       --------------------------------------------------- */

    if (
      App.filters &&
      typeof App.filters.applyFilters ===
      "function"
    ) {

      try {

        App.filters.applyFilters();

        applied =
          true;

      } catch (error) {

        debugWarn(
          "[UBnux] filters.applyFilters() failed.",
          error
        );

      }

    }


    /* ---------------------------------------------------
       Top-level fallback
       --------------------------------------------------- */

    else if (
      typeof App.applyFilters ===
      "function" &&
      App.applyFilters !==
      applyDistrictFilter
    ) {

      try {

        App.applyFilters();

        applied =
          true;

      } catch (error) {

        debugWarn(
          "[UBnux] App.applyFilters() failed.",
          error
        );

      }

    }


    /* ---------------------------------------------------
       Reset pagination
       --------------------------------------------------- */

    if (
      typeof App.resetPagination ===
      "function"
    ) {

      try {

        App.resetPagination();

      } catch (error) {}

    }

    else if (
      App.businesses &&
      typeof App.businesses.resetPagination ===
      "function"
    ) {

      try {

        App.businesses.resetPagination();

      } catch (error) {}

    }


    /* ---------------------------------------------------
       Render business page
       --------------------------------------------------- */

    if (
      App.businesses &&
      typeof App.businesses.renderCurrentPage ===
      "function"
    ) {

      try {

        App.businesses.renderCurrentPage();

      } catch (error) {

        debugWarn(
          "[UBnux] Business render failed.",
          error
        );

      }

    }

    else if (
      typeof App.renderCurrentPage ===
      "function"
    ) {

      try {

        App.renderCurrentPage();

      } catch (error) {}

    }


    return applied;

  }


  /* =======================================================
     FILTER BY DISTRICT
     ======================================================= */

  function filterByDistrict(
    value
  ) {

    return selectDistrict(
      value
    );

  }


  /* =======================================================
     RESET DISTRICT
     ======================================================= */

  function resetDistrict() {

    return selectDistrict(
      ALL_VALUE
    );

  }


  /* =======================================================
     LOCATION MESSAGE
     ======================================================= */

  function showLocationMessage(
    message,
    type
  ) {

    var element =
      $("locationMessage");


    if (
      !element
    ) {

      return;

    }


    element.textContent =
      message ||
      "";


    element.hidden =
      !message;


    element.classList.remove(
      "success",
      "error",
      "warning",
      "info"
    );


    if (
      type
    ) {

      element.classList.add(
        type
      );

    }

  }


  /* =======================================================
     GEOLOCATION SUPPORT
     ======================================================= */

  function detectBrowserLocation() {

    if (
      !navigator.geolocation
    ) {

      showLocationMessage(
        "Location detection is not supported by this browser.",
        "error"
      );


      return Promise.resolve(
        null
      );

    }


    showLocationMessage(
      "Detecting your location…",
      "info"
    );


    return new Promise(
      function (
        resolve
      ) {

        navigator.geolocation.getCurrentPosition(

          function (
            position
          ) {

            if (
              !position ||
              !position.coords
            ) {

              resolve(
                null
              );

              return;

            }


            resolve({

              latitude:
                position.coords.latitude,

              longitude:
                position.coords.longitude

            });

          },

          function (
            error
          ) {

            var message =
              "Unable to detect your location.";


            if (
              error &&
              error.code === 1
            ) {

              message =
                "Location permission was denied.";

            }

            else if (
              error &&
              error.code === 2
            ) {

              message =
                "Your location could not be determined.";

            }

            else if (
              error &&
              error.code === 3
            ) {

              message =
                "Location detection timed out.";

            }


            showLocationMessage(
              message,
              "error"
            );


            resolve(
              null
            );

          },

          {

            enableHighAccuracy:
              false,

            timeout:
              10000,

            maximumAge:
              300000

          }

        );

      }
    );

  }


  /* =======================================================
     DISTANCE CALCULATION
     ======================================================= */

  function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
  ) {

    var latitude1 =
      Number(
        lat1
      );


    var longitude1 =
      Number(
        lon1
      );


    var latitude2 =
      Number(
        lat2
      );


    var longitude2 =
      Number(
        lon2
      );


    if (
      !Number.isFinite(
        latitude1
      ) ||
      !Number.isFinite(
        longitude1
      ) ||
      !Number.isFinite(
        latitude2
      ) ||
      !Number.isFinite(
        longitude2
      )
    ) {

      return null;

    }


    var earthRadius =
      6371;


    var dLat =
      (
        latitude2 -
        latitude1
      ) *
      Math.PI /
      180;


    var dLon =
      (
        longitude2 -
        longitude1
      ) *
      Math.PI /
      180;


    var a =
      Math.sin(
        dLat / 2
      ) *
      Math.sin(
        dLat / 2
      ) +

      Math.cos(
        latitude1 *
        Math.PI /
        180
      ) *

      Math.cos(
        latitude2 *
        Math.PI /
        180
      ) *

      Math.sin(
        dLon / 2
      ) *
      Math.sin(
        dLon / 2
      );


    var c =
      2 *
      Math.atan2(
        Math.sqrt(
          a
        ),
        Math.sqrt(
          1 - a
        )
      );


    return (
      earthRadius *
      c
    );

  }


  /* =======================================================
     FIND NEAREST DISTRICT
     ======================================================= */

  function findNearestDistrict(
    latitude,
    longitude
  ) {

    var districts =
      normalizeDistricts(
        getDistricts()
      );


    if (
      districts.length === 0
    ) {

      return null;

    }


    var nearest =
      null;


    var nearestDistance =
      Infinity;


    districts.forEach(
      function (
        district
      ) {

        var distance =
          calculateDistance(
            latitude,
            longitude,
            district.latitude,
            district.longitude
          );


        if (
          distance === null
        ) {

          return;

        }


        if (
          distance <
          nearestDistance
        ) {

          nearestDistance =
            distance;


          nearest = {

            district:
              district,

            distance:
              distance

          };

        }

      }
    );


    return nearest;

  }


  /* =======================================================
     BACKEND LOCATION DETECTION
     ======================================================= */

  async function detectDistrictFromBackend(
    latitude,
    longitude
  ) {

    try {

      if (
        App.api &&
        typeof App.api.detectDistrict ===
        "function"
      ) {

        var result =
          await App.api.detectDistrict(
            latitude,
            longitude
          );


        if (
          result &&
          result.success !== false
        ) {

          return normalizeBackendDistrictResult(
            result
          );

        }

      }


      if (
        typeof App.detectDistrict ===
        "function" &&
        App.detectDistrict !==
        detectDistrictFromBackend
      ) {

        var detected =
          await App.detectDistrict(
            latitude,
            longitude
          );


        if (
          detected
        ) {

          return normalizeBackendDistrictResult(
            detected
          );

        }

      }

    } catch (error) {

      debugWarn(
        "[UBnux] Backend district detection failed.",
        error
      );

    }


    return null;

  }


  /* =======================================================
     NORMALIZE BACKEND DISTRICT RESULT
     ======================================================= */

  function normalizeBackendDistrictResult(
    result
  ) {

    if (
      !result
    ) {

      return null;

    }


    /*
     * Handle:
     * { success:true, data:{...} }
     */

    if (
      result.data &&
      !Array.isArray(
        result.data
      )
    ) {

      result =
        result.data;

    }


    /*
     * Handle:
     * { success:true, data:[...] }
     */

    if (
      Array.isArray(
        result.data
      )
    ) {

      result =
        result.data[0] ||
        null;

    }


    if (
      !result
    ) {

      return null;

    }


    /* ---------------------------------------------------
       Direct district object
       --------------------------------------------------- */

    if (
      typeof result === "object"
    ) {

      var directDistrict =
        normalizeDistrict(
          result
        );


      if (
        directDistrict.id ||
        directDistrict.name
      ) {

        var directFound =
          findDistrict(
            directDistrict.id
          ) ||
          findDistrict(
            directDistrict.name
          ) ||
          findDistrict(
            directDistrict.code
          ) ||
          findDistrict(
            directDistrict.slug
          );


        if (
          directFound
        ) {

          return directFound;

        }


        return directDistrict;

      }

    }


    return null;

  }


  /* =======================================================
     DETECT DISTRICT
     ======================================================= */

  async function detectDistrict() {

    var coordinates =
      await detectBrowserLocation();


    if (
      !coordinates
    ) {

      return null;

    }


    var detected =
      await detectDistrictFromBackend(
        coordinates.latitude,
        coordinates.longitude
      );


    if (
      detected
    ) {

      selectDistrict(
        detected.id ||
        detected.districtId ||
        detected.code ||
        detected.slug ||
        detected.name
      );


      showLocationMessage(
        "Detected district: " +
        detected.name,
        "success"
      );


      return detected;

    }


    var nearest =
      findNearestDistrict(
        coordinates.latitude,
        coordinates.longitude
      );


    if (
      nearest &&
      nearest.district
    ) {

      var district =
        nearest.district;


      selectDistrict(
        district.id ||
        district.districtId ||
        district.code ||
        district.slug ||
        district.name
      );


      showLocationMessage(
        "Detected district: " +
        district.name,
        "success"
      );


      return district;

    }


    showLocationMessage(
      "We could not match your location with a district.",
      "warning"
    );


    return null;

  }


  /* =======================================================
     SETUP HEADER BUTTON
     ======================================================= */

  function setupDistrictButton() {

    var buttons = [

      $("districtButton"),

      $("mobileDistrictButton")

    ];


    buttons.forEach(
      function (
        button
      ) {

        if (
          !button
        ) {

          return;

        }


        if (
          button.dataset.ubnuxBound ===
          "true"
        ) {

          return;

        }


        button.dataset.ubnuxBound =
          "true";


        button.addEventListener(
          "click",
          function (
            event
          ) {

            event.preventDefault();


            openDistrictModal();

          }
        );

      }
    );

  }


  /* =======================================================
     SETUP MODAL
     ======================================================= */

  function setupDistrictModal() {

    var closeButton =
      $("closeDistrictModal");


    if (
      closeButton &&
      closeButton.dataset.ubnuxBound !==
      "true"
    ) {

      closeButton.dataset.ubnuxBound =
        "true";


      closeButton.addEventListener(
        "click",
        function (
          event
        ) {

          event.preventDefault();


          closeDistrictModal();

        }
      );

    }


    var detectButton =
      $("detectLocationButton");


    if (
      detectButton &&
      detectButton.dataset.ubnuxBound !==
      "true"
    ) {

      detectButton.dataset.ubnuxBound =
        "true";


      detectButton.addEventListener(
        "click",
        async function (
          event
        ) {

          event.preventDefault();


          detectButton.disabled =
            true;


          var originalHTML =
            detectButton.innerHTML;


          detectButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>' +
            "<span>Detecting…</span>";


          try {

            await detectDistrict();

          }

          finally {

            detectButton.disabled =
              false;


            detectButton.innerHTML =
              originalHTML;

          }

        }
      );

    }


    var saveButton =
      $("saveDistrictButton");


    if (
      saveButton &&
      saveButton.dataset.ubnuxBound !==
      "true"
    ) {

      saveButton.dataset.ubnuxBound =
        "true";


      saveButton.addEventListener(
        "click",
        function (
          event
        ) {

          event.preventDefault();


          saveModalDistrict();

        }
      );

    }


    var modal =
      $("districtModal");


    if (
      modal &&
      modal.dataset.ubnuxBackdropBound !==
      "true"
    ) {

      modal.dataset.ubnuxBackdropBound =
        "true";


      modal.addEventListener(
        "click",
        function (
          event
        ) {

          if (
            event.target ===
            modal
          ) {

            closeDistrictModal();

          }

        }
      );

    }


    var modalSelect =
      $("districtModalSelect");


    if (
      modalSelect &&
      modalSelect.dataset.ubnuxBound !==
      "true"
    ) {

      modalSelect.dataset.ubnuxBound =
        "true";


      modalSelect.addEventListener(
        "change",
        function () {

          showLocationMessage(
            "",
            ""
          );

        }
      );

    }

  }


  /* =======================================================
     SETUP DISTRICT FILTER
     ======================================================= */

  function setupDistrictFilter() {

    var select =
      $("districtFilter");


    if (
      !select
    ) {

      return;

    }


    if (
      select.dataset.ubnuxBound ===
      "true"
    ) {

      return;

    }


    select.dataset.ubnuxBound =
      "true";


    select.addEventListener(
      "change",
      function () {

        selectDistrict(
          select.value ||
          ALL_VALUE
        );

      }
    );

  }


  /* =======================================================
     ESCAPE KEY
     ======================================================= */

  function setupEscapeKey() {

    if (
      document.body.dataset.ubnuxDistrictEscapeBound ===
      "true"
    ) {

      return;

    }


    document.body.dataset.ubnuxDistrictEscapeBound =
      "true";


    document.addEventListener(
      "keydown",
      function (
        event
      ) {

        if (
          event.key !==
          "Escape"
        ) {

          return;

        }


        var modal =
          $("districtModal");


        if (
          modal &&
          (
            modal.classList.contains(
              "active"
            ) ||
            modal.classList.contains(
              "show"
            )
          )
        ) {

          closeDistrictModal();

        }

      }
    );

  }


  /* =======================================================
     UPDATE DISTRICT BUTTONS
     ======================================================= */

  function updateDistrictButtons(
    value
  ) {

    var display =
      getDisplayName(
        value
      );


    var buttons =
      qsa(
        "[data-selected-district]"
      );


    buttons.forEach(
      function (
        button
      ) {

        button.textContent =
          display;

      }
    );

  }


  /* =======================================================
     SYNC ALL DISTRICT UI
     ======================================================= */

  function syncDistrictUI(
    value
  ) {

    updateHeaderDistrict(
      value
    );


    syncDistrictSelect(
      value
    );


    var modalSelect =
      $("districtModalSelect");


    if (
      modalSelect
    ) {

      syncDistrictSelect(
        value,
        modalSelect
      );

    }


    updateDistrictButtons(
      value
    );

  }


  /* =======================================================
     INITIAL DISTRICT
     ======================================================= */

  function initializeSelectedDistrict() {

    var current =
      getSelectedDistrict();


    var saved =
      getSavedDistrict();


    var selected =
      current;


    /* ---------------------------------------------------
       Saved district has priority when current is ALL
       --------------------------------------------------- */

    if (
      (
        !current ||
        String(
          current
        )
          .trim()
          .toUpperCase() ===
        ALL_VALUE.toUpperCase()
      ) &&
      saved &&
      isValidDistrict(
        saved
      )
    ) {

      selected =
        saved;

    }


    if (
      !selected
    ) {

      selected =
        DEFAULT_DISTRICT;

    }


    /* ---------------------------------------------------
       Validate only if districts are already loaded.
       This is important because API data may arrive later.
       --------------------------------------------------- */

    var availableDistricts =
      normalizeDistricts(
        getDistricts()
      );


    if (
      availableDistricts.length > 0 &&
      !isValidDistrict(
        selected
      )
    ) {

      selected =
        ALL_VALUE;

    }


    setDistrict(
      selected,
      {

        save:
          false,

        updateUI:
          true

      }
    );


    return selected;

  }


  /* =======================================================
     REFRESH
     ======================================================= */

  function refresh() {

    var districts =
      normalizeDistricts(
        getDistricts()
      );


    populateDistrictSelect();


    populateDistrictModal();


    syncDistrictUI(
      getSelectedDistrict()
    );


    debug(
      "[UBnux] District manager refreshed:",
      districts.length,
      "districts"
    );


    return true;

  }


  /* =======================================================
     DELAYED REFRESH
     -------------------------------------------------------
     API/state data can arrive after district.js init.
     Run a few lightweight refresh attempts so dropdown
     receives the API data without requiring page reload.
     ======================================================= */

  function scheduleDataRefresh() {

    var delays = [

      250,

      750,

      1500,

      3000,

      5000

    ];


    delays.forEach(
      function (
        delay
      ) {

        setTimeout(
          function () {

            var districts =
              normalizeDistricts(
                getDistricts()
              );


            if (
              districts.length > 0
            ) {

              refresh();

            }

          },
          delay
        );

      }
    );

  }


  /* =======================================================
     LISTEN FOR CUSTOM DATA EVENTS
     ======================================================= */

  function setupDataEvents() {

    if (
      document.body.dataset.ubnuxDistrictDataEventsBound ===
      "true"
    ) {

      return;

    }


    document.body.dataset.ubnuxDistrictDataEventsBound =
      "true";


    var events = [

      "ubnux:data-loaded",

      "ubnux:initial-data-loaded",

      "ubnux:districts-loaded",

      "zilabiz:data-loaded",

      "zilabiz:districts-loaded"

    ];


    events.forEach(
      function (
        eventName
      ) {

        document.addEventListener(
          eventName,
          function () {

            refresh();

          }
        );

      }
    );

  }


  /* =======================================================
     INITIALIZE
     ======================================================= */

  function init() {

    setupDistrictButton();

    setupDistrictModal();

    setupDistrictFilter();

    setupEscapeKey();

    setupDataEvents();


    initializeSelectedDistrict();


    refresh();


    /*
     * Important:
     * API data may not exist yet when this file loads.
     */

    scheduleDataRefresh();


    return true;

  }


  /* =======================================================
     PUBLIC API
     ======================================================= */

  App.district = {

    getDistricts:
      getDistricts,

    getDistrictId:
      getDistrictId,

    getDistrictName:
      getDistrictName,

    getDistrictCode:
      getDistrictCode,

    getDistrictSlug:
      getDistrictSlug,

    getDistrictState:
      getDistrictState,

    getDistrictStateCode:
      getDistrictStateCode,

    getDistrictPincode:
      getDistrictPincode,

    getLatitude:
      getLatitude,

    getLongitude:
      getLongitude,

    normalizeDistrict:
      normalizeDistrict,

    normalizeDistricts:
      normalizeDistricts,

    findDistrict:
      findDistrict,

    getDisplayName:
      getDisplayName,

    getSelectedDistrict:
      getSelectedDistrict,

    setDistrict:
      setDistrict,

    saveDistrict:
      saveDistrict,

    getSavedDistrict:
      getSavedDistrict,

    clearSavedDistrict:
      clearSavedDistrict,

    isValidDistrict:
      isValidDistrict,

    populateDistrictSelect:
      populateDistrictSelect,

    populateDistrictModal:
      populateDistrictModal,

    syncDistrictSelect:
      syncDistrictSelect,

    updateHeaderDistrict:
      updateHeaderDistrict,

    syncDistrictUI:
      syncDistrictUI,

    openDistrictModal:
      openDistrictModal,

    closeDistrictModal:
      closeDistrictModal,

    saveModalDistrict:
      saveModalDistrict,

    selectDistrict:
      selectDistrict,

    filterByDistrict:
      filterByDistrict,

    resetDistrict:
      resetDistrict,

    applyDistrictFilter:
      applyDistrictFilter,

    showLocationMessage:
      showLocationMessage,

    detectBrowserLocation:
      detectBrowserLocation,

    detectDistrictFromBackend:
      detectDistrictFromBackend,

    findNearestDistrict:
      findNearestDistrict,

    detectDistrict:
      detectDistrict,

    refresh:
      refresh,

    init:
      init

  };


  /* =======================================================
     TOP-LEVEL COMPATIBILITY
     ======================================================= */

  if (
    typeof App.renderDistricts !==
    "function"
  ) {

    App.renderDistricts =
      populateDistrictSelect;

  }


  if (
    typeof App.refreshDistricts !==
    "function"
  ) {

    App.refreshDistricts =
      refresh;

  }


  if (
    typeof App.selectDistrict !==
    "function"
  ) {

    App.selectDistrict =
      selectDistrict;

  }


  if (
    typeof App.filterByDistrict !==
    "function"
  ) {

    App.filterByDistrict =
      filterByDistrict;

  }


  if (
    typeof App.openDistrictModal !==
    "function"
  ) {

    App.openDistrictModal =
      openDistrictModal;

  }


  if (
    typeof App.closeDistrictModal !==
    "function"
  ) {

    App.closeDistrictModal =
      closeDistrictModal;

  }


  if (
    typeof App.detectDistrict !==
    "function"
  ) {

    App.detectDistrict =
      detectDistrict;

  }


  if (
    typeof App.getDistrictDisplayName !==
    "function"
  ) {

    App.getDistrictDisplayName =
      getDisplayName;

  }


  /* =======================================================
     INITIALIZE
     ======================================================= */

  init();


  /* =======================================================
     READY FLAG
     ======================================================= */

  App.districtReady =
    true;


  window.ZilaBiz =
    App;

  window.UBnux =
    App;


})(window, document);
