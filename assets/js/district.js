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
    {};


  var ALL_VALUE =
    String(
      CONFIG.ALL_VALUE ||
      "ALL"
    );


  var DEFAULT_DISTRICT =
    String(
      CONFIG.DEFAULT_DISTRICT ||
      ALL_VALUE
    );


  var STORAGE_KEY =
    String(
      CONFIG.DISTRICT_STORAGE_KEY ||
      "ubnux_selected_district"
    );


  var LEGACY_STORAGE_KEYS = [

    "ubnux_selected_district",

    "UBnux_selected_district",

    "zilabiz_selected_district",

    "zila_selected_district",

    "selectedDistrict"

  ];


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
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

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

      fields = [fields];

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


      if (
        Object.prototype.hasOwnProperty.call(
          object,
          requested
        )
      ) {

        var direct =
          object[requested];


        if (
          direct !== null &&
          direct !== undefined &&
          String(direct).trim() !== ""
        ) {

          return direct;

        }

      }


      var lower =
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
          lower
        ) {

          var value =
            object[
              keys[j]
            ];


          if (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
          ) {

            return value;

          }


          break;

        }

      }

    }


    return "";

  }


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
      String(value).trim() === ""
    ) {

      return fallback || "";

    }


    return String(
      value
    ).trim();

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
        "DistrictID",
        "DistrictId",
        "districtId",
        "districtID",
        "ID",
        "Id",
        "id",
        "Code",
        "code",
        "Value",
        "value"
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
        "DistrictName",
        "District Name",
        "districtName",
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
     DISTRICT STATE
     ======================================================= */

  function getDistrictState(
    district
  ) {

    return text(
      district,
      [
        "State",
        "state",
        "StateName",
        "stateName"
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
        "Pincode",
        "pincode",
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
        "Latitude",
        "latitude",
        "Lat",
        "lat"
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
        "Longitude",
        "longitude",
        "Lng",
        "lng",
        "Long",
        "long"
      ],
      ""
    );

  }


  /* =======================================================
     GET DISTRICTS FROM STATE
     ======================================================= */

  function getDistricts() {

    if (
      typeof App.getDistricts ===
      "function"
    ) {

      var districts =
        App.getDistricts();


      if (
        Array.isArray(
          districts
        )
      ) {

        return districts;

      }

    }


    if (
      App.state &&
      typeof App.state.getDistricts ===
      "function"
    ) {

      var stateDistricts =
        App.state.getDistricts();


      if (
        Array.isArray(
          stateDistricts
        )
      ) {

        return stateDistricts;

      }

    }


    if (
      Array.isArray(
        App.districts
      )
    ) {

      return App.districts;

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

        name:
          simple,

        state:
          "",

        pincode:
          "",

        latitude:
          "",

        longitude:
          "",

        raw:
          district

      };

    }


    district =
      district || {};


    return {

      id:
        getDistrictId(
          district
        ),

      name:
        getDistrictName(
          district
        ),

      state:
        getDistrictState(
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

    if (
      !Array.isArray(
        districts
      )
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


        result.push(
          normalized
        );

      }
    );


    return result;

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
        value || ""
      )
        .trim()
        .toLowerCase();


    if (
      !wanted
    ) {

      return null;

    }


    for (
      var i = 0;
      i < districts.length;
      i++
    ) {

      var district =
        districts[i];


      if (
        String(
          district.id
        ).toLowerCase() ===
        wanted
      ) {

        return district;

      }


      if (
        String(
          district.name
        ).toLowerCase() ===
        wanted
      ) {

        return district;

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
      !value ||
      String(value)
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
      district
    ) {

      return district.name;

    }


    return String(
      value
    );

  }


  /* =======================================================
     CURRENT DISTRICT
     ======================================================= */

  function getSelectedDistrict() {

    if (
      typeof App.getDistrict ===
      "function"
    ) {

      return (
        App.getDistrict() ||
        DEFAULT_DISTRICT
      );

    }


    if (
      typeof App.getSelectedDistrict ===
      "function"
    ) {

      return (
        App.getSelectedDistrict() ||
        DEFAULT_DISTRICT
      );

    }


    if (
      App.state &&
      typeof App.state.getDistrict ===
      "function"
    ) {

      return (
        App.state.getDistrict() ||
        DEFAULT_DISTRICT
      );

    }


    return (
      App.district ||
      DEFAULT_DISTRICT
    );

  }


  /* =======================================================
     SET DISTRICT
     ======================================================= */

  function setDistrict(
    value,
    options
  ) {

    options =
      options || {};


    var districtValue =
      String(
        value || ALL_VALUE
      ).trim();


    if (
      typeof App.setDistrict ===
      "function"
    ) {

      App.setDistrict(
        districtValue
      );

    } else if (
      App.state &&
      typeof App.state.setDistrict ===
      "function"
    ) {

      App.state.setDistrict(
        districtValue
      );

    } else {

      App.district =
        districtValue;

    }


    if (
      options.save !== false
    ) {

      saveDistrict(
        districtValue
      );

    }


    if (
      options.updateUI !== false
    ) {

      syncDistrictUI(
        districtValue
      );

    }


    return true;

  }


  /* =======================================================
     SAVE DISTRICT
     ======================================================= */

  function saveDistrict(
    value
  ) {

    var districtValue =
      String(
        value || ALL_VALUE
      ).trim();


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

        return saved;

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

          return legacy;

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

          localStorage.removeItem(
            key
          );

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
        value || ""
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


    var fragment =
      document.createDocumentFragment();


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


    districts.forEach(
      function (
        district
      ) {

        var option =
          document.createElement(
            "option"
          );


        option.value =
          district.id ||
          district.name;


        option.textContent =
          district.name ||
          district.id;


        fragment.appendChild(
          option
        );

      }
    );


    select.innerHTML =
      "";


    select.appendChild(
      fragment
    );


    syncDistrictSelect(
      selected,
      select
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

      return;

    }


    var wanted =
      String(
        value || ALL_VALUE
      ).toLowerCase();


    var found =
      false;


    Array.prototype.forEach.call(
      select.options,
      function (
        option
      ) {

        var optionValue =
          String(
            option.value
          ).toLowerCase();


        var optionText =
          String(
            option.textContent
          ).toLowerCase();


        if (
          optionValue ===
          wanted ||
          optionText ===
          wanted
        ) {

          select.value =
            option.value;

          found =
            true;

        }

      }
    );


    if (
      !found
    ) {

      select.value =
        ALL_VALUE;

    }

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
      ).trim();


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
      options || {};


    var districtValue =
      String(
        value || ALL_VALUE
      ).trim();


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

    if (
      App.filters &&
      typeof App.filters.applyFilters ===
      "function"
    ) {

      App.filters.applyFilters();

    } else if (
      typeof App.applyFilters ===
      "function"
    ) {

      App.applyFilters();

    }


    if (
      typeof App.resetPagination ===
      "function"
    ) {

      App.resetPagination();

    }


    if (
      App.businesses &&
      typeof App.businesses.renderCurrentPage ===
      "function"
    ) {

      App.businesses.renderCurrentPage();

    } else if (
      typeof App.renderCurrentPage ===
      "function"
    ) {

      App.renderCurrentPage();

    }


    return true;

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
      message || "";


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

            var latitude =
              position.coords.latitude;


            var longitude =
              position.coords.longitude;


            resolve({

              latitude:
                latitude,

              longitude:
                longitude

            });

          },

          function (
            error
          ) {

            var message =
              "Unable to detect your location.";


            if (
              error &&
              error.code ===
              1
            ) {

              message =
                "Location permission was denied.";

            } else if (
              error &&
              error.code ===
              2
            ) {

              message =
                "Your location could not be determined.";

            } else if (
              error &&
              error.code ===
              3
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
      Number(lat1);


    var longitude1 =
      Number(lon1);


    var latitude2 =
      Number(lat2);


    var longitude2 =
      Number(lon2);


    if (
      !Number.isFinite(latitude1) ||
      !Number.isFinite(longitude1) ||
      !Number.isFinite(latitude2) ||
      !Number.isFinite(longitude2)
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
        Math.sqrt(a),
        Math.sqrt(1 - a)
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


          nearest =
            {

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

      if (
        CONFIG.DEBUG &&
        window.console &&
        console.warn
      ) {

        console.warn(
          "[UBnux] Backend district detection failed.",
          error
        );

      }

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


    if (
      result.data
    ) {

      result =
        result.data;

    }


    var districtValue =
      getField(
        result,
        [
          "district",
          "District",
          "districtId",
          "DistrictID",
          "DistrictId"
        ]
      );


    var districtName =
      getField(
        result,
        [
          "districtName",
          "DistrictName",
          "District Name",
          "name",
          "Name"
        ]
      );


    if (
      districtValue &&
      typeof districtValue ===
      "object"
    ) {

      var normalized =
        normalizeDistrict(
          districtValue
        );


      if (
        normalized.id ||
        normalized.name
      ) {

        return normalized;

      }

    }


    if (
      districtValue
    ) {

      var found =
        findDistrict(
          districtValue
        );


      if (
        found
      ) {

        return found;

      }

    }


    if (
      districtName
    ) {

      var foundByName =
        findDistrict(
          districtName
        );


      if (
        foundByName
      ) {

        return foundByName;

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

    var button =
      $("districtButton");


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

          } finally {

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
          event.key ===
          "Escape"
        ) {

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
     DISTRICT BUTTON STATE
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
     INITIAL DISTRICT
     ======================================================= */

  function initializeSelectedDistrict() {

    var current =
      getSelectedDistrict();


    var saved =
      getSavedDistrict();


    var selected =
      current;


    if (
      (
        !current ||
        current ===
        ALL_VALUE
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


    if (
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

    populateDistrictSelect();

    populateDistrictModal();

    syncDistrictUI(
      getSelectedDistrict()
    );


    return true;

  }


  /* =======================================================
     INITIALIZE
     ======================================================= */

  function init() {

    setupDistrictButton();

    setupDistrictModal();

    setupDistrictFilter();

    setupEscapeKey();


    initializeSelectedDistrict();

    refresh();


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

    getDistrictState:

      getDistrictState,

    getDistrictPincode:

      getDistrictPincode,

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