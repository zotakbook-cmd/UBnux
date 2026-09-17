 /* =========================================================
    UBnux - Category Manager
    File: assets/js/categories.js

    Responsibilities:
    - Load / read categories from state
    - Category dropdown
    - Category grid
    - Category count
    - Category selection
    - Category filtering
    - Category search support
    - Active category state
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


  /* =======================================================
     DOM HELPERS
     ======================================================= */

  function $(id) {

    return document.getElementById(id);

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
     CATEGORY ID
     ======================================================= */

  function getCategoryId(
    category
  ) {

    if (
      typeof category === "string" ||
      typeof category === "number"
    ) {

      return String(
        category
      ).trim();

    }


    return text(
      category,
      [
        "CategoryID",
        "CategoryId",
        "categoryId",
        "categoryID",
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
     CATEGORY NAME
     ======================================================= */

  function getCategoryName(
    category
  ) {

    if (
      typeof category === "string" ||
      typeof category === "number"
    ) {

      return String(
        category
      ).trim();

    }


    return text(
      category,
      [
        "CategoryName",
        "Category Name",
        "categoryName",
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
     CATEGORY ICON
     ======================================================= */

  function getCategoryIcon(
    category
  ) {

    return text(
      category,
      [
        "Icon",
        "icon",
        "IconClass",
        "iconClass",
        "CategoryIcon",
        "categoryIcon",
        "FontAwesome",
        "fontAwesome"
      ],
      "fa-solid fa-store"
    );

  }


  /* =======================================================
     CATEGORY IMAGE
     ======================================================= */

  function getCategoryImage(
    category
  ) {

    return text(
      category,
      [
        "Image",
        "image",
        "ImageURL",
        "imageURL",
        "IconURL",
        "iconURL",
        "CategoryImage",
        "categoryImage",
        "Photo",
        "photo"
      ],
      ""
    );

  }


  /* =======================================================
     CATEGORY DESCRIPTION
     ======================================================= */

  function getCategoryDescription(
    category
  ) {

    return text(
      category,
      [
        "Description",
        "description",
        "CategoryDescription",
        "categoryDescription",
        "About",
        "about"
      ],
      ""
    );

  }


  /* =======================================================
     CATEGORY COUNT
     ======================================================= */

  function getCategoryBusinessCount(
    category
  ) {

    var value =
      getField(
        category,
        [
          "BusinessCount",
          "businessCount",
          "BusinessesCount",
          "businessesCount",
          "Count",
          "count",
          "TotalBusinesses",
          "totalBusinesses"
        ]
      );


    var count =
      Number(
        String(
          value || ""
        ).replace(
          /,/g,
          ""
        )
      );


    if (
      Number.isFinite(count)
    ) {

      return count;

    }


    return null;

  }


  /* =======================================================
     GET CATEGORIES FROM STATE
     ======================================================= */

  function getCategories() {

    if (
      typeof App.getCategories ===
      "function"
    ) {

      var categories =
        App.getCategories();


      if (
        Array.isArray(
          categories
        )
      ) {

        return categories;

      }

    }


    if (
      App.state &&
      typeof App.state.getCategories ===
      "function"
    ) {

      var stateCategories =
        App.state.getCategories();


      if (
        Array.isArray(
          stateCategories
        )
      ) {

        return stateCategories;

      }

    }


    if (
      Array.isArray(
        App.categories
      )
    ) {

      return App.categories;

    }


    return [];

  }


  /* =======================================================
     NORMALIZE CATEGORY
     ======================================================= */

  function normalizeCategory(
    category
  ) {

    if (
      typeof category === "string" ||
      typeof category === "number"
    ) {

      var simple =
        String(
          category
        ).trim();


      return {

        id:
          simple,

        name:
          simple,

        icon:
          "fa-solid fa-store",

        image:
          "",

        description:
          "",

        count:
          null,

        raw:
          category

      };

    }


    category =
      category || {};


    return {

      id:
        getCategoryId(
          category
        ),

      name:
        getCategoryName(
          category
        ),

      icon:
        getCategoryIcon(
          category
        ),

      image:
        getCategoryImage(
          category
        ),

      description:
        getCategoryDescription(
          category
        ),

      count:
        getCategoryBusinessCount(
          category
        ),

      raw:
        category

    };

  }


  /* =======================================================
     NORMALIZE ALL CATEGORIES
     ======================================================= */

  function normalizeCategories(
    categories
  ) {

    if (
      !Array.isArray(
        categories
      )
    ) {

      return [];

    }


    var result = [];


    categories.forEach(
      function (
        category
      ) {

        var normalized =
          normalizeCategory(
            category
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
     FIND CATEGORY
     ======================================================= */

  function findCategory(
    value
  ) {

    var categories =
      normalizeCategories(
        getCategories()
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
      i < categories.length;
      i++
    ) {

      var category =
        categories[i];


      if (
        String(
          category.id
        ).toLowerCase() ===
        wanted
      ) {

        return category;

      }


      if (
        String(
          category.name
        ).toLowerCase() ===
        wanted
      ) {

        return category;

      }

    }


    return null;

  }


  /* =======================================================
     CATEGORY DISPLAY NAME
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

      return "All Categories";

    }


    var category =
      findCategory(
        value
      );


    if (
      category
    ) {

      return category.name;

    }


    return String(
      value
    );

  }


  /* =======================================================
     CATEGORY VALUE
     ======================================================= */

  function getCategoryValue(
    category
  ) {

    var normalized =
      normalizeCategory(
        category
      );


    return (
      normalized.id ||
      normalized.name ||
      ""
    );

  }


  /* =======================================================
     SET CATEGORY
     ======================================================= */

  function setCategory(
    value
  ) {

    var categoryValue =
      String(
        value || ALL_VALUE
      ).trim();


    if (
      typeof App.setCategory ===
      "function"
    ) {

      App.setCategory(
        categoryValue
      );

      return true;

    }


    if (
      App.state &&
      typeof App.state.setCategory ===
      "function"
    ) {

      App.state.setCategory(
        categoryValue
      );

      return true;

    }


    App.category =
      categoryValue;


    return true;

  }


  /* =======================================================
     GET SELECTED CATEGORY
     ======================================================= */

  function getSelectedCategory() {

    if (
      typeof App.getCategory ===
      "function"
    ) {

      return (
        App.getCategory() ||
        ALL_VALUE
      );

    }


    if (
      App.state &&
      typeof App.state.getCategory ===
      "function"
    ) {

      return (
        App.state.getCategory() ||
        ALL_VALUE
      );

    }


    return (
      App.category ||
      ALL_VALUE
    );

  }


  /* =======================================================
     CATEGORY ICON FALLBACK
     ======================================================= */

  function getIconHTML(
    category
  ) {

    if (
      category.image
    ) {

      return (
        '<img ' +
        'class="category-card-image" ' +
        'src="' +
        escapeHTML(
          category.image
        ) +
        '" ' +
        'alt="" ' +
        'loading="lazy" ' +
        'onerror="' +
        "this.style.display='none';" +
        "this.nextElementSibling.style.display='flex';" +
        '" />' +

        '<span ' +
        'class="category-card-icon category-card-icon-fallback" ' +
        'style="display:none;" ' +
        'aria-hidden="true">' +
        '<i class="' +
        escapeHTML(
          category.icon
        ) +
        '"></i>' +
        "</span>"
      );

    }


    return (
      '<span ' +
      'class="category-card-icon" ' +
      'aria-hidden="true">' +
      '<i class="' +
      escapeHTML(
        category.icon
      ) +
      '"></i>' +
      "</span>"
    );

  }


  /* =======================================================
     CREATE CATEGORY CARD
     ======================================================= */

  function createCategoryCard(
    category,
    index
  ) {

    var normalized =
      normalizeCategory(
        category
      );


    var value =
      getCategoryValue(
        normalized
      );


    var name =
      normalized.name ||
      "Category";


    var selected =
      String(
        getSelectedCategory()
      ).toLowerCase() ===
      String(
        value
      ).toLowerCase();


    var count =
      normalized.count;


    var description =
      normalized.description;


    var card =
      document.createElement(
        "button"
      );


    card.type =
      "button";


    card.className =
      "category-card ubnux-category-card";


    if (
      selected
    ) {

      card.classList.add(
        "active",
        "selected"
      );

    }


    card.setAttribute(
      "data-category",
      value
    );


    card.setAttribute(
      "data-category-id",
      value
    );


    card.setAttribute(
      "data-index",
      String(
        index || 0
      )
    );


    card.setAttribute(
      "aria-label",
      "Browse " +
      name
    );


    card.setAttribute(
      "aria-pressed",
      selected
        ? "true"
        : "false"
    );


    card.innerHTML =

      '<div class="category-card-icon-wrap">' +

        getIconHTML(
          normalized
        ) +

      "</div>" +

      '<div class="category-card-content">' +

        '<span class="category-card-name">' +
        escapeHTML(
          name
        ) +
        "</span>" +

        (
          description
            ? '<span class="category-card-description">' +
              escapeHTML(
                description
              ) +
              "</span>"
            : ""
        ) +

        (
          count !== null
            ? '<span class="category-card-count">' +
              escapeHTML(
                count
              ) +
              (
                count === 1
                  ? " business"
                  : " businesses"
              ) +
              "</span>"
            : ""
        ) +

      "</div>";


    card.addEventListener(
      "click",
      function () {

        selectCategory(
          value
        );

      }
    );


    return card;

  }


  /* =======================================================
     SELECT CATEGORY
     ======================================================= */

  function selectCategory(
    value
  ) {

    var categoryValue =
      String(
        value || ALL_VALUE
      ).trim();


    setCategory(
      categoryValue
    );


    syncCategorySelect(
      categoryValue
    );


    renderCategoryGrid();


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
      App.businesses &&
      typeof App.businesses.renderCurrentPage ===
      "function"
    ) {

      if (
        typeof App.resetPagination ===
        "function"
      ) {

        App.resetPagination();

      }


      App.businesses.renderCurrentPage();

    } else if (
      typeof App.renderCurrentPage ===
      "function"
    ) {

      App.renderCurrentPage();

    }


    updateCategoryCount();


    return true;

  }


  /* =======================================================
     CATEGORY SELECT
     ======================================================= */

  function syncCategorySelect(
    value
  ) {

    var select =
      $("categoryFilter");


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
     POPULATE CATEGORY SELECT
     ======================================================= */

  function populateCategorySelect() {

    var select =
      $("categoryFilter");


    if (
      !select
    ) {

      return false;

    }


    var categories =
      normalizeCategories(
        getCategories()
      );


    var selected =
      getSelectedCategory();


    var fragment =
      document.createDocumentFragment();


    var allOption =
      document.createElement(
        "option"
      );


    allOption.value =
      ALL_VALUE;


    allOption.textContent =
      "All Categories";


    fragment.appendChild(
      allOption
    );


    categories.forEach(
      function (
        category
      ) {

        var option =
          document.createElement(
            "option"
          );


        option.value =
          category.id ||
          category.name;


        option.textContent =
          category.name ||
          category.id;


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


    syncCategorySelect(
      selected
    );


    return true;

  }


  /* =======================================================
     RENDER CATEGORY GRID
     ======================================================= */

  function renderCategoryGrid(
    categories
  ) {

    var grid =
      $("categoriesGrid");


    if (
      !grid
    ) {

      return false;

    }


    if (
      categories === undefined
    ) {

      categories =
        getCategories();

    }


    categories =
      normalizeCategories(
        categories
      );


    grid.innerHTML =
      "";


    if (
      categories.length === 0
    ) {

      updateCategoryCount(
        0
      );


      return true;

    }


    var fragment =
      document.createDocumentFragment();


    categories.forEach(
      function (
        category,
        index
      ) {

        fragment.appendChild(
          createCategoryCard(
            category,
            index
          )
        );

      }
    );


    grid.appendChild(
      fragment
    );


    updateCategoryCount(
      categories.length
    );


    return true;

  }


  /* =======================================================
     CATEGORY COUNT
     ======================================================= */

  function updateCategoryCount(
    count
  ) {

    var element =
      $("categoryCount");


    if (
      !element
    ) {

      return;

    }


    if (
      count === undefined
    ) {

      count =
        normalizeCategories(
          getCategories()
        ).length;

    }


    count =
      Number(
        count
      ) || 0;


    element.textContent =
      count +
      (
        count === 1
          ? " category"
          : " categories"
      );

  }


  /* =======================================================
     REFRESH
     ======================================================= */

  function refresh() {

    populateCategorySelect();

    renderCategoryGrid();

    updateCategoryCount();


    return true;

  }


  /* =======================================================
     FILTER CATEGORY
     ======================================================= */

  function filterByCategory(
    value
  ) {

    return selectCategory(
      value
    );

  }


  /* =======================================================
     RESET CATEGORY
     ======================================================= */

  function resetCategory() {

    return selectCategory(
      ALL_VALUE
    );

  }


  /* =======================================================
     SEARCH CATEGORIES
     ======================================================= */

  function searchCategories(
    query
  ) {

    var value =
      String(
        query || ""
      )
        .trim()
        .toLowerCase();


    var categories =
      normalizeCategories(
        getCategories()
      );


    if (
      !value
    ) {

      renderCategoryGrid(
        categories
      );

      return categories;

    }


    var filtered =
      categories.filter(
        function (
          category
        ) {

          var searchable =
            [
              category.id,
              category.name,
              category.description
            ]
              .join(" ")
              .toLowerCase();


          return searchable.indexOf(
            value
          ) !== -1;

        }
      );


    renderCategoryGrid(
      filtered
    );


    return filtered;

  }


  /* =======================================================
     UPDATE ACTIVE CATEGORY
     ======================================================= */

  function updateActiveCategory() {

    var selected =
      String(
        getSelectedCategory()
      ).toLowerCase();


    var cards =
      qsa(
        "#categoriesGrid [data-category]"
      );


    cards.forEach(
      function (
        card
      ) {

        var value =
          String(
            card.getAttribute(
              "data-category"
            ) || ""
          ).toLowerCase();


        var active =
          value ===
          selected;


        card.classList.toggle(
          "active",
          active
        );


        card.classList.toggle(
          "selected",
          active
        );


        card.setAttribute(
          "aria-pressed",
          active
            ? "true"
            : "false"
        );

      }
    );

  }


  /* =======================================================
     SETUP CATEGORY SELECT
     ======================================================= */

  function setupCategorySelect() {

    var select =
      $("categoryFilter");


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

        selectCategory(
          select.value ||
          ALL_VALUE
        );

      }
    );

  }


  /* =======================================================
     SETUP CATEGORY GRID
     ======================================================= */

  function setupCategoryGrid() {

    var grid =
      $("categoriesGrid");


    if (
      !grid
    ) {

      return;

    }


    if (
      grid.dataset.ubnuxBound ===
      "true"
    ) {

      return;

    }


    grid.dataset.ubnuxBound =
      "true";


    grid.addEventListener(
      "keydown",
      function (
        event
      ) {

        if (
          event.key !== "Enter" &&
          event.key !== " "
        ) {

          return;

        }


        var card =
          event.target.closest(
            "[data-category]"
          );


        if (
          !card
        ) {

          return;

        }


        event.preventDefault();


        selectCategory(
          card.getAttribute(
            "data-category"
          )
        );

      }
    );

  }


  /* =======================================================
     INITIALIZE
     ======================================================= */

  function init() {

    setupCategorySelect();

    setupCategoryGrid();

    refresh();


    return true;

  }


  /* =======================================================
     PUBLIC API
     ======================================================= */

  App.categories = {

    getCategories:

      getCategories,

    getCategoryId:

      getCategoryId,

    getCategoryName:

      getCategoryName,

    getCategoryIcon:

      getCategoryIcon,

    getCategoryImage:

      getCategoryImage,

    getCategoryDescription:

      getCategoryDescription,

    getCategoryBusinessCount:

      getCategoryBusinessCount,

    normalizeCategory:

      normalizeCategory,

    normalizeCategories:

      normalizeCategories,

    findCategory:

      findCategory,

    getDisplayName:

      getDisplayName,

    getCategoryValue:

      getCategoryValue,

    getSelectedCategory:

      getSelectedCategory,

    setCategory:

      setCategory,

    selectCategory:

      selectCategory,

    filterByCategory:

      filterByCategory,

    resetCategory:

      resetCategory,

    populateCategorySelect:

      populateCategorySelect,

    renderCategoryGrid:

      renderCategoryGrid,

    updateCategoryCount:

      updateCategoryCount,

    updateActiveCategory:

      updateActiveCategory,

    searchCategories:

      searchCategories,

    refresh:

      refresh,

    init:

      init

  };


  /* =======================================================
     TOP-LEVEL COMPATIBILITY
     ======================================================= */

  if (
    typeof App.renderCategories !==
    "function"
  ) {

    App.renderCategories =
      renderCategoryGrid;

  }


  if (
    typeof App.refreshCategories !==
    "function"
  ) {

    App.refreshCategories =
      refresh;

  }


  if (
    typeof App.selectCategory !==
    "function"
  ) {

    App.selectCategory =
      selectCategory;

  }


  if (
    typeof App.filterByCategory !==
    "function"
  ) {

    App.filterByCategory =
      filterByCategory;

  }


  if (
    typeof App.getCategoryName !==
    "function"
  ) {

    App.getCategoryName =
      getCategoryName;

  }


  if (
    typeof App.getCategoryDisplayName !==
    "function"
  ) {

    App.getCategoryDisplayName =
      getDisplayName;

  }


  /* =======================================================
     INITIALIZE
     ======================================================= */

  init();


  /* =======================================================
     READY FLAG
     ======================================================= */

  App.categoriesReady =
    true;


  window.ZilaBiz =
    App;

  window.UBnux =
    App;


})(window, document);