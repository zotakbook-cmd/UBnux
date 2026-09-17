/* =========================================================
   UBnux - Utility Manager
   File: assets/js/utils.js

   Responsibilities:
   - Common DOM helpers
   - HTML escaping
   - Text utilities
   - Number / currency formatting
   - Date formatting
   - Debounce / throttle
   - Safe URL helpers
   - Scroll utilities
   - Clipboard
   - Toast compatibility
   - General UI helpers
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
     DOM HELPERS
     ======================================================= */

  function $(selector) {

    if (
      !selector
    ) {

      return null;

    }


    if (
      typeof selector !==
      "string"
    ) {

      return selector;

    }


    /*
     * ID shortcut.
     */

    if (
      selector.charAt(0) ===
      "#"
    ) {

      return document.getElementById(
        selector.substring(1)
      );

    }


    return document.querySelector(
      selector
    );

  }


  function $all(selector) {

    if (
      !selector ||
      typeof selector !==
      "string"
    ) {

      return [];

    }


    try {

      return Array.from(
        document.querySelectorAll(
          selector
        )
      );

    }
    catch (
      error
    ) {

      return [];

    }

  }


  function getElement(
    id
  ) {

    if (
      !id
    ) {

      return null;

    }


    return document.getElementById(
      id
    );

  }


  function exists(
    element
  ) {

    if (
      typeof element ===
      "string"
    ) {

      return !!getElement(
        element
      );

    }


    return !!element;

  }


  /* =======================================================
     HTML ESCAPE
     ======================================================= */

  function escapeHTML(
    value
  ) {

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
     TEXT UTILITIES
     ======================================================= */

  function normalizeText(
    value
  ) {

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
      .normalize
        ? String(
            value
          )
            .normalize(
              "NFKC"
            )
            .replace(
              /\s+/g,
              " "
            )
            .trim()
            .toLowerCase()
        : String(
            value
          )
            .replace(
              /\s+/g,
              " "
            )
            .trim()
            .toLowerCase();

  }


  function cleanText(
    value
  ) {

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
        /\s+/g,
        " "
      )
      .trim();

  }


  function capitalize(
    value
  ) {

    var text =
      cleanText(
        value
      );


    if (
      !text
    ) {

      return "";

    }


    return (
      text.charAt(
        0
      ).toUpperCase() +
      text.slice(
        1
      )
    );

  }


  function titleCase(
    value
  ) {

    var text =
      cleanText(
        value
      );


    if (
      !text
    ) {

      return "";

    }


    return text
      .toLowerCase()
      .split(
        " "
      )
      .map(
        function (
          word
        ) {

          if (
            !word
          ) {

            return "";

          }


          return (
            word.charAt(
              0
            ).toUpperCase() +
            word.slice(
              1
            )
          );

        }
      )
      .join(
        " "
      );

  }


  function truncate(
    value,
    length,
    suffix
  ) {

    var text =
      cleanText(
        value
      );


    var max =
      Number(
        length
      );


    if (
      !Number.isFinite(
        max
      ) ||
      max <= 0
    ) {

      return "";

    }


    suffix =
      suffix ===
      undefined
        ? "..."
        : String(
            suffix
          );


    if (
      text.length <=
      max
    ) {

      return text;

    }


    var limit =
      Math.max(
        0,
        max -
        suffix.length
      );


    return (
      text.slice(
        0,
        limit
      ).trimEnd() +
      suffix
    );

  }


  function slugify(
    value
  ) {

    return normalizeText(
      value
    )
      .replace(
        /[^\w\s-]/g,
        ""
      )
      .replace(
        /[\s_-]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  }


  function containsText(
    text,
    search
  ) {

    var source =
      normalizeText(
        text
      );


    var query =
      normalizeText(
        search
      );


    if (
      !query
    ) {

      return true;

    }


    return source.indexOf(
      query
    ) !==
    -1;

  }


  /* =======================================================
     NUMBER UTILITIES
     ======================================================= */

  function toNumber(
    value,
    fallback
  ) {

    var number =
      Number(
        String(
          value ===
          undefined ||
          value ===
          null
            ? ""
            : value
        )
          .replace(
            /,/g,
            ""
          )
          .replace(
            /₹/g,
            ""
          )
          .trim()
      );


    if (
      Number.isFinite(
        number
      )
    ) {

      return number;

    }


    return (
      fallback ===
      undefined
        ? 0
        : fallback
    );

  }


  function formatNumber(
    value,
    decimals
  ) {

    var number =
      toNumber(
        value,
        0
      );


    var digits =
      decimals ===
      undefined
        ? 0
        : Math.max(
            0,
            Number(
              decimals
            ) || 0
          );


    try {

      return number.toLocaleString(
        "en-IN",
        {
          minimumFractionDigits:
            digits,

          maximumFractionDigits:
            digits
        }
      );

    }
    catch (
      error
    ) {

      return number.toFixed(
        digits
      );

    }

  }


  function formatCurrency(
    value,
    currency
  ) {

    var number =
      toNumber(
        value,
        0
      );


    currency =
      currency ||
      "INR";


    try {

      return number.toLocaleString(
        "en-IN",
        {
          style:
            "currency",

          currency:
            currency,

          maximumFractionDigits:
            0
        }
      );

    }
    catch (
      error
    ) {

      if (
        currency ===
        "INR"
      ) {

        return (
          "₹" +
          formatNumber(
            number
          )
        );

      }


      return (
        currency +
        " " +
        formatNumber(
          number
        )
      );

    }

  }


  function formatINR(
    value
  ) {

    return formatCurrency(
      value,
      "INR"
    );

  }


  /* =======================================================
     RATING UTILITIES
     ======================================================= */

  function clamp(
    value,
    min,
    max
  ) {

    var number =
      toNumber(
        value,
        min
      );


    return Math.max(
      min,
      Math.min(
        max,
        number
      )
    );

  }


  function formatRating(
    value
  ) {

    var rating =
      clamp(
        value,
        0,
        5
      );


    return rating.toFixed(
      1
    );

  }


  /* =======================================================
     DATE UTILITIES
     ======================================================= */

  function parseDate(
    value
  ) {

    if (
      value instanceof Date
    ) {

      return isNaN(
        value.getTime()
      )
        ? null
        : value;

    }


    if (
      value ===
      null ||
      value ===
      undefined ||
      String(
        value
      ).trim() ===
      ""
    ) {

      return null;

    }


    var text =
      String(
        value
      ).trim();


    /*
     * DD/MM/YYYY
     */

    var match =
      text.match(
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
      );


    if (
      match
    ) {

      var day =
        Number(
          match[1]
        );


      var month =
        Number(
          match[2]
        );


      var year =
        Number(
          match[3]
        );


      var parsed =
        new Date(
          year,
          month - 1,
          day
        );


      if (
        parsed.getFullYear() ===
          year &&
        parsed.getMonth() ===
          month - 1 &&
        parsed.getDate() ===
          day
      ) {

        return parsed;

      }

    }


    var date =
      new Date(
        text
      );


    if (
      isNaN(
        date.getTime()
      )
    ) {

      return null;

    }


    return date;

  }


  function pad(
    value
  ) {

    return String(
      value
    ).padStart(
      2,
      "0"
    );

  }


  function formatDate(
    value,
    options
  ) {

    var date =
      parseDate(
        value
      );


    if (
      !date
    ) {

      return "";

    }


    options =
      options ||
      {};


    var locale =
      options.locale ||
      "en-IN";


    try {

      return date.toLocaleDateString(
        locale,
        {
          day:
            "2-digit",

          month:
            "short",

          year:
            "numeric"
        }
      );

    }
    catch (
      error
    ) {

      return (
        pad(
          date.getDate()
        ) +
        "/" +
        pad(
          date.getMonth() +
          1
        ) +
        "/" +
        date.getFullYear()
      );

    }

  }


  function formatDateTime(
    value
  ) {

    var date =
      parseDate(
        value
      );


    if (
      !date
    ) {

      return "";

    }


    try {

      return date.toLocaleString(
        "en-IN",
        {
          day:
            "2-digit",

          month:
            "short",

          year:
            "numeric",

          hour:
            "2-digit",

          minute:
            "2-digit"
        }
      );

    }
    catch (
      error
    ) {

      return formatDate(
        date
      );

    }

  }


  function toISODate(
    value
  ) {

    var date =
      parseDate(
        value
      );


    if (
      !date
    ) {

      return "";

    }


    return (
      date.getFullYear() +
      "-" +
      pad(
        date.getMonth() +
        1
      ) +
      "-" +
      pad(
        date.getDate()
      )
    );

  }


  /* =======================================================
     URL UTILITIES
     ======================================================= */

  function normalizeURL(
    value,
    allowedProtocols
  ) {

    var url =
      cleanText(
        value
      );


    if (
      !url
    ) {

      return "";

    }


    if (
      !/^[a-z][a-z0-9+.-]*:\/\//i.test(
        url
      )
    ) {

      url =
        "https://" +
        url;

    }


    try {

      var parsed =
        new URL(
          url
        );


      var protocols =
        Array.isArray(
          allowedProtocols
        )
          ? allowedProtocols
          : [
              "http:",
              "https:"
            ];


      if (
        protocols.indexOf(
          parsed.protocol
        ) ===
        -1
      ) {

        return "";

      }


      return parsed.href;

    }
    catch (
      error
    ) {

      return "";

    }

  }


  function safeURL(
    value
  ) {

    return normalizeURL(
      value,
      [
        "http:",
        "https:"
      ]
    );

  }


  function safeTelURL(
    value
  ) {

    var phone =
      cleanText(
        value
      )
      .replace(
        /[^\d+]/g,
        ""
      );


    if (
      !phone
    ) {

      return "";

    }


    return (
      "tel:" +
      phone
    );

  }


  function safeWhatsAppURL(
    value
  ) {

    var phone =
      cleanText(
        value
      )
      .replace(
        /\D/g,
        ""
      );


    if (
      phone.length ===
      10
    ) {

      phone =
        "91" +
        phone;

    }


    if (
      phone.length <
      10
    ) {

      return "";

    }


    return (
      "https://wa.me/" +
      phone
    );

  }


  function isValidURL(
    value
  ) {

    return !!safeURL(
      value
    );

  }


  /* =======================================================
     ARRAY UTILITIES
     ======================================================= */

  function ensureArray(
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
      value ===
      null ||
      value ===
      undefined ||
      value ===
      ""
    ) {

      return [];

    }


    return [
      value
    ];

  }


  function unique(
    array,
    keyFunction
  ) {

    if (
      !Array.isArray(
        array
      )
    ) {

      return [];

    }


    var seen =
      new Set();


    var result =
      [];


    for (
      var i = 0;
      i < array.length;
      i++
    ) {

      var item =
        array[i];


      var key =
        typeof keyFunction ===
        "function"
          ? keyFunction(
              item,
              i
            )
          : item;


      if (
        key instanceof
        Object
      ) {

        try {

          key =
            JSON.stringify(
              key
            );

        }
        catch (
          error
        ) {

          key =
            String(
              key
            );

        }

      }


      key =
        String(
          key
        );


      if (
        seen.has(
          key
        )
      ) {

        continue;

      }


      seen.add(
        key
      );


      result.push(
        item
      );

    }


    return result;

  }


  function chunk(
    array,
    size
  ) {

    if (
      !Array.isArray(
        array
      )
    ) {

      return [];

    }


    var length =
      Math.max(
        1,
        Number(
          size
        ) || 1
      );


    var result =
      [];


    for (
      var i = 0;
      i < array.length;
      i += length
    ) {

      result.push(
        array.slice(
          i,
          i + length
        )
      );

    }


    return result;

  }


  /* =======================================================
     OBJECT UTILITIES
     ======================================================= */

  function isObject(
    value
  ) {

    return (
      value !==
      null &&
      typeof value ===
      "object" &&
      !Array.isArray(
        value
      )
    );

  }


  function clone(
    value
  ) {

    if (
      value ===
      null ||
      value ===
      undefined
    ) {

      return value;

    }


    try {

      return JSON.parse(
        JSON.stringify(
          value
        )
      );

    }
    catch (
      error
    ) {

      return value;

    }

  }


  function merge(
    target
  ) {

    var result =
      isObject(
        target
      )
        ? clone(
            target
          )
        : {};


    for (
      var i = 1;
      i < arguments.length;
      i++
    ) {

      var source =
        arguments[i];


      if (
        !isObject(
          source
        )
      ) {

        continue;

      }


      Object.keys(
        source
      ).forEach(
        function (
          key
        ) {

          if (
            isObject(
              source[key]
            ) &&
            isObject(
              result[key]
            )
          ) {

            result[key] =
              merge(
                result[key],
                source[key]
              );

          }
          else {

            result[key] =
              source[key];

          }

        }
      );

    }


    return result;

  }


  /* =======================================================
     DEBOUNCE
     ======================================================= */

  function debounce(
    functionToCall,
    wait,
    immediate
  ) {

    if (
      typeof functionToCall !==
      "function"
    ) {

      return function () {};

    }


    var timeout =
      null;


    var debounced =
      function () {

        var context =
          this;


        var args =
          arguments;


        var callNow =
          immediate &&
          !timeout;


        if (
          timeout
        ) {

          window.clearTimeout(
            timeout
          );

        }


        timeout =
          window.setTimeout(
            function () {

              timeout =
                null;


              if (
                !immediate
              ) {

                functionToCall.apply(
                  context,
                  args
                );

              }

            },
            Math.max(
              0,
              Number(
                wait
              ) || 0
            )
          );


        if (
          callNow
        ) {

          functionToCall.apply(
            context,
            args
          );

        }

      };


    debounced.cancel =
      function () {

        if (
          timeout
        ) {

          window.clearTimeout(
            timeout
          );

        }


        timeout =
          null;

      };


    debounced.flush =
      function () {

        if (
          !timeout
        ) {

          return;

        }


        window.clearTimeout(
          timeout
        );


        timeout =
          null;


        functionToCall.apply(
          null,
          []
        );

      };


    return debounced;

  }


  /* =======================================================
     THROTTLE
     ======================================================= */

  function throttle(
    functionToCall,
    wait
  ) {

    if (
      typeof functionToCall !==
      "function"
    ) {

      return function () {};

    }


    var waiting =
      false;


    var lastArgs =
      null;


    var lastContext =
      null;


    return function () {

      lastArgs =
        arguments;


      lastContext =
        this;


      if (
        waiting
      ) {

        return;

      }


      waiting =
        true;


      functionToCall.apply(
        lastContext,
        lastArgs
      );


      window.setTimeout(
        function () {

          waiting =
            false;


          lastArgs =
            null;


          lastContext =
            null;

        },
        Math.max(
          0,
          Number(
            wait
          ) || 0
        )
      );

    };

  }


  /* =======================================================
     SLEEP
     ======================================================= */

  function sleep(
    milliseconds
  ) {

    return new Promise(
      function (
        resolve
      ) {

        window.setTimeout(
          resolve,
          Math.max(
            0,
            Number(
              milliseconds
            ) || 0
          )
        );

      }
    );

  }


  /* =======================================================
     SCROLL UTILITIES
     ======================================================= */

  function scrollToTop(
    smooth
  ) {

    try {

      window.scrollTo(
        {
          top:
            0,

          behavior:
            smooth ===
            false
              ? "auto"
              : "smooth"
        }
      );

    }
    catch (
      error
    ) {

      window.scrollTo(
        0,
        0
      );

    }

  }


  function scrollToElement(
    element,
    offset,
    smooth
  ) {

    var target =
      typeof element ===
      "string"
        ? $(
            element
          )
        : element;


    if (
      !target
    ) {

      return false;

    }


    var extraOffset =
      Number(
        offset
      ) || 0;


    var rect =
      target.getBoundingClientRect();


    var top =
      rect.top +
      window.pageYOffset -
      extraOffset;


    try {

      window.scrollTo(
        {
          top:
            Math.max(
              0,
              top
            ),

          behavior:
            smooth ===
            false
              ? "auto"
              : "smooth"
        }
      );

    }
    catch (
      error
    ) {

      window.scrollTo(
        0,
        Math.max(
          0,
          top
        )
      );

    }


    return true;

  }


  /* =======================================================
     VISIBILITY
     ======================================================= */

  function show(
    element,
    display
  ) {

    var target =
      typeof element ===
      "string"
        ? $(
            element
          )
        : element;


    if (
      !target
    ) {

      return false;

    }


    target.hidden =
      false;


    target.classList.remove(
      "hidden"
    );


    if (
      display
    ) {

      target.style.display =
        display;

    }
    else if (
      target.style.display ===
      "none"
    ) {

      target.style.display =
        "";

    }


    target.setAttribute(
      "aria-hidden",
      "false"
    );


    return true;

  }


  function hide(
    element
  ) {

    var target =
      typeof element ===
      "string"
        ? $(
            element
          )
        : element;


    if (
      !target
    ) {

      return false;

    }


    target.hidden =
      true;


    target.classList.add(
      "hidden"
    );


    target.setAttribute(
      "aria-hidden",
      "true"
    );


    return true;

  }


  function toggle(
    element,
    force
  ) {

    var target =
      typeof element ===
      "string"
        ? $(
            element
          )
        : element;


    if (
      !target
    ) {

      return false;

    }


    var shouldShow =
      force ===
      undefined
        ? target.hidden ||
          target.classList.contains(
            "hidden"
          )
        : !!force;


    if (
      shouldShow
    ) {

      return show(
        target
      );

    }


    return hide(
      target
    );

  }


  /* =======================================================
     LOADING STATE
     ======================================================= */

  function setLoading(
    element,
    loading,
    loadingText
  ) {

    var target =
      typeof element ===
      "string"
        ? $(
            element
          )
        : element;


    if (
      !target
    ) {

      return false;

    }


    if (
      !target.dataset.originalContent
    ) {

      target.dataset.originalContent =
        target.innerHTML;

    }


    target.disabled =
      !!loading;


    target.setAttribute(
      "aria-busy",
      loading
        ? "true"
        : "false"
    );


    if (
      loading
    ) {

      target.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> ' +
        escapeHTML(
          loadingText ||
          "Loading..."
        );

    }
    else {

      target.innerHTML =
        target.dataset.originalContent;

    }


    return true;

  }


  /* =======================================================
     CLIPBOARD
     ======================================================= */

  async function copyToClipboard(
    value
  ) {

    var text =
      String(
        value ===
        undefined ||
        value ===
        null
          ? ""
          : value
      );


    if (
      !text
    ) {

      return false;

    }


    try {

      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText ===
        "function"
      ) {

        await navigator.clipboard.writeText(
          text
        );


        return true;

      }

    }
    catch (
      error
    ) {}


    /*
     * Legacy fallback.
     */

    try {

      var textarea =
        document.createElement(
          "textarea"
        );


      textarea.value =
        text;


      textarea.setAttribute(
        "readonly",
        ""
      );


      textarea.style.position =
        "fixed";


      textarea.style.opacity =
        "0";


      document.body.appendChild(
        textarea
      );


      textarea.select();


      var successful =
        document.execCommand(
          "copy"
        );


      document.body.removeChild(
        textarea
      );


      return successful;

    }
    catch (
      error
    ) {

      return false;

    }

  }


  /* =======================================================
     LOCAL STORAGE
     ======================================================= */

  function getStorage() {

    try {

      return window.localStorage;

    }
    catch (
      error
    ) {

      return null;

    }

  }


  function storageGet(
    key,
    fallback
  ) {

    var storage =
      getStorage();


    if (
      !storage ||
      !key
    ) {

      return (
        fallback ===
        undefined
          ? null
          : fallback
      );

    }


    try {

      var value =
        storage.getItem(
          key
        );


      if (
        value ===
        null
      ) {

        return (
          fallback ===
          undefined
            ? null
            : fallback
        );

      }


      try {

        return JSON.parse(
          value
        );

      }
      catch (
        error
      ) {

        return value;

      }

    }
    catch (
      error
    ) {

      return (
        fallback ===
        undefined
          ? null
          : fallback
      );

    }

  }


  function storageSet(
    key,
    value
  ) {

    var storage =
      getStorage();


    if (
      !storage ||
      !key
    ) {

      return false;

    }


    try {

      var data;


      if (
        typeof value ===
        "string"
      ) {

        data =
          value;

      }
      else {

        data =
          JSON.stringify(
            value
          );

      }


      storage.setItem(
        key,
        data
      );


      return true;

    }
    catch (
      error
    ) {

      return false;

    }

  }


  function storageRemove(
    key
  ) {

    var storage =
      getStorage();


    if (
      !storage ||
      !key
    ) {

      return false;

    }


    try {

      storage.removeItem(
        key
      );


      return true;

    }
    catch (
      error
    ) {

      return false;

    }

  }


  /* =======================================================
     EVENT UTILITIES
     ======================================================= */

  function on(
    element,
    eventName,
    handler,
    options
  ) {

    var target =
      typeof element ===
      "string"
        ? $(
            element
          )
        : element;


    if (
      !target ||
      typeof handler !==
      "function"
    ) {

      return false;

    }


    target.addEventListener(
      eventName,
      handler,
      options ||
      false
    );


    return true;

  }


  function off(
    element,
    eventName,
    handler,
    options
  ) {

    var target =
      typeof element ===
      "string"
        ? $(
            element
          )
        : element;


    if (
      !target ||
      typeof handler !==
      "function"
    ) {

      return false;

    }


    target.removeEventListener(
      eventName,
      handler,
      options ||
      false
    );


    return true;

  }


  /* =======================================================
     SAFE JSON
     ======================================================= */

  function parseJSON(
    value,
    fallback
  ) {

    if (
      typeof value !==
      "string"
    ) {

      return (
        value ===
        undefined
          ? fallback
          : value
      );

    }


    try {

      return JSON.parse(
        value
      );

    }
    catch (
      error
    ) {

      return (
        fallback ===
        undefined
          ? null
          : fallback
      );

    }

  }


  function stringifyJSON(
    value,
    fallback
  ) {

    try {

      return JSON.stringify(
        value
      );

    }
    catch (
      error
    ) {

      return (
        fallback ===
        undefined
          ? ""
          : fallback
      );

    }

  }


  /* =======================================================
     RANDOM ID
     ======================================================= */

  function randomId(
    prefix
  ) {

    prefix =
      prefix ||
      "ubnux";


    return (
      String(
        prefix
      ) +
      "-" +
      Date.now().toString(
        36
      ) +
      "-" +
      Math.random()
        .toString(
          36
        )
        .substring(
          2,
          9
        )
    );

  }


  /* =======================================================
     DEVICE / VIEWPORT
     ======================================================= */

  function isMobile() {

    return (
      window.matchMedia &&
      window.matchMedia(
        "(max-width: 767px)"
      ).matches
    );

  }


  function isTablet() {

    return (
      window.matchMedia &&
      window.matchMedia(
        "(min-width: 768px) and (max-width: 1023px)"
      ).matches
    );

  }


  function isDesktop() {

    return (
      window.matchMedia &&
      window.matchMedia(
        "(min-width: 1024px)"
      ).matches
    );

  }


  /* =======================================================
     NETWORK STATUS
     ======================================================= */

  function isOnline() {

    return (
      navigator.onLine !==
      false
    );

  }


  /* =======================================================
     ACCESSIBILITY
     ======================================================= */

  function announce(
    message
  ) {

    var live =
      document.getElementById(
        "ubnuxLiveRegion"
      );


    if (
      !live
    ) {

      live =
        document.createElement(
          "div"
        );


      live.id =
        "ubnuxLiveRegion";


      live.setAttribute(
        "aria-live",
        "polite"
      );


      live.setAttribute(
        "aria-atomic",
        "true"
      );


      live.style.position =
        "fixed";


      live.style.width =
        "1px";


      live.style.height =
        "1px";


      live.style.padding =
        "0";


      live.style.margin =
        "-1px";


      live.style.overflow =
        "hidden";


      live.style.clip =
        "rect(0, 0, 0, 0)";


      live.style.whiteSpace =
        "nowrap";


      live.style.border =
        "0";


      document.body.appendChild(
        live
      );

    }


    live.textContent =
      String(
        message ||
        ""
      );


    return true;

  }


  /* =======================================================
     ERROR LOGGING
     ======================================================= */

  function log(
    message,
    data
  ) {

    if (
      CONFIG.DEBUG !==
      true
    ) {

      return;

    }


    try {

      if (
        data ===
        undefined
      ) {

        console.log(
          "[UBnux]",
          message
        );

      }
      else {

        console.log(
          "[UBnux]",
          message,
          data
        );

      }

    }
    catch (
      error
    ) {}

  }


  function warn(
    message,
    data
  ) {

    if (
      CONFIG.DEBUG !==
      true
    ) {

      return;

    }


    try {

      if (
        data ===
        undefined
      ) {

        console.warn(
          "[UBnux]",
          message
        );

      }
      else {

        console.warn(
          "[UBnux]",
          message,
          data
        );

      }

    }
    catch (
      error
    ) {}

  }


  function error(
    message,
    data
  ) {

    try {

      if (
        data ===
        undefined
      ) {

        console.error(
          "[UBnux]",
          message
        );

      }
      else {

        console.error(
          "[UBnux]",
          message,
          data
        );

      }

    }
    catch (
      errorObject
    ) {}

  }


  /* =======================================================
     PAGE LOADER
     ======================================================= */

  function showPageLoader(
    message
  ) {

    var loader =
      getElement(
        "pageLoader"
      );


    var loaderText =
      getElement(
        "loaderText"
      );


    if (
      loaderText &&
      message
    ) {

      loaderText.textContent =
        String(
          message
        );

    }


    if (
      loader
    ) {

      loader.classList.add(
        "active"
      );

      loader.classList.remove(
        "hidden"
      );

      loader.setAttribute(
        "aria-hidden",
        "false"
      );

    }


    return true;

  }


  function hidePageLoader() {

    var loader =
      getElement(
        "pageLoader"
      );


    if (
      loader
    ) {

      loader.classList.remove(
        "active"
      );

      loader.classList.add(
        "hidden"
      );

      loader.setAttribute(
        "aria-hidden",
        "true"
      );

    }


    return true;

  }


  function setLoaderText(
    message
  ) {

    var loaderText =
      getElement(
        "loaderText"
      );


    if (
      loaderText
    ) {

      loaderText.textContent =
        String(
          message ||
          ""
        );

    }


    return true;

  }


  /* =======================================================
     TOAST COMPATIBILITY
     ======================================================= */

  function toast(
    type,
    message,
    duration
  ) {

    if (
      App.showToast &&
      typeof App.showToast ===
      "function"
    ) {

      return App.showToast(
        type,
        message,
        duration
      );

    }


    var element =
      getElement(
        "toast"
      );


    var text =
      getElement(
        "toastMessage"
      );


    if (
      !element
    ) {

      return false;

    }


    if (
      text
    ) {

      text.textContent =
        String(
          message ||
          ""
        );

    }


    element.classList.add(
      "active"
    );


    window.setTimeout(
      function () {

        element.classList.remove(
          "active"
        );

      },
      Number(
        duration ||
        3000
      )
    );


    return true;

  }


  /* =======================================================
     EMPTY VALUE
     ======================================================= */

  function valueOr(
    value,
    fallback
  ) {

    if (
      value ===
      null ||
      value ===
      undefined ||
      String(
        value
      ).trim() ===
      ""
    ) {

      return (
        fallback ===
        undefined
          ? ""
          : fallback
      );

    }


    return value;

  }


  /* =======================================================
     PUBLIC API
     ======================================================= */

  App.utils = {

    $:
      $,

    $all:
      $all,

    getElement:
      getElement,

    exists:
      exists,

    escapeHTML:
      escapeHTML,

    normalizeText:
      normalizeText,

    cleanText:
      cleanText,

    capitalize:
      capitalize,

    titleCase:
      titleCase,

    truncate:
      truncate,

    slugify:
      slugify,

    containsText:
      containsText,

    toNumber:
      toNumber,

    formatNumber:
      formatNumber,

    formatCurrency:
      formatCurrency,

    formatINR:
      formatINR,

    clamp:
      clamp,

    formatRating:
      formatRating,

    parseDate:
      parseDate,

    formatDate:
      formatDate,

    formatDateTime:
      formatDateTime,

    toISODate:
      toISODate,

    normalizeURL:
      normalizeURL,

    safeURL:
      safeURL,

    safeTelURL:
      safeTelURL,

    safeWhatsAppURL:
      safeWhatsAppURL,

    isValidURL:
      isValidURL,

    ensureArray:
      ensureArray,

    unique:
      unique,

    chunk:
      chunk,

    isObject:
      isObject,

    clone:
      clone,

    merge:
      merge,

    debounce:
      debounce,

    throttle:
      throttle,

    sleep:
      sleep,

    scrollToTop:
      scrollToTop,

    scrollToElement:
      scrollToElement,

    show:
      show,

    hide:
      hide,

    toggle:
      toggle,

    setLoading:
      setLoading,

    copyToClipboard:
      copyToClipboard,

    storageGet:
      storageGet,

    storageSet:
      storageSet,

    storageRemove:
      storageRemove,

    on:
      on,

    off:
      off,

    parseJSON:
      parseJSON,

    stringifyJSON:
      stringifyJSON,

    randomId:
      randomId,

    isMobile:
      isMobile,

    isTablet:
      isTablet,

    isDesktop:
      isDesktop,

    isOnline:
      isOnline,

    announce:
      announce,

    log:
      log,

    warn:
      warn,

    error:
      error,

    showPageLoader:
      showPageLoader,

    hidePageLoader:
      hidePageLoader,

    setLoaderText:
      setLoaderText,

    toast:
      toast,

    valueOr:
      valueOr

  };


  /* =======================================================
     TOP-LEVEL COMPATIBILITY ALIASES
     ======================================================= */

  App.$ =
    $;


  App.$all =
    $all;


  App.escapeHTML =
    escapeHTML;


  App.normalizeText =
    normalizeText;


  App.cleanText =
    cleanText;


  App.capitalize =
    capitalize;


  App.titleCase =
    titleCase;


  App.truncateText =
    truncate;


  App.slugify =
    slugify;


  App.formatNumber =
    formatNumber;


  App.formatCurrency =
    formatCurrency;


  App.formatINR =
    formatINR;


  App.formatRating =
    formatRating;


  App.formatDate =
    formatDate;


  App.formatDateTime =
    formatDateTime;


  App.toISODate =
    toISODate;


  App.debounce =
    debounce;


  App.throttle =
    throttle;


  App.sleep =
    sleep;


  App.scrollToTop =
    scrollToTop;


  App.scrollToElement =
    scrollToElement;


  App.copyToClipboard =
    copyToClipboard;


  App.storageGet =
    storageGet;


  App.storageSet =
    storageSet;


  App.storageRemove =
    storageRemove;


  App.showElement =
    show;


  App.hideElement =
    hide;


  App.toggleElement =
    toggle;


  App.setLoading =
    setLoading;


  App.isOnline =
    isOnline;


  App.isMobile =
    isMobile;


  App.announce =
    announce;


  App.showPageLoader =
    showPageLoader;


  App.hidePageLoader =
    hidePageLoader;


  App.setLoaderText =
    setLoaderText;


  /*
   * Existing code may expect:
   *
   * ZilaBiz.utilsReady
   */

  App.utilsReady =
    true;


  /* =======================================================
     GLOBAL ONLINE / OFFLINE ANNOUNCEMENT
     ======================================================= */

  window.addEventListener(
    "online",
    function () {

      announce(
        "Internet connection restored."
      );

    }
  );


  window.addEventListener(
    "offline",
    function () {

      announce(
        "Internet connection lost."
      );

    }
  );


  /* =======================================================
     DEBUG
     ======================================================= */

  log(
    "Utils initialized."
  );


})(window, document);