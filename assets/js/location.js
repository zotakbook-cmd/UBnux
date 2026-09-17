/* =========================================================
   UBnux - Location Manager
   File: assets/js/location.js

   Responsibilities:
   - Browser geolocation
   - Latitude / longitude handling
   - Nearest district detection
   - Backend district detection
   - District selection integration
   - Location permission handling
   - User-friendly location messages
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
    {};


  /* =======================================================
     INTERNAL STATE
     ======================================================= */

  var locationState = {

    supported:
      typeof navigator !==
      "undefined" &&
      "geolocation" in
      navigator,

    detecting:
      false,

    permission:
      "unknown",

    latitude:
      null,

    longitude:
      null,

    accuracy:
      null,

    district:
      null,

    source:
      null,

    error:
      null

  };


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
     LOCATION MESSAGE
     ======================================================= */

  function showLocationMessage(
    message,
    type
  ) {

    var element =
      getElement(
        "locationMessage"
      );


    if (!element) {

      return;

    }


    element.textContent =
      message ||
      "";


    element.className =
      "location-message";


    if (type) {

      element.classList.add(
        type
      );

    }

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

    var firstLat =
      Number(lat1);

    var firstLon =
      Number(lon1);

    var secondLat =
      Number(lat2);

    var secondLon =
      Number(lon2);


    if (
      !Number.isFinite(
        firstLat
      ) ||
      !Number.isFinite(
        firstLon
      ) ||
      !Number.isFinite(
        secondLat
      ) ||
      !Number.isFinite(
        secondLon
      )
    ) {

      return Infinity;

    }


    var earthRadius =
      6371;


    var dLat =
      (
        secondLat -
        firstLat
      ) *
      Math.PI /
      180;


    var dLon =
      (
        secondLon -
        firstLon
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
        firstLat *
        Math.PI /
        180
      ) *
      Math.cos(
        secondLat *
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
     GET DISTRICTS
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
      Array.isArray(
        App.state.districts
      )
    ) {

      return App.state.districts;

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
     READ DISTRICT VALUE
     ======================================================= */

  function getDistrictValue(
    district,
    fields
  ) {

    if (
      !district ||
      !Array.isArray(
        fields
      )
    ) {

      return "";

    }


    var keys =
      Object.keys(
        district
      );


    for (
      var i = 0;
      i < fields.length;
      i++
    ) {

      var wanted =
        String(
          fields[i]
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
          wanted
        ) {

          var value =
            district[
              keys[j]
            ];


          if (
            value !==
            null &&
            value !==
            undefined &&
            String(
              value
            ).trim() !== ""
          ) {

            return value;

          }

        }

      }

    }


    return "";

  }


  /* =======================================================
     DISTRICT ID
     ======================================================= */

  function getDistrictId(
    district
  ) {

    return String(
      getDistrictValue(
        district,
        [
          "DistrictID",
          "districtID",
          "districtId",
          "ID",
          "Id",
          "id",
          "Code",
          "code"
        ]
      ) || ""
    ).trim();

  }


  /* =======================================================
     DISTRICT NAME
     ======================================================= */

  function getDistrictName(
    district
  ) {

    return String(
      getDistrictValue(
        district,
        [
          "DistrictName",
          "districtName",
          "Name",
          "name",
          "District",
          "district",
          "Title",
          "title"
        ]
      ) || ""
    ).trim();

  }


  /* =======================================================
     DISTRICT LATITUDE
     ======================================================= */

  function getDistrictLatitude(
    district
  ) {

    return parseFloat(
      getDistrictValue(
        district,
        [
          "Latitude",
          "latitude",
          "Lat",
          "lat"
        ]
      )
    );

  }


  /* =======================================================
     DISTRICT LONGITUDE
     ======================================================= */

  function getDistrictLongitude(
    district
  ) {

    return parseFloat(
      getDistrictValue(
        district,
        [
          "Longitude",
          "longitude",
          "Lng",
          "lng",
          "Lon",
          "lon"
        ]
      )
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
      getDistricts();


    if (
      !districts.length
    ) {

      return null;

    }


    var nearest =
      null;

    var nearestDistance =
      Infinity;


    for (
      var i = 0;
      i < districts.length;
      i++
    ) {

      var district =
        districts[i];


      var districtLat =
        getDistrictLatitude(
          district
        );


      var districtLon =
        getDistrictLongitude(
          district
        );


      if (
        !Number.isFinite(
          districtLat
        ) ||
        !Number.isFinite(
          districtLon
        )
      ) {

        continue;

      }


      var distance =
        calculateDistance(
          latitude,
          longitude,
          districtLat,
          districtLon
        );


      if (
        distance <
        nearestDistance
      ) {

        nearestDistance =
          distance;

        nearest =
          district;

      }

    }


    if (
      nearest
    ) {

      nearest =
        Object.assign(
          {},
          nearest,
          {
            distanceKm:
              nearestDistance
          }
        );

    }


    return nearest;

  }


  /* =======================================================
     APPLY DISTRICT
     ======================================================= */

  function applyDistrict(
    district,
    source
  ) {

    if (
      !district
    ) {

      return false;

    }


    var districtId =
      getDistrictId(
        district
      );


    var districtName =
      getDistrictName(
        district
      );


    var success =
      false;


    if (
      App.district &&
      typeof App.district.selectDistrict ===
      "function"
    ) {

      success =
        App.district.selectDistrict(
          districtId ||
          districtName
        ) !== false;

    }
    else if (
      App.district &&
      typeof App.district.setDistrict ===
      "function"
    ) {

      success =
        App.district.setDistrict(
          districtId ||
          districtName
        ) !== false;

    }
    else if (
      typeof App.setDistrict ===
      "function"
    ) {

      App.setDistrict(
        districtId ||
        districtName
      );

      success =
        true;

    }


    locationState.district =
      district;

    locationState.source =
      source ||
      "location";


    return success;

  }


  /* =======================================================
     BROWSER GEOLOCATION OPTIONS
     ======================================================= */

  function getGeolocationOptions() {

    return {

      enableHighAccuracy:
        CONFIG.LOCATION_HIGH_ACCURACY !==
        false,

      timeout:
        Number(
          CONFIG.LOCATION_TIMEOUT
        ) ||
        10000,

      maximumAge:
        Number(
          CONFIG.LOCATION_MAX_AGE
        ) ||
        300000

    };

  }


  /* =======================================================
     GEOLOCATION SUCCESS
     ======================================================= */

  function handleGeolocationSuccess(
    position,
    options
  ) {

    locationState.detecting =
      false;

    locationState.error =
      null;

    locationState.latitude =
      position.coords.latitude;

    locationState.longitude =
      position.coords.longitude;

    locationState.accuracy =
      position.coords.accuracy;

    locationState.permission =
      "granted";


    var nearest =
      findNearestDistrict(
        locationState.latitude,
        locationState.longitude
      );


    if (
      nearest
    ) {

      var applied =
        applyDistrict(
          nearest,
          "browser-geolocation"
        );


      if (
        applied
      ) {

        var name =
          getDistrictName(
            nearest
          );


        showLocationMessage(
          name
            ? "Location detected. " +
              "District selected: " +
              name
            : "Location detected successfully.",
          "success"
        );


        if (
          options &&
          options.closeModal !==
          false
        ) {

          closeDistrictModal();

        }


        return {

          success:
            true,

          district:
            nearest,

          latitude:
            locationState.latitude,

          longitude:
            locationState.longitude,

          accuracy:
            locationState.accuracy,

          source:
            "browser-geolocation"

        };

      }

    }


    /*
     * If browser coordinates are available
     * but local district coordinates are not,
     * try backend detection.
     */

    if (
      CONFIG.USE_BACKEND_LOCATION !==
      false
    ) {

      return detectUsingBackend(
        locationState.latitude,
        locationState.longitude,
        options
      );

    }


    showLocationMessage(
      "Your location was detected, but no nearby district could be identified.",
      "warning"
    );


    return {

      success:
        false,

      latitude:
        locationState.latitude,

      longitude:
        locationState.longitude,

      accuracy:
        locationState.accuracy,

      source:
        "browser-geolocation"

    };

  }


  /* =======================================================
     GEOLOCATION ERROR
     ======================================================= */

  function handleGeolocationError(
    error,
    options
  ) {

    locationState.detecting =
      false;


    locationState.error =
      error ||
      null;


    if (
      error &&
      error.code ===
      1
    ) {

      locationState.permission =
        "denied";


      showLocationMessage(
        "Location permission was denied. Please allow location access or select your district manually.",
        "warning"
      );

    }
    else if (
      error &&
      error.code ===
      2
    ) {

      showLocationMessage(
        "Your location could not be determined. Please try again or select your district manually.",
        "error"
      );

    }
    else if (
      error &&
      error.code ===
      3
    ) {

      showLocationMessage(
        "Location detection timed out. Please try again.",
        "error"
      );

    }
    else {

      showLocationMessage(
        "Unable to detect your location. Please select your district manually.",
        "error"
      );

    }


    /*
     * Backend location detection can still
     * be attempted if available.
     */

    if (
      CONFIG.USE_BACKEND_LOCATION !==
      false
    ) {

      return detectUsingBackend(
        null,
        null,
        options
      );

    }


    return {

      success:
        false,

      error:
        error || null

    };

  }


  /* =======================================================
     DETECT USING BROWSER
     ======================================================= */

  function detectUsingBrowser(
    options
  ) {

    options =
      options ||
      {};


    if (
      locationState.detecting
    ) {

      return Promise.resolve(
        {
          success:
            false,

          busy:
            true

        }
      );

    }


    if (
      !locationState.supported
    ) {

      showLocationMessage(
        "Your browser does not support location detection.",
        "error"
      );


      return Promise.resolve(
        {
          success:
            false,

          unsupported:
            true

        }
      );

    }


    locationState.detecting =
      true;

    locationState.error =
      null;


    showLocationMessage(
      "Detecting your location...",
      "loading"
    );


    return new Promise(
      function (
        resolve
      ) {

        navigator.geolocation.getCurrentPosition(

          function (
            position
          ) {

            var result =
              handleGeolocationSuccess(
                position,
                options
              );


            if (
              result &&
              typeof result.then ===
              "function"
            ) {

              result.then(
                resolve
              );

            }
            else {

              resolve(
                result
              );

            }

          },

          function (
            error
          ) {

            var result =
              handleGeolocationError(
                error,
                options
              );


            if (
              result &&
              typeof result.then ===
              "function"
            ) {

              result.then(
                resolve
              );

            }
            else {

              resolve(
                result
              );

            }

          },

          getGeolocationOptions()

        );

      }
    );

  }


  /* =======================================================
     BACKEND DETECTION
     ======================================================= */

  async function detectUsingBackend(
    latitude,
    longitude,
    options
  ) {

    options =
      options ||
      {};


    /*
     * Support multiple possible API
     * method names so this module remains
     * compatible with different api.js
     * versions.
     */

    var detector =
      null;


    if (
      App.api &&
      typeof App.api.detectDistrictByLocation ===
      "function"
    ) {

      detector =
        App.api.detectDistrictByLocation;

    }
    else if (
      App.api &&
      typeof App.api.detectDistrict ===
      "function"
    ) {

      detector =
        App.api.detectDistrict;

    }
    else if (
      App.api &&
      typeof App.api.getDistrictByLocation ===
      "function"
    ) {

      detector =
        App.api.getDistrictByLocation;

    }
    else if (
      typeof App.detectDistrictByLocation ===
      "function"
    ) {

      detector =
        App.detectDistrictByLocation;

    }


    if (
      !detector
    ) {

      return {

        success:
          false,

        unavailable:
          true

      };

    }


    try {

      var payload = {

        latitude:
          latitude,

        longitude:
          longitude,

        lat:
          latitude,

        lng:
          longitude,

        longitude:
          longitude

      };


      var result;


      /*
       * Most APIs expect an object.
       */

      try {

        result =
          await detector(
            payload
          );

      }
      catch (
        firstError
      ) {

        /*
         * Compatibility with APIs that
         * expect latitude and longitude
         * separately.
         */

        result =
          await detector(
            latitude,
            longitude
          );

      }


      if (
        !result
      ) {

        throw new Error(
          "Empty location response."
        );

      }


      if (
        result.success ===
        false
      ) {

        throw new Error(
          result.message ||
          "Backend location detection failed."
        );

      }


      var district =
        result.district ||
        result.data &&
        result.data.district ||
        result.data ||
        null;


      /*
       * Some APIs may return districtId
       * and districtName instead of an object.
       */

      if (
        !district &&
        (
          result.districtId ||
          result.districtID ||
          result.districtName
        )
      ) {

        district = {

          DistrictID:
            result.districtId ||
            result.districtID ||
            "",

          DistrictName:
            result.districtName ||
            ""

        };

      }


      if (
        district
      ) {

        /*
         * If backend returned only an ID,
         * find the complete district from
         * frontend district data.
         */

        if (
          typeof district ===
          "string" ||
          typeof district ===
          "number"
        ) {

          var districts =
            getDistricts();


          var target =
            String(
              district
            )
            .trim()
            .toLowerCase();


          for (
            var i = 0;
            i < districts.length;
            i++
          ) {

            var item =
              districts[i];


            var id =
              getDistrictId(
                item
              )
              .toLowerCase();


            var name =
              getDistrictName(
                item
              )
              .toLowerCase();


            if (
              id ===
              target ||
              name ===
              target
            ) {

              district =
                item;

              break;

            }

          }

        }


        var applied =
          applyDistrict(
            district,
            "backend"
          );


        if (
          applied
        ) {

          var districtName =
            getDistrictName(
              district
            );


          showLocationMessage(
            districtName
              ? "District detected: " +
                districtName
              : "District detected successfully.",
            "success"
          );


          if (
            options.closeModal !==
            false
          ) {

            closeDistrictModal();

          }


          return {

            success:
              true,

            district:
              district,

            source:
              "backend",

            latitude:
              latitude,

            longitude:
              longitude

          };

        }

      }


      showLocationMessage(
        "Location was detected, but a district could not be selected.",
        "warning"
      );


      return {

        success:
          false,

        source:
          "backend"

      };

    }
    catch (
      error
    ) {

      console.warn(
        "[UBnux] Backend location detection failed:",
        error
      );


      return {

        success:
          false,

        error:
          error,

        source:
          "backend"

      };

    }

  }


  /* =======================================================
     MAIN DETECTION
     ======================================================= */

  async function detectLocation(
    options
  ) {

    options =
      options ||
      {};


    /*
     * First try browser location because
     * it gives accurate coordinates.
     */

    if (
      locationState.supported
    ) {

      return detectUsingBrowser(
        options
      );

    }


    /*
     * Browser doesn't support geolocation.
     * Try backend detection without coordinates
     * if API supports it.
     */

    return detectUsingBackend(
      null,
      null,
      options
    );

  }


  /* =======================================================
     OPEN DISTRICT MODAL
     ======================================================= */

  function openDistrictModal() {

    if (
      App.district &&
      typeof App.district.openDistrictModal ===
      "function"
    ) {

      return App.district.openDistrictModal();

    }


    var modal =
      getElement(
        "districtModal"
      );


    if (!modal) {

      return false;

    }


    modal.classList.add(
      "active"
    );


    modal.setAttribute(
      "aria-hidden",
      "false"
    );


    document.body.classList.add(
      "modal-open"
    );


    document.body.style.overflow =
      "hidden";


    return true;

  }


  /* =======================================================
     CLOSE DISTRICT MODAL
     ======================================================= */

  function closeDistrictModal() {

    if (
      App.district &&
      typeof App.district.closeDistrictModal ===
      "function"
    ) {

      return App.district.closeDistrictModal();

    }


    var modal =
      getElement(
        "districtModal"
      );


    if (!modal) {

      return false;

    }


    modal.classList.remove(
      "active"
    );


    modal.setAttribute(
      "aria-hidden",
      "true"
    );


    document.body.classList.remove(
      "modal-open"
    );


    document.body.style.overflow =
      "";


    return true;

  }


  /* =======================================================
     LOCATION BUTTON
     ======================================================= */

  function setupLocationButton() {

    var button =
      getElement(
        "detectLocationButton"
      );


    if (
      !button
    ) {

      return;

    }


    button.addEventListener(
      "click",
      async function (
        event
      ) {

        event.preventDefault();


        if (
          locationState.detecting
        ) {

          return;

        }


        var originalHTML =
          button.innerHTML;


        button.disabled =
          true;


        button.innerHTML =
          '<i class="fa-solid fa-spinner fa-spin"></i> Detecting...';


        try {

          await detectLocation(
            {
              closeModal:
                true
            }
          );

        }
        finally {

          button.disabled =
            false;


          button.innerHTML =
            originalHTML;

        }

      }
    );

  }


  /* =======================================================
     LOCATION PERMISSION
     ======================================================= */

  async function getPermissionState() {

    if (
      !navigator.permissions ||
      typeof navigator.permissions.query !==
      "function"
    ) {

      return "unknown";

    }


    try {

      var permission =
        await navigator.permissions.query(
          {
            name:
              "geolocation"
          }
        );


      locationState.permission =
        permission.state;


      return permission.state;

    }
    catch (
      error
    ) {

      return "unknown";

    }

  }


  /* =======================================================
     GET CURRENT LOCATION
     ======================================================= */

  function getLocationState() {

    return Object.assign(
      {},
      locationState
    );

  }


  /* =======================================================
     CLEAR LOCATION
     ======================================================= */

  function clearLocationState() {

    locationState.latitude =
      null;

    locationState.longitude =
      null;

    locationState.accuracy =
      null;

    locationState.district =
      null;

    locationState.source =
      null;

    locationState.error =
      null;

    locationState.detecting =
      false;


    return true;

  }


  /* =======================================================
     INITIALIZE
     ======================================================= */

  function init() {

    setupLocationButton();

    getPermissionState();


    /*
     * Don't automatically request browser
     * location permission on page load.
     *
     * Permission is requested only when
     * the user presses "Detect My Location".
     */

    App.locationReady =
      true;


    return true;

  }


  /* =======================================================
     PUBLIC API
     ======================================================= */

  App.location = {

    init:
      init,

    detectLocation:
      detectLocation,

    detectUsingBrowser:
      detectUsingBrowser,

    detectUsingBackend:
      detectUsingBackend,

    findNearestDistrict:
      findNearestDistrict,

    calculateDistance:
      calculateDistance,

    getLocationState:
      getLocationState,

    clearLocationState:
      clearLocationState,

    getPermissionState:
      getPermissionState,

    openDistrictModal:
      openDistrictModal,

    closeDistrictModal:
      closeDistrictModal,

    showLocationMessage:
      showLocationMessage

  };


  /* =======================================================
     TOP-LEVEL COMPATIBILITY ALIASES
     ======================================================= */

  App.detectLocation =
    detectLocation;


  App.detectUsingBrowser =
    detectUsingBrowser;


  App.detectUsingBackend =
    detectUsingBackend;


  App.findNearestDistrict =
    findNearestDistrict;


  App.calculateDistance =
    calculateDistance;


  App.getLocationState =
    getLocationState;


  App.clearLocationState =
    clearLocationState;


  App.openDistrictModal =
    openDistrictModal;


  App.closeDistrictModal =
    closeDistrictModal;


  /* =======================================================
     INITIALIZE
     ======================================================= */

  init();


})(window, document);