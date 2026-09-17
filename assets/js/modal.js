
/* =========================================================
   UBnux - Modal Manager
   File: assets/js/modal.js

   Responsibilities:
   - Business details modal
   - Enquiry modal
   - Enquiry form submission
   - Toast notifications
   - Modal backdrop handling
   - Escape key handling
   - Selected business management
   - Call / WhatsApp actions
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


  /* =======================================================
     CONSTANTS
     ======================================================= */

  var ALL_VALUE =
    "ALL";

  var MODAL_OPEN_CLASS =
    "modal-open";

  var BODY_LOCK_CLASS =
    "ubnux-modal-open";


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
     TEXT HELPERS
     ======================================================= */

  function safeString(value) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }

    return String(value).trim();

  }


  function normalizeText(value) {

    return safeString(value)
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  }


  function escapeHTML(value) {

    var text =
      safeString(value);

    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  function firstValue(object, fields) {

    if (
      !object ||
      !Array.isArray(fields)
    ) {

      return "";

    }

    for (
      var i = 0;
      i < fields.length;
      i++
    ) {

      var key =
        fields[i];

      if (
        Object.prototype.hasOwnProperty.call(
          object,
          key
        )
      ) {

        var value =
          object[key];

        if (
          value !== null &&
          value !== undefined &&
          safeString(value) !== ""
        ) {

          return value;

        }

      }

    }

    return "";

  }


  function getBusinessId(business) {

    return safeString(
      firstValue(
        business,
        [
          "BusinessID",
          "BusinessId",
          "businessId",
          "businessID",
          "ID",
          "Id",
          "id",
          "Slug",
          "slug"
        ]
      )
    );

  }


  function getBusinessName(business) {

    return safeString(
      firstValue(
        business,
        [
          "BusinessName",
          "businessName",
          "Name",
          "name",
          "ShopName",
          "Shop Name",
          "CompanyName",
          "Title"
        ]
      )
    ) || "Business";

  }


  function getCategoryName(business) {

    return safeString(
      firstValue(
        business,
        [
          "CategoryName",
          "categoryName",
          "Category",
          "category"
        ]
      )
    );

  }


  function getDescription(business) {

    return safeString(
      firstValue(
        business,
        [
          "Description",
          "description",
          "About",
          "about",
          "Details",
          "details"
        ]
      )
    );

  }


  function getOwnerName(business) {

    return safeString(
      firstValue(
        business,
        [
          "OwnerName",
          "ownerName",
          "Owner",
          "owner",
          "Proprietor",
          "ContactPerson"
        ]
      )
    );

  }


  function getMobile(business) {

    return safeString(
      firstValue(
        business,
        [
          "Mobile",
          "mobile",
          "Phone",
          "phone",
          "Contact",
          "ContactNumber",
          "MobileNumber"
        ]
      )
    );

  }


  function getWhatsApp(business) {

    return safeString(
      firstValue(
        business,
        [
          "WhatsApp",
          "Whatsapp",
          "whatsapp",
          "WhatsAppNumber",
          "WhatsappNumber"
        ]
      )
    );

  }


  function getEmail(business) {

    return safeString(
      firstValue(
        business,
        [
          "Email",
          "email",
          "EmailAddress"
        ]
      )
    );

  }


  function getAddress(business) {

    return safeString(
      firstValue(
        business,
        [
          "Address",
          "address",
          "FullAddress",
          "Location",
          "location"
        ]
      )
    );

  }


  function getArea(business) {

    return safeString(
      firstValue(
        business,
        [
          "Area",
          "area",
          "Locality",
          "locality",
          "Mohalla",
          "Mouza"
        ]
      )
    );

  }


  function getDistrict(business) {

    return safeString(
      firstValue(
        business,
        [
          "DistrictName",
          "districtName",
          "District",
          "district"
        ]
      )
    );

  }


  function getPincode(business) {

    return safeString(
      firstValue(
        business,
        [
          "Pincode",
          "PIN",
          "PinCode",
          "PostalCode"
        ]
      )
    );

  }


  function getImage(business) {

    return safeString(
      firstValue(
        business,
        [
          "ImageUrl",
          "ImageURL",
          "imageUrl",
          "Image",
          "image",
          "Logo",
          "logo",
          "Photo",
          "photo"
        ]
      )
    );

  }


  function getRating(business) {

    var value =
      firstValue(
        business,
        [
          "Rating",
          "rating",
          "AverageRating",
          "averageRating"
        ]
      );

    var number =
      parseFloat(value);

    if (
      !isFinite(number)
    ) {

      return 0;

    }

    return Math.max(
      0,
      Math.min(
        5,
        number
      )
    );

  }


  function getReviews(business) {

    var value =
      firstValue(
        business,
        [
          "Reviews",
          "ReviewCount",
          "reviews",
          "reviewCount"
        ]
      );

    var number =
      parseInt(
        value,
        10
      );

    if (
      !isFinite(number)
    ) {

      return 0;

    }

    return Math.max(
      0,
      number
    );

  }


  /* =======================================================
     URL HELPERS
     ======================================================= */

  function cleanPhone(value) {

    return safeString(value)
      .replace(/[^\d+]/g, "");

  }


  function getTelUrl(phone) {

    var clean =
      cleanPhone(phone);

    if (!clean) {

      return "";

    }

    return "tel:" + clean;

  }


  function getWhatsAppUrl(phone) {

    var clean =
      cleanPhone(phone);

    clean =
      clean.replace(
        /^\+/,
        ""
      );

    if (!clean) {

      return "";

    }

    return "https://wa.me/" + clean;

  }


  function isValidHttpUrl(url) {

    var value =
      safeString(url);

    if (!value) {

      return false;

    }

    try {

      var parsed =
        new URL(
          value,
          window.location.href
        );

      return (
        parsed.protocol === "http:" ||
        parsed.protocol === "https:"
      );

    } catch (error) {

      return false;

    }

  }


  /* =======================================================
     MODAL BODY LOCK
     ======================================================= */

  function lockBody() {

    try {

      document.body.classList.add(
        BODY_LOCK_CLASS
      );

    } catch (error) {

      /* Ignore */

    }

  }


  function unlockBody() {

    try {

      document.body.classList.remove(
        BODY_LOCK_CLASS
      );

    } catch (error) {

      /* Ignore */

    }

  }


  /* =======================================================
     GENERIC MODAL CONTROL
     ======================================================= */

  function showModal(element) {

    if (!element) {

      return false;

    }

    element.hidden =
      false;

    element.setAttribute(
      "aria-hidden",
      "false"
    );

    element.classList.add(
      MODAL_OPEN_CLASS
    );

    lockBody();

    return true;

  }


  function hideModal(element) {

    if (!element) {

      return false;

    }

    element.classList.remove(
      MODAL_OPEN_CLASS
    );

    element.setAttribute(
      "aria-hidden",
      "true"
    );

    element.hidden =
      true;

    unlockBody();

    return true;

  }


  function isModalOpen(element) {

    if (!element) {

      return false;

    }

    return (
      !element.hidden &&
      element.classList.contains(
        MODAL_OPEN_CLASS
      )
    );

  }


  /* =======================================================
     BUSINESS IMAGE FALLBACK
     ======================================================= */

  function getFallbackImage() {

    return (
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">' +
        '<rect width="800" height="500" fill="#f1f5f9"/>' +
        '<circle cx="400" cy="190" r="70" fill="#cbd5e1"/>' +
        '<rect x="230" y="290" width="340" height="30" rx="15" fill="#cbd5e1"/>' +
        '<rect x="290" y="340" width="220" height="22" rx="11" fill="#e2e8f0"/>' +
        '</svg>'
      )
    );

  }


  /* =======================================================
     BUSINESS DETAILS HTML
     ======================================================= */

  function createBusinessModalHTML(business) {

    if (!business) {

      return (
        '<div class="ubnux-modal-error">' +
          '<div class="ubnux-modal-error-icon">!</div>' +
          '<h3>Business not found</h3>' +
          '<p>This business is no longer available.</p>' +
        '</div>'
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

    var description =
      getDescription(
        business
      );

    var owner =
      getOwnerName(
        business
      );

    var mobile =
      getMobile(
        business
      );

    var whatsapp =
      getWhatsApp(
        business
      ) || mobile;

    var email =
      getEmail(
        business
      );

    var address =
      getAddress(
        business
      );

    var area =
      getArea(
        business
      );

    var district =
      getDistrict(
        business
      );

    var pincode =
      getPincode(
        business
      );

    var image =
      getImage(
        business
      );

    var rating =
      getRating(
        business
      );

    var reviews =
      getReviews(
        business
      );


    if (
      !image ||
      !isValidHttpUrl(image)
    ) {

      image =
        getFallbackImage();

    }


    var telUrl =
      getTelUrl(
        mobile
      );

    var whatsappUrl =
      getWhatsAppUrl(
        whatsapp
      );


    var locationText =
      [
        area,
        district,
        pincode
      ]
      .filter(function (item) {

        return !!item;

      })
      .join(", ");


    var ratingHTML =
      "";

    if (rating > 0) {

      ratingHTML =
        '<div class="ubnux-business-rating">' +
          '<span class="ubnux-rating-star">★</span>' +
          '<strong>' +
            escapeHTML(
              rating.toFixed(1)
            ) +
          '</strong>' +
          (
            reviews > 0
              ? '<span class="ubnux-review-count">(' +
                  escapeHTML(
                    String(reviews)
                  ) +
                ' reviews)</span>'
              : ""
          ) +
        '</div>';

    }


    var actionsHTML =
      "";


    if (telUrl) {

      actionsHTML +=
        '<a ' +
          'class="ubnux-modal-action ubnux-call-action" ' +
          'href="' +
            escapeHTML(
              telUrl
            ) +
          '">' +
          '<span class="ubnux-action-icon">☎</span>' +
          '<span>Call</span>' +
        '</a>';

    }


    if (whatsappUrl) {

      actionsHTML +=
        '<a ' +
          'class="ubnux-modal-action ubnux-whatsapp-action" ' +
          'href="' +
            escapeHTML(
              whatsappUrl
            ) +
          '" ' +
          'target="_blank" ' +
          'rel="noopener noreferrer">' +
          '<span class="ubnux-action-icon">◉</span>' +
          '<span>WhatsApp</span>' +
        '</a>';

    }


    actionsHTML +=
      '<button ' +
        'type="button" ' +
        'class="ubnux-modal-action ubnux-enquiry-action" ' +
        'data-action="enquiry">' +
        '<span class="ubnux-action-icon">✉</span>' +
        '<span>Send Enquiry</span>' +
      '</button>';


    var infoHTML =
      "";


    if (owner) {

      infoHTML +=
        '<div class="ubnux-detail-row">' +
          '<span class="ubnux-detail-label">Owner</span>' +
          '<span class="ubnux-detail-value">' +
            escapeHTML(
              owner
            ) +
          '</span>' +
        '</div>';

    }


    if (locationText) {

      infoHTML +=
        '<div class="ubnux-detail-row">' +
          '<span class="ubnux-detail-label">Location</span>' +
          '<span class="ubnux-detail-value">' +
            escapeHTML(
              locationText
            ) +
          '</span>' +
        '</div>';

    }


    if (address) {

      infoHTML +=
        '<div class="ubnux-detail-row">' +
          '<span class="ubnux-detail-label">Address</span>' +
          '<span class="ubnux-detail-value">' +
            escapeHTML(
              address
            ) +
          '</span>' +
        '</div>';

    }


    if (email) {

      infoHTML +=
        '<div class="ubnux-detail-row">' +
          '<span class="ubnux-detail-label">Email</span>' +
          '<span class="ubnux-detail-value">' +
            '<a href="mailto:' +
              escapeHTML(
                email
              ) +
            '">' +
              escapeHTML(
                email
              ) +
            '</a>' +
          '</span>' +
        '</div>';

    }


    if (mobile) {

      infoHTML +=
        '<div class="ubnux-detail-row">' +
          '<span class="ubnux-detail-label">Mobile</span>' +
          '<span class="ubnux-detail-value">' +
            escapeHTML(
              mobile
            ) +
          '</span>' +
        '</div>';

    }


    return (
      '<article class="ubnux-business-detail">' +

        '<div class="ubnux-business-detail-image-wrap">' +

          '<img ' +
            'class="ubnux-business-detail-image" ' +
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
            'onerror="this.onerror=null;this.src=\'' +
              getFallbackImage()
                .replace(/'/g, "\\'")
            + '\';">' +

        '</div>' +


        '<div class="ubnux-business-detail-content">' +

          '<div class="ubnux-business-detail-header">' +

            (
              category
                ? '<div class="ubnux-business-category">' +
                    escapeHTML(
                      category
                    ) +
                  '</div>'
                : ""
            ) +

            '<h2 class="ubnux-business-detail-name">' +
              escapeHTML(
                name
              ) +
            '</h2>' +

            ratingHTML +

          '</div>' +


          (
            description
              ? '<div class="ubnux-business-description">' +
                  '<h3>About this business</h3>' +
                  '<p>' +
                    escapeHTML(
                      description
                    ) +
                  '</p>' +
                '</div>'
              : ""
          ) +


          (
            infoHTML
              ? '<div class="ubnux-business-details">' +
                  infoHTML +
                '</div>'
              : ""
          ) +


          '<div class="ubnux-business-actions">' +
            actionsHTML +
          '</div>' +

        '</div>' +

      '</article>'
    );

  }


  /* =======================================================
     BUSINESS MODAL
     ======================================================= */

  function openBusinessModal(business) {

    var modal =
      getElement(
        "businessModal"
      );

    var content =
      getElement(
        "businessModalContent"
      );


    if (!modal || !content) {

      return false;

    }


    if (!business) {

      var businessId =
        safeString(
          arguments[0]
        );


      if (
        businessId &&
        App.businesses &&
        typeof App.businesses.findBusinessById ===
          "function"
      ) {

        business =
          App.businesses.findBusinessById(
            businessId
          );

      }


      if (
        !business &&
        typeof App.findBusinessById ===
          "function"
      ) {

        business =
          App.findBusinessById(
            businessId
          );

      }

    }


    if (!business) {

      showToast(
        "Business not found.",
        "error"
      );

      return false;

    }


    try {

      if (
        typeof App.setSelectedBusiness ===
          "function"
      ) {

        App.setSelectedBusiness(
          business
        );

      } else {

        App.selectedBusiness =
          business;

      }

    } catch (error) {

      App.selectedBusiness =
        business;

    }


    content.innerHTML =
      createBusinessModalHTML(
        business
      );


    showModal(
      modal
    );


    bindBusinessModalActions(
      business
    );


    return true;

  }


  function bindBusinessModalActions(business) {

    var modal =
      getElement(
        "businessModal"
      );

    if (!modal) {

      return;

    }


    var enquiryButton =
      modal.querySelector(
        '[data-action="enquiry"]'
      );


    if (
      enquiryButton
    ) {

      enquiryButton.addEventListener(
        "click",
        function () {

          openEnquiryModal(
            business
          );

        }
      );

    }

  }


  function closeBusinessModal() {

    var modal =
      getElement(
        "businessModal"
      );

    if (!modal) {

      return false;

    }

    hideModal(
      modal
    );

    return true;

  }


  /* =======================================================
     ENQUIRY MODAL
     ======================================================= */

  function resetEnquiryForm() {

    var form =
      getElement(
        "enquiryForm"
      );

    if (
      form &&
      typeof form.reset ===
        "function"
    ) {

      form.reset();

    }


    var businessId =
      getElement(
        "enquiryBusinessId"
      );

    if (businessId) {

      businessId.value =
        "";

    }


    var message =
      getElement(
        "enquiryMessage"
      );

    if (message) {

      message.textContent =
        "";

      message.hidden =
        true;

    }


    var button =
      getElement(
        "submitEnquiryButton"
      );

    if (button) {

      button.disabled =
        false;

      button.dataset.loading =
        "false";

      button.innerHTML =
        "Send Enquiry";

    }

  }


  function setEnquiryMessage(
    text,
    type
  ) {

    var element =
      getElement(
        "enquiryMessage"
      );

    if (!element) {

      return;

    }


    var value =
      safeString(
        text
      );


    element.textContent =
      value;

    element.hidden =
      !value;


    element.classList.remove(
      "success",
      "error",
      "warning",
      "info"
    );


    if (type) {

      element.classList.add(
        type
      );

    }

  }


  function openEnquiryModal(
    business
  ) {

    var modal =
      getElement(
        "enquiryModal"
      );

    if (!modal) {

      return false;

    }


    if (!business) {

      if (
        typeof App.getSelectedBusiness ===
          "function"
      ) {

        business =
          App.getSelectedBusiness();

      } else {

        business =
          App.selectedBusiness;

      }

    }


    if (!business) {

      showToast(
        "Please select a business first.",
        "error"
      );

      return false;

    }


    var businessName =
      getBusinessName(
        business
      );

    var businessId =
      getBusinessId(
        business
      );


    var nameElement =
      getElement(
        "enquiryBusinessName"
      );

    if (nameElement) {

      nameElement.textContent =
        businessName;

    }


    var idElement =
      getElement(
        "enquiryBusinessId"
      );

    if (idElement) {

      idElement.value =
        businessId;

    }


    resetEnquiryForm();


    if (idElement) {

      idElement.value =
        businessId;

    }


    if (nameElement) {

      nameElement.textContent =
        businessName;

    }


    setEnquiryMessage(
      "",
      ""
    );


    showModal(
      modal
    );


    setTimeout(
      function () {

        var input =
          getElement(
            "enquiryName"
          );

        if (input) {

          try {

            input.focus();

          } catch (error) {

            /* Ignore */

          }

        }

      },
      50
    );


    return true;

  }


  function closeEnquiryModal() {

    var modal =
      getElement(
        "enquiryModal"
      );

    if (!modal) {

      return false;

    }


    hideModal(
      modal
    );


    return true;

  }


  /* =======================================================
     VALIDATION
     ======================================================= */

  function validateEnquiry() {

    var name =
      getElement(
        "enquiryName"
      );

    var mobile =
      getElement(
        "enquiryMobile"
      );

    var message =
      getElement(
        "enquiryMessageInput"
      );


    var businessId =
      getElement(
        "enquiryBusinessId"
      );


    var nameValue =
      safeString(
        name &&
        name.value
      );

    var mobileValue =
      safeString(
        mobile &&
        mobile.value
      );

    var messageValue =
      safeString(
        message &&
        message.value
      );

    var businessIdValue =
      safeString(
        businessId &&
        businessId.value
      );


    if (!businessIdValue) {

      return {
        valid: false,
        message:
          "Business information is missing."
      };

    }


    if (
      nameValue.length < 2
    ) {

      return {
        valid: false,
        message:
          "Please enter your name."
      };

    }


    var digits =
      mobileValue.replace(
        /\D/g,
        ""
      );


    if (
      digits.length < 10 ||
      digits.length > 15
    ) {

      return {
        valid: false,
        message:
          "Please enter a valid mobile number."
      };

    }


    if (
      messageValue.length < 3
    ) {

      return {
        valid: false,
        message:
          "Please enter your enquiry."
      };

    }


    if (
      messageValue.length > 2000
    ) {

      return {
        valid: false,
        message:
          "Enquiry message is too long."
      };

    }


    return {
      valid: true,
      data: {
        businessId:
          businessIdValue,
        name:
          nameValue,
        mobile:
          mobileValue,
        message:
          messageValue
      }
    };

  }


  /* =======================================================
     ENQUIRY BUTTON STATE
     ======================================================= */

  function setEnquirySubmitLoading(
    loading
  ) {

    var button =
      getElement(
        "submitEnquiryButton"
      );

    if (!button) {

      return;

    }


    if (loading) {

      if (
        !button.dataset.originalText
      ) {

        button.dataset.originalText =
          button.textContent ||
          "Send Enquiry";

      }


      button.disabled =
        true;

      button.dataset.loading =
        "true";

      button.innerHTML =
        '<span class="ubnux-button-spinner" ' +
          'aria-hidden="true"></span>' +
        '<span>Sending...</span>';

    } else {

      button.disabled =
        false;

      button.dataset.loading =
        "false";

      button.innerHTML =
        button.dataset.originalText ||
        "Send Enquiry";

    }

  }


  /* =======================================================
     ENQUIRY API
     ======================================================= */

  async function submitEnquiry() {

    var validation =
      validateEnquiry();


    if (!validation.valid) {

      setEnquiryMessage(
        validation.message,
        "error"
      );

      showToast(
        validation.message,
        "error"
      );

      return false;

    }


    var data =
      validation.data;


    setEnquirySubmitLoading(
      true
    );

    setEnquiryMessage(
      "",
      ""
    );


    try {

      var result =
        null;


      if (
        App.api &&
        typeof App.api.submitEnquiry ===
          "function"
      ) {

        result =
          await App.api.submitEnquiry(
            data
          );

      } else if (
        typeof App.submitEnquiry ===
          "function"
      ) {

        result =
          await App.submitEnquiry(
            data
          );

      } else {

        throw new Error(
          "Enquiry service is not available."
        );

      }


      if (
        result &&
        result.success === false
      ) {

        throw new Error(
          safeString(
            result.message
          ) ||
          "Unable to submit enquiry."
        );

      }


      setEnquiryMessage(
        (
          result &&
          result.message
        ) ||
        "Your enquiry has been submitted successfully.",
        "success"
      );


      showToast(
        (
          result &&
          result.message
        ) ||
        "Enquiry submitted successfully.",
        "success"
      );


      var form =
        getElement(
          "enquiryForm"
        );


      if (form) {

        Array.prototype.forEach.call(
          form.querySelectorAll(
            "input, textarea, select"
          ),
          function (field) {

            if (
              field.id ===
              "enquiryBusinessId"
            ) {

              return;

            }

            field.disabled =
              true;

          }
        );

      }


      var button =
        getElement(
          "submitEnquiryButton"
        );

      if (button) {

        button.disabled =
          true;

        button.dataset.loading =
          "false";

        button.innerHTML =
          "Enquiry Sent ✓";

      }


      setTimeout(
        function () {

          closeEnquiryModal();

        },
        1400
      );


      return true;

    } catch (error) {

      var errorMessage =
        safeString(
          error &&
          error.message
        ) ||
        "Unable to submit enquiry. Please try again.";


      setEnquiryMessage(
        errorMessage,
        "error"
      );


      showToast(
        errorMessage,
        "error"
      );


      return false;

    } finally {

      var form =
        getElement(
          "enquiryForm"
        );


      if (
        form &&
        !form.querySelector(
          "#submitEnquiryButton[disabled]"
        )
      ) {

        Array.prototype.forEach.call(
          form.querySelectorAll(
            "input, textarea, select"
          ),
          function (field) {

            field.disabled =
              false;

          }
        );

      }


      var button =
        getElement(
          "submitEnquiryButton"
        );


      if (
        button &&
        button.innerHTML !==
          "Enquiry Sent ✓"
      ) {

        setEnquirySubmitLoading(
          false
        );

      }

    }

  }


  /* =======================================================
     TOAST
     ======================================================= */

  var toastTimer =
    null;


  function showToast(
    message,
    type,
    duration
  ) {

    var toast =
      getElement(
        "toast"
      );

    var toastIcon =
      getElement(
        "toastIcon"
      );

    var toastMessage =
      getElement(
        "toastMessage"
      );


    var text =
      safeString(
        message
      );


    if (!text) {

      return false;

    }


    if (!toast) {

      try {

        console.log(
          "[UBnux Toast]",
          text
        );

      } catch (error) {

        /* Ignore */

      }

      return false;

    }


    type =
      safeString(
        type
      )
      .toLowerCase() ||
      "info";


    duration =
      parseInt(
        duration,
        10
      );


    if (
      !isFinite(duration) ||
      duration < 1000
    ) {

      duration =
        3500;

    }


    if (toastMessage) {

      toastMessage.textContent =
        text;

    }


    if (toastIcon) {

      var icon =
        "ℹ";

      if (
        type ===
        "success"
      ) {

        icon =
          "✓";

      } else if (
        type ===
        "error"
      ) {

        icon =
          "✕";

      } else if (
        type ===
        "warning"
      ) {

        icon =
          "⚠";

      }

      toastIcon.textContent =
        icon;

    }


    toast.classList.remove(
      "success",
      "error",
      "warning",
      "info",
      "show"
    );


    toast.classList.add(
      type
    );


    toast.hidden =
      false;

    toast.setAttribute(
      "aria-hidden",
      "false"
    );


    requestAnimationFrame(
      function () {

        toast.classList.add(
          "show"
        );

      }
    );


    if (toastTimer) {

      clearTimeout(
        toastTimer
      );

    }


    toastTimer =
      setTimeout(
        function () {

          hideToast();

        },
        duration
      );


    return true;

  }


  function hideToast() {

    var toast =
      getElement(
        "toast"
      );

    if (!toast) {

      return;

    }


    toast.classList.remove(
      "show"
    );


    toast.setAttribute(
      "aria-hidden",
      "true"
    );


    setTimeout(
      function () {

        if (
          !toast.classList.contains(
            "show"
          )
        ) {

          toast.hidden =
            true;

        }

      },
      250
    );


    if (toastTimer) {

      clearTimeout(
        toastTimer
      );

      toastTimer =
        null;

    }

  }


  /* =======================================================
     CLOSE ALL MODALS
     ======================================================= */

  function closeAllModals() {

    closeBusinessModal();

    closeEnquiryModal();

  }


  /* =======================================================
     BACKDROP DETECTION
     ======================================================= */

  function isBackdropClick(
    event,
    modal
  ) {

    if (
      !event ||
      !modal
    ) {

      return false;

    }

    return (
      event.target ===
      modal
    );

  }


  /* =======================================================
     EVENT LISTENERS
     ======================================================= */

  function setupBusinessModalEvents() {

    var modal =
      getElement(
        "businessModal"
      );

    var closeButton =
      getElement(
        "closeBusinessModal"
      );


    if (closeButton) {

      closeButton.addEventListener(
        "click",
        function (event) {

          event.preventDefault();

          closeBusinessModal();

        }
      );

    }


    if (modal) {

      modal.addEventListener(
        "click",
        function (event) {

          if (
            isBackdropClick(
              event,
              modal
            )
          ) {

            closeBusinessModal();

          }

        }
      );

    }

  }


  function setupEnquiryModalEvents() {

    var modal =
      getElement(
        "enquiryModal"
      );

    var closeButton =
      getElement(
        "closeEnquiryModal"
      );

    var form =
      getElement(
        "enquiryForm"
      );


    if (closeButton) {

      closeButton.addEventListener(
        "click",
        function (event) {

          event.preventDefault();

          closeEnquiryModal();

        }
      );

    }


    if (modal) {

      modal.addEventListener(
        "click",
        function (event) {

          if (
            isBackdropClick(
              event,
              modal
            )
          ) {

            closeEnquiryModal();

          }

        }
      );

    }


    if (form) {

      form.addEventListener(
        "submit",
        function (event) {

          event.preventDefault();

          submitEnquiry();

        }
      );

    }

  }


  function setupToastEvents() {

    var toast =
      getElement(
        "toast"
      );


    if (!toast) {

      return;

    }


    toast.addEventListener(
      "click",
      function (event) {

        if (
          event.target ===
          toast
        ) {

          hideToast();

        }

      }
    );

  }


  function setupEscapeKey() {

    document.addEventListener(
      "keydown",
      function (event) {

        if (
          event.key !==
          "Escape"
        ) {

          return;

        }


        var enquiryModal =
          getElement(
            "enquiryModal"
          );


        if (
          isModalOpen(
            enquiryModal
          )
        ) {

          closeEnquiryModal();

          return;

        }


        var businessModal =
          getElement(
            "businessModal"
          );


        if (
          isModalOpen(
            businessModal
          )
        ) {

          closeBusinessModal();

        }

      }
    );

  }


  /* =======================================================
     FOCUS MANAGEMENT
     ======================================================= */

  var previousFocusedElement =
    null;


  function rememberFocus() {

    try {

      previousFocusedElement =
        document.activeElement;

    } catch (error) {

      previousFocusedElement =
        null;

    }

  }


  function restoreFocus() {

    var element =
      previousFocusedElement;


    if (
      !element ||
      typeof element.focus !==
        "function"
    ) {

      return;

    }


    try {

      element.focus();

    } catch (error) {

      /* Ignore */

    }


    previousFocusedElement =
      null;

  }


  /* =======================================================
     WRAPPED MODAL OPEN FUNCTIONS
     ======================================================= */

  var originalOpenBusinessModal =
    openBusinessModal;


  function openBusinessModalWithFocus(
    business
  ) {

    rememberFocus();

    return originalOpenBusinessModal(
      business
    );

  }


  var originalCloseBusinessModal =
    closeBusinessModal;


  function closeBusinessModalWithFocus() {

    var result =
      originalCloseBusinessModal();

    restoreFocus();

    return result;

  }


  var originalOpenEnquiryModal =
    openEnquiryModal;


  function openEnquiryModalWithFocus(
    business
  ) {

    rememberFocus();

    return originalOpenEnquiryModal(
      business
    );

  }


  var originalCloseEnquiryModal =
    closeEnquiryModal;


  function closeEnquiryModalWithFocus() {

    var result =
      originalCloseEnquiryModal();

    restoreFocus();

    return result;

  }


  /* =======================================================
     INITIALIZATION
     ======================================================= */

  function initialize() {

    setupBusinessModalEvents();

    setupEnquiryModalEvents();

    setupToastEvents();

    setupEscapeKey();


    var businessModal =
      getElement(
        "businessModal"
      );

    if (businessModal) {

      businessModal.setAttribute(
        "aria-hidden",
        businessModal.hidden
          ? "true"
          : "false"
      );

    }


    var enquiryModal =
      getElement(
        "enquiryModal"
      );

    if (enquiryModal) {

      enquiryModal.setAttribute(
        "aria-hidden",
        enquiryModal.hidden
          ? "true"
          : "false"
      );

    }


    var toast =
      getElement(
        "toast"
      );

    if (toast) {

      toast.setAttribute(
        "aria-hidden",
        toast.hidden
          ? "true"
          : "false"
      );

    }

  }


  /* =======================================================
     PUBLIC API
     ======================================================= */

  App.modal = {

    openBusinessModal:
      openBusinessModalWithFocus,

    closeBusinessModal:
      closeBusinessModalWithFocus,

    openEnquiryModal:
      openEnquiryModalWithFocus,

    closeEnquiryModal:
      closeEnquiryModalWithFocus,

    submitEnquiry:
      submitEnquiry,

    validateEnquiry:
      validateEnquiry,

    resetEnquiryForm:
      resetEnquiryForm,

    showToast:
      showToast,

    hideToast:
      hideToast,

    closeAll:
      closeAllModals,

    isModalOpen:
      isModalOpen,

    createBusinessModalHTML:
      createBusinessModalHTML

  };


  /* =======================================================
     TOP-LEVEL COMPATIBILITY ALIASES
     ======================================================= */

  App.openBusinessModal =
    openBusinessModalWithFocus;

  App.closeBusinessModal =
    closeBusinessModalWithFocus;

  App.openEnquiryModal =
    openEnquiryModalWithFocus;

  App.closeEnquiryModal =
    closeEnquiryModalWithFocus;

  App.submitEnquiry =
    submitEnquiry;

  App.showToast =
    showToast;

  App.hideToast =
    hideToast;

  App.closeAllModals =
    closeAllModals;


  /* =======================================================
     LEGACY / ZILABIZ COMPATIBILITY
     ======================================================= */

  App.openBusiness =
    App.openBusiness ||
    openBusinessModalWithFocus;

  App.openEnquiry =
    App.openEnquiry ||
    openEnquiryModalWithFocus;


  /* =======================================================
     READY FLAG
     ======================================================= */

  App.modalReady =
    true;


  /* =======================================================
     INITIALIZE
     ======================================================= */

  initialize();


})(window, document);
