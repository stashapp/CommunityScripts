(function() {
  'use strict';

  function getIdFromPath(regex) {
    let m = window.location.pathname.match(regex);
    return m ? m[1] : null;
  }

  function getPlural(entity) {
    return (entity === "Gallery") ? "Galleries"
      : (entity === "Tag") ? "Tags"
      : (entity === "Image") ? "Images"
      : (entity === "Scene") ? "Scenes"
      : (entity === "Performer") ? "Performers"
      : (entity === "Studio") ? "Studios"
      : (entity === "Group") ? "Groups"
      : entity + "s";
  }

  async function randomGlobal(entity, idField, redirectPrefix, internalFilter) {
    const realEntityPlural = getPlural(entity);
    let filter = { per_page: 1 };
    let variables = { filter };
    let filterArg = "";
    let filterVar = "";

    if (internalFilter) {
      filterArg = `, $internal_filter: ${entity}FilterType`;
      filterVar = `, ${entity.toLowerCase()}_filter: $internal_filter`;
      variables.internal_filter = internalFilter;
    }

    const countQuery = `
      query Find${realEntityPlural}($filter: FindFilterType${filterArg}) {
        find${realEntityPlural}(filter: $filter${filterVar}) { count }
      }
    `;
    let countResp = await fetch('/graphql', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: countQuery, variables })
    });
    let countData = await countResp.json();
    if (countData.errors) { alert("Error: " + JSON.stringify(countData.errors)); return; }
    const totalCount = countData.data[`find${realEntityPlural}`].count;
    if (!totalCount) { alert("No results found."); return; }

    const randomIndex = Math.floor(Math.random() * totalCount);
    let itemVars = { filter: { per_page: 1, page: randomIndex + 1 } };
    if (internalFilter) itemVars.internal_filter = internalFilter;
    const itemQuery = `
      query Find${realEntityPlural}($filter: FindFilterType${filterArg}) {
        find${realEntityPlural}(filter: $filter${filterVar}) { ${idField} { id } }
      }
    `;
    let itemResp = await fetch('/graphql', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: itemQuery, variables: itemVars })
    });
    let itemData = await itemResp.json();
    if (itemData.errors) { alert("Error: " + JSON.stringify(itemData.errors)); return; }
    const arr = itemData.data[`find${realEntityPlural}`][idField];
    if (!arr || arr.length === 0) { alert("No results found."); return; }
    window.location.href = `${redirectPrefix}${arr[0].id}`;
  }

  async function randomButtonHandler() {
    const pathname = window.location.pathname.replace(/\/$/, '');

    // GLOBAL
    if (pathname === '/scenes' || /^\/scenes\/\d+$/.test(pathname)) 
      return randomGlobal('Scene', 'scenes', '/scenes/');

    if (pathname === '/images' || /^\/images\/\d+$/.test(pathname)) 
      return randomGlobal('Image', 'images', '/images/');

    if (pathname === '/performers') 
      return randomGlobal('Performer', 'performers', '/performers/');

    if (pathname === '/studios') 
      return randomGlobal('Studio', 'studios', '/studios/');

    if (pathname === '/tags') 
      return randomGlobal('Tag', 'tags', '/tags/');

    if (pathname === '/groups') 
      return randomGlobal('Group', 'groups', '/groups/');

    if (pathname === '/galleries') 
      return randomGlobal('Gallery', 'galleries', '/galleries/');

    // Intern
    let studioId = getIdFromPath(/^\/studios\/(\d+)\/scenes/);
    if (studioId) 
      return randomGlobal('Scene', 'scenes', '/scenes/', { studios: { value: [studioId], modifier: "INCLUDES_ALL" } });

    let groupId = getIdFromPath(/^\/groups\/(\d+)\/scenes/);
    if (groupId) 
      return randomGlobal('Scene', 'scenes', '/scenes/', { groups: { value: [groupId], modifier: "INCLUDES_ALL" } });

    let performerId = getIdFromPath(/^\/performers\/(\d+)\/scenes/);
    if (performerId) 
      return randomGlobal('Scene', 'scenes', '/scenes/', { performers: { value: [performerId], modifier: "INCLUDES_ALL" } });

    let tagId = getIdFromPath(/^\/tags\/(\d+)\/scenes/);
    if (tagId) 
      return randomGlobal('Scene', 'scenes', '/scenes/', { tags: { value: [tagId], modifier: "INCLUDES_ALL" } });

    let galleryId = getIdFromPath(/^\/galleries\/(\d+)$/);
    if (galleryId)
      return randomGlobal('Image', 'images', '/images/', { galleries: { value: [galleryId], modifier: "INCLUDES_ALL" } });

    alert('Not supported');
  }

  function addRandomButton() {
    if (document.querySelector('.random-btn')) return;
    const navContainer = document.querySelector('.navbar-buttons.flex-row.ml-auto.order-xl-2.navbar-nav');
    if (!navContainer) return;

    const randomButtonContainer = document.createElement('div');
    randomButtonContainer.className = 'mr-2';
    randomButtonContainer.innerHTML = `
      <a href="javascript:void(0)">
        <button type="button" class="btn btn-primary random-btn" style="display: inline-block !important; visibility: visible !important;">Random</button>
      </a>
    `;
    randomButtonContainer.querySelector('button').addEventListener('click', randomButtonHandler);

    navContainer.appendChild(randomButtonContainer);
  }

  window.addEventListener('load', () => addRandomButton());
  document.addEventListener('click', (event) => {
    const target = event.target.closest('a');
    if (target && target.href) setTimeout(() => addRandomButton(), 1500);
  });
  window.addEventListener('popstate', () => setTimeout(() => addRandomButton(), 1500));
  window.addEventListener('hashchange', () => setTimeout(() => addRandomButton(), 1500));
  const navContainer = document.querySelector('.navbar-buttons.flex-row.ml-auto.order-xl-2.navbar-nav');
  if (navContainer) {
    const observer = new MutationObserver(() => {
      if (!document.querySelector('.random-btn')) addRandomButton();
    });
    observer.observe(navContainer, { childList: true, subtree: true });
  }
  let intervalAttempts = 0;
  setInterval(() => {
    intervalAttempts++;
    addRandomButton();
  }, intervalAttempts < 60 ? 500 : 2000);

})();
