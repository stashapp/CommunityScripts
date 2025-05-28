(function () {
  'use strict';

  function addRandomButton() {
    const existingButton = document.querySelector('.random-btn');
    if (existingButton) {
      const styles = window.getComputedStyle(existingButton);
      return true;
    }

    const navContainer = document.querySelector('.navbar-buttons.flex-row.ml-auto.order-xl-2.navbar-nav');
    if (!navContainer) {
      return false;
    }

    const randomButtonContainer = document.createElement('div');
    randomButtonContainer.className = 'mr-2';
    randomButtonContainer.innerHTML = `
    <a href="javascript:void(0)">
      <button type="button" class="btn btn-primary random-btn" style="display: inline-block !important; visibility: visible !important;">Random</button>
    </a>
  `;
    randomButtonContainer.querySelector('button').addEventListener('click', loadRandomContent);


    if (window.location.pathname.match(/^\/(scenes|images)(?:$|\?)/)) {
      let refButton = document.querySelector('a[href="/scenes/new"]'); 
      if (window.location.pathname.includes('/images')) {
        refButton = document.querySelector('a[href="/stats"]');
      }
      if (!refButton) {
        refButton = navContainer.querySelector('a[href="https://opencollective.com/stashapp"]');
      }
      if (refButton) {
        refButton.parentElement.insertAdjacentElement('afterend', randomButtonContainer);
      } else {
        navContainer.appendChild(randomButtonContainer);
      }
      return true;
    }

    if (window.location.pathname.match(/\/(scenes|images)\/\d+/)) {
      const refButton = navContainer.querySelector('a[href="https://opencollective.com/stashapp"]'); 
      if (refButton) {
        refButton.insertAdjacentElement('afterend', randomButtonContainer);
      } else {
        const firstLink = navContainer.querySelector('a');
        if (firstLink) {
          firstLink.parentElement.insertAdjacentElement('afterend', randomButtonContainer);
        } else {
          navContainer.appendChild(randomButtonContainer);
        }
      }
      return true;
    }

    return false;
  }

  function getParentHierarchy(element) {
    const hierarchy = [];
    let current = element;
    while (current && current !== document.body) {
      hierarchy.push(current.tagName + (current.className ? '.' + current.className.split(' ').join('.') : ''));
      current = current.parentElement;
    }
    return hierarchy.join(' > ');
  }

  async function loadRandomContent() {
    try {
      const isScenes = window.location.pathname.includes('/scenes');
      const isImages = window.location.pathname.includes('/images');
      const type = isScenes ? 'scenes' : isImages ? 'images' : 'scenes';

      const countQuery = `
        query Find${type.charAt(0).toUpperCase() + type.slice(1)}($filter: FindFilterType) {
          find${type.charAt(0).toUpperCase() + type.slice(1)}(filter: $filter) {
            count
          }
        }
      `;
      const countVariables = { filter: { per_page: 1 } };

      const countResponse = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: countQuery, variables: countVariables })
      });

      const countResult = await countResponse.json();
      if (countResult.errors) {
        return;
      }

      const totalCount = countResult.data[`find${type.charAt(0).toUpperCase() + type.slice(1)}`].count;
      if (totalCount === 0) {
        return;
      }

      const randomIndex = Math.floor(Math.random() * totalCount);
      const itemQuery = `
        query Find${type.charAt(0).toUpperCase() + type.slice(1)}($filter: FindFilterType) {
          find${type.charAt(0).toUpperCase() + type.slice(1)}(filter: $filter) {
            ${type} {
              id
            }
          }
        }
      `;
      const itemVariables = {
        filter: { per_page: 1, page: Math.floor(randomIndex / 1) + 1 }
      };

      const itemResponse = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: itemQuery, variables: itemVariables })
      });

      const itemResult = await itemResponse.json();
      if (itemResult.errors) {
        return;
      }

      const items = itemResult.data[`find${type.charAt(0).toUpperCase() + type.slice(1)}`][type];
      if (items.length === 0) {
        return;
      }

      const itemId = items[0].id;
      window.location.href = `/${type}/${itemId}`;
    } catch (error) {
      console.error(error);
    }
  }

  window.addEventListener('load', () => {
    addRandomButton();
  });

  document.addEventListener('click', (event) => {
    const target = event.target.closest('a');
    if (target && target.href) {
      setTimeout(() => {
        addRandomButton();
      }, 1500);
    }
  });

  window.addEventListener('popstate', () => {
    setTimeout(() => {
      addRandomButton();
    }, 1500);
  });

  window.addEventListener('hashchange', () => {
    setTimeout(() => {
      addRandomButton();
    }, 1500);
  });

  const navContainer = document.querySelector('.navbar-buttons.flex-row.ml-auto.order-xl-2.navbar-nav');
  if (navContainer) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(m => {
      });
      if (!document.querySelector('.random-btn')) {
        addRandomButton();
      }
    });
    observer.observe(navContainer, { childList: true, subtree: true });
  } else {
  }


  let intervalAttempts = 0;
  setInterval(() => {
    intervalAttempts++;
    addRandomButton();
  }, intervalAttempts < 60 ? 500 : 2000);
})();
