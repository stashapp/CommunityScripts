"use strict";
(function () {
  const csLib = window.csLib;

  // Entity type configurations
  const CONFIG = {
    studios: {
      cardSelector: 'div.studio-card',
      headerSelector: 'a.studio-card-header',
      urlPattern: '/studios/',
      graphqlFilter: 'studios'
    },
    tags: {
      cardSelector: 'div.tag-card',
      headerSelector: 'a.tag-card-header',
      urlPattern: '/tags/',
      graphqlFilter: 'tags'
    },
    performers: {
      cardSelector: 'div.performer-card',
      headerSelector: 'div.thumbnail-section > a',
      urlPattern: '/performers/',
      graphqlFilter: 'performers'
    },
    groups: {
      cardSelector: 'div.group-card',
      headerSelector: 'a.group-card-header',
      urlPattern: '/groups/',
      graphqlFilter: 'groups'
    }
  };

  // GraphQL queries
  const QUERIES = {
    entityScenes: `
      query FindSceneForEntityThumbnail($entityId: ID!) {
        findScenes(scene_filter: { FILTER_PLACEHOLDER: { value: [$entityId], modifier: INCLUDES_ALL } }) {
          scenes {
            id
            paths {
              preview
            }
          }
        }
      }
    `,
    entityRandomThumbnail: `
      query FindRandomSceneForThumbnail($entityId: ID!) {
        findScenes(
          scene_filter: { FILTER_PLACEHOLDER: { value: [$entityId], modifier: INCLUDES_ALL } }
        ) {
          scenes {
            id
            paths {
              screenshot
            }
          }
          count
        }
      }
    `,
    tagScreenshots: `
      query FindRandomScreenshotForTagDefaultThumbnail($entityId: ID!) {
        findSceneMarkers(scene_marker_filter: { tags: { value: [$entityId], modifier: INCLUDES_ALL } }) {
          scene_markers {
            id
            screenshot
          }
        }
        findScenes(scene_filter: { tags: { value: [$entityId], modifier: INCLUDES_ALL } }) {
          scenes {
            id
            paths {
              screenshot
            }
          }
        }
      }
    `,
    tagPreviews: `
      query FindSceneMarkersAndScenesForTagThumbnail($entityId: ID!) {
        findSceneMarkers(scene_marker_filter: { tags: { value: [$entityId], modifier: INCLUDES_ALL } }) {
          scene_markers {
            id
            stream
            screenshot
            scene {
              id
            }
          }
        }
        findScenes(scene_filter: { tags: { value: [$entityId], modifier: INCLUDES_ALL } }) {
          scenes {
            id
            paths {
              preview
            }
          }
        }
      }
    `,
    tagPerformers: `
      query GetTagPerformersForPreview($entityId: ID!) {
        findPerformers(performer_filter: { tags: { value: [$entityId], modifier: INCLUDES_ALL } }) {
          performers {
            id
          }
        }
      }
    `,
    tagPerformersWithImages: `
      query GetTagPerformersWithImages($entityId: ID!) {
        findPerformers(performer_filter: { tags: { value: [$entityId], modifier: INCLUDES_ALL } }) {
          performers {
            id
            image_path
          }
        }
      }
    `,
    performerScenes: `
      query GetPerformerScenesForPreview($performerIds: [ID!]!) {
        findScenes(scene_filter: { performers: { value: $performerIds, modifier: INCLUDES } }) {
          scenes {
            id
            paths {
              preview
            }
          }
        }
      }
    `,
    performerScreenshots: `
      query GetPerformerScenesForScreenshot($performerIds: [ID!]!) {
        findScenes(scene_filter: { performers: { value: $performerIds, modifier: INCLUDES } }) {
          scenes {
            id
            paths {
              screenshot
            }
          }
        }
      }
    `
  };

  // Helper functions
  const helpers = {
    // Shuffle array using Fisher-Yates algorithm
    shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    },

    // Extract entity ID from card element
    getEntityId(cardElement, urlPattern) {
      let entityId = cardElement.dataset.entityId || 
                     cardElement.querySelector(`a[href^="${urlPattern}"]`)?.href.match(new RegExp(`${urlPattern.replace('/', '\\/')}([^\\/]+)`))?.[1];
      
      if (entityId) {
        const paramIndex = entityId.indexOf('?');
        if (paramIndex !== -1) {
          entityId = entityId.substring(0, paramIndex);
        }
      }
      
      return entityId;
    },

    // Check if image is a default thumbnail
    isDefaultThumbnail(imgElement) {
      try {
        const imageUrl = new URL(imgElement.src);
        return imageUrl.searchParams.get('default') === 'true';
      } catch (e) {
        return false;
      }
    },

    // Create video element from existing image
    createVideoElement(existingImage, previewUrl) {
      const videoElement = document.createElement('video');
      videoElement.src = `${previewUrl}?_ts=${Date.now()}`;
      videoElement.loop = false;
      videoElement.muted = true;
      videoElement.playsInline = true;
      
      // Copy classes from image to video
      videoElement.className = existingImage.className;
      
      // Styling for smooth transition
      videoElement.style.transition = 'opacity 0.3s ease-in-out';
      videoElement.style.opacity = '0';
      videoElement.style.display = 'none';
      
      return videoElement;
    },

    // Clean up any custom styles previously added
    cleanupCustomStyles(thumbnailSection, cardElement) {
      // Remove all custom CSS styles added previously
      thumbnailSection.style.position = '';
      thumbnailSection.style.width = '';
      thumbnailSection.style.paddingTop = '';
      thumbnailSection.style.overflow = '';
      
      const initialVideo = thumbnailSection.querySelector('video');
      if (initialVideo) {
        initialVideo.style.position = '';
        initialVideo.style.top = '';
        initialVideo.style.left = '';
        initialVideo.style.width = '';
        initialVideo.style.height = '';
        initialVideo.style.objectFit = '';
        initialVideo.style.zIndex = '';
        initialVideo.style.pointerEvents = '';
      }
      
      // Remove overlay container z-index
      const overlayContainer = cardElement.querySelector('.card-controls') || cardElement.querySelector('.card-popovers');
      if (overlayContainer) {
        overlayContainer.style.zIndex = '';
        overlayContainer.style.position = '';
      }
      
      // Remove favorite button z-index and positioning
      const favoriteButton = cardElement.querySelector('.favorite-button');
      if (favoriteButton) {
        favoriteButton.style.zIndex = '';
        favoriteButton.style.position = '';
        favoriteButton.style.top = '';
        favoriteButton.style.right = '';
      }
    },
    
    // Extract screenshots from API response
    extractScreenshots(response, entityType) {
      if (entityType === 'tags') {
        const markerScreenshots = response?.findSceneMarkers?.scene_markers
          ?.map(marker => marker?.screenshot)
          ?.filter(url => url) || [];
          
        const sceneScreenshots = response?.findScenes?.scenes
          ?.map(scene => scene?.paths?.screenshot)
          ?.filter(url => url) || [];
          
        return [...markerScreenshots, ...sceneScreenshots];
      } else {
        return response?.findScenes?.scenes
          ?.map(scene => scene?.paths?.screenshot)
          ?.filter(url => url) || [];
      }
    },
    
    // Extract preview URLs from API response
    extractPreviewUrls(response, entityType) {
      if (entityType === 'tags') {
        const markerUrls = response?.findSceneMarkers?.scene_markers
          ?.map(marker => marker?.stream)
          ?.filter(url => url) || [];
          
        const sceneUrls = response?.findScenes?.scenes
          ?.map(scene => scene?.paths?.preview)
          ?.filter(url => url) || [];
          
        return [...markerUrls, ...sceneUrls];
      } else {
        return response?.findScenes?.scenes
          ?.map(scene => scene?.paths?.preview)
          ?.filter(url => url) || [];
      }
    }
  };

  // Class to manage video previews
  class VideoPreviewManager {
    constructor(cardElement, existingImage, entityType, entityId, config) {
      this.cardElement = cardElement;
      this.existingImage = existingImage;
      this.entityType = entityType;
      this.entityId = entityId;
      this.config = config;
      
      this.defaultImageUrl = null;
      this.randomSceneThumbnailUrl = null;
      this.previewUrls = [];
      this.videoElement = null;
      this.isFetching = false;
      this.currentVideoIndex = 0;
      this.isMouseLeaving = false;
      this.hasSuccessfulVideo = false;
      this.lastPlayAttemptTime = 0;
      this.isPlaying = false;
      
      this.initialize();
    }
    
    initialize() {
      // Set up initial image styles
      this.existingImage.style.transition = 'opacity 0.3s ease-in-out';
      this.existingImage.style.opacity = '1';
      
      // Check if the existing image is the default thumbnail
      if (helpers.isDefaultThumbnail(this.existingImage)) {
        this.defaultImageUrl = this.existingImage.src;
        this.fetchRandomThumbnail();
      }
      
      // Add event listeners
      this.cardElement.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
      this.cardElement.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }
    
    async handleMouseEnter() {
      this.isMouseLeaving = false;
      
      // Remove existing video element if present
      if (this.videoElement) {
        if (this.videoElement.parentElement) {
          this.videoElement.parentElement.removeChild(this.videoElement);
        }
        this.videoElement = null;
      }
      
      // Fetch preview URLs if not already loaded
      if (!this.previewUrls.length && !this.isFetching) {
        await this.fetchPreviewUrls();
      }
      
      // Handle default thumbnail if needed
      if (this.defaultImageUrl && !this.randomSceneThumbnailUrl && !this.isFetching) {
        await this.fetchRandomThumbnail();
      }
      
      // Show video if we have preview URLs
      if (this.videoElement && this.previewUrls.length > 0) {
        this.existingImage.style.opacity = '0';
      } else if (this.previewUrls.length === 0) {
        this.existingImage.style.display = '';
        this.existingImage.style.opacity = '1';
      }
    }
    
    handleMouseLeave() {
      this.isMouseLeaving = true;
      this.previewUrls = [];
      this.hasSuccessfulVideo = false;
      this.isPlaying = false;
      
      if (this.videoElement) {
        try {
          // Only pause if the video is actually playing or has a play request pending
          if (!this.videoElement.paused || this.lastPlayAttemptTime > 0) {
            this.videoElement.pause();
          }
        } catch (e) {
          // Ignore any errors from pause
        }
        
        this.videoElement.style.opacity = '0';
        
        setTimeout(() => {
          if (this.videoElement && this.videoElement.parentElement) {
            this.videoElement.parentElement.removeChild(this.videoElement);
          }
          this.videoElement = null;
          
          if (this.existingImage) {
            this.existingImage.style.display = '';
            setTimeout(() => {
              if (this.existingImage) {
                this.existingImage.style.opacity = '1';
              }
            }, 10);
          }
        }, 300);
      } else if (this.existingImage) {
        this.existingImage.style.display = '';
        this.existingImage.style.opacity = '1';
      }
    }
    
    async fetchRandomThumbnail() {
      this.isFetching = true;
      
      try {
        let query;
        if (this.entityType === 'tags') {
          query = QUERIES.tagScreenshots;
        } else {
          query = QUERIES.entityRandomThumbnail.replace('FILTER_PLACEHOLDER', this.config.graphqlFilter);
        }
        
        const response = await csLib.callGQL({ query, variables: { entityId: this.entityId } });
        let screenshotUrls = helpers.extractScreenshots(response, this.entityType);
        
        // For tags, try to get performer images first if it's a default thumbnail
        if (this.entityType === 'tags') {
          try {
            // Get performers with images for this tag
            const performersWithImagesResponse = await csLib.callGQL({ 
              query: QUERIES.tagPerformersWithImages, 
              variables: { entityId: this.entityId } 
            });
            
            const performers = performersWithImagesResponse?.findPerformers?.performers || [];
            const performerIds = performers.map(p => p.id);
            
            // Extract performer image paths
            const performerImagePaths = performers
              .map(p => p.image_path)
              .filter(path => path && !path.includes('?default=true'));
              
            // If we found performer images and this is a default thumbnail, use them
            if (performerImagePaths.length > 0 && this.defaultImageUrl) {
              performerImagePaths.sort(() => Math.random() - 0.5); // Shuffle image paths
              this.randomSceneThumbnailUrl = performerImagePaths[0];
              
              if (this.randomSceneThumbnailUrl) {
                this.existingImage.src = this.randomSceneThumbnailUrl;
                this.isFetching = false;
                return; // Early return as we've found and used a performer image
              }
            }
            
            // If we have performers but no performer images (or all are default), try to get their scene screenshots
            if (performerIds.length > 0) {
              const performerScenesResponse = await csLib.callGQL({ 
                query: QUERIES.performerScreenshots, 
                variables: { performerIds } 
              });
              
              const performerSceneScreenshots = performerScenesResponse?.findScenes?.scenes
                ?.map(scene => scene?.paths?.screenshot)
                ?.filter(url => url) || [];
              
              // If we have performer scene screenshots and this is a default thumbnail with no content
              if (performerSceneScreenshots.length > 0 && this.defaultImageUrl && screenshotUrls.length === 0) {
                const shuffledScreenshots = helpers.shuffleArray([...performerSceneScreenshots]);
                this.randomSceneThumbnailUrl = shuffledScreenshots[0];
                
                if (this.randomSceneThumbnailUrl) {
                  this.existingImage.src = this.randomSceneThumbnailUrl;
                  this.isFetching = false;
                  return; // Early return as we've found and used a performer's scene screenshot
                }
              }
              
              // Add performer scene screenshots to the existing list
              screenshotUrls = [...screenshotUrls, ...performerSceneScreenshots];
            }
          } catch (error) {
            // Fallback to original screenshots if performer queries fail
          }
        }
        
        if (screenshotUrls.length > 0) {
          screenshotUrls = helpers.shuffleArray(screenshotUrls);
          this.randomSceneThumbnailUrl = screenshotUrls[0];
          
          if (this.randomSceneThumbnailUrl) {
            this.existingImage.src = this.randomSceneThumbnailUrl;
          }
        }
      } catch (error) {
        this.randomSceneThumbnailUrl = null;
      } finally {
        this.isFetching = false;
      }
    }
    
    async fetchPreviewUrls() {
      this.isFetching = true;
      
      try {
        let query;
        if (this.entityType === 'tags') {
          query = QUERIES.tagPreviews;
        } else {
          query = QUERIES.entityScenes.replace('FILTER_PLACEHOLDER', this.config.graphqlFilter);
        }
        
        const response = await csLib.callGQL({ query, variables: { entityId: this.entityId } });
        this.previewUrls = helpers.extractPreviewUrls(response, this.entityType);
        
        // For tags, also get performer scenes
        if (this.entityType === 'tags') {
          try {
            const performersResponse = await csLib.callGQL({ 
              query: QUERIES.tagPerformers, 
              variables: { entityId: this.entityId } 
            });
            
            const performerIds = performersResponse?.findPerformers?.performers?.map(p => p.id) || [];
            
            if (performerIds.length > 0) {
              const performerScenesResponse = await csLib.callGQL({ 
                query: QUERIES.performerScenes, 
                variables: { performerIds } 
              });
              
              const performerScenePreviews = performerScenesResponse?.findScenes?.scenes
                ?.map(scene => scene?.paths?.preview)
                ?.filter(url => url) || [];
              
              this.previewUrls = [...this.previewUrls, ...performerScenePreviews];
            }
          } catch (error) {
            // Continue with existing preview URLs if performer scenes query fails
          }
        }
        
        if (this.previewUrls.length > 0) {
          this.previewUrls = helpers.shuffleArray(this.previewUrls);
          this.createVideoElement();
        }
      } catch (error) {
        this.previewUrls = [];
      } finally {
        this.isFetching = false;
      }
    }
    
    createVideoElement() {
      if (this.previewUrls.length === 0) return;
      
      this.videoElement = helpers.createVideoElement(this.existingImage, this.previewUrls[0]);
      this.currentVideoIndex = 0;
      
      // Add event listeners to video element
      this.setupVideoEvents();
      
      // Append video to the header link
      const cardHeaderLink = this.cardElement.querySelector(this.config.headerSelector);
      if (cardHeaderLink) {
        cardHeaderLink.appendChild(this.videoElement);
      }
    }
    
    setupVideoEvents() {
      if (!this.videoElement) return;
      
      // Handle video ending event for sequential playback
      this.videoElement.addEventListener('ended', () => {
        if (!this.videoElement || this.isMouseLeaving) {
          return; // Bail out if videoElement was removed or mouse already left
        }
        
        this.videoElement.style.opacity = '0';
        
        setTimeout(() => {
          if (!this.videoElement || this.isMouseLeaving) {
            return; // Bail out if videoElement was removed during timeout or mouse left
          }
          
          this.currentVideoIndex = (this.currentVideoIndex + 1) % this.previewUrls.length;
          this.videoElement.src = `${this.previewUrls[this.currentVideoIndex]}?_ts=${Date.now()}`;
          this.videoElement.load();
          
          this.videoElement.style.opacity = '1';
          
          // Track that we're attempting to play
          const playAttemptTime = Date.now();
          this.lastPlayAttemptTime = playAttemptTime;
          
          this.videoElement.play().catch(e => {
            // Only log warning if it's not an abort error or if it's not due to quick mouse movements
            if (!(e.name === 'AbortError' && this.isMouseLeaving)) {
              console.warn("Video play failed after ended:", e);
            }
          });
        }, 300);
      });
      
      // Handle successful video loading
      this.videoElement.onloadeddata = () => {
        this.hasSuccessfulVideo = true;
        
        // Check if elements still exist before accessing their properties
        if (this.existingImage) {
          this.existingImage.style.display = 'none';
        }
        
        if (this.videoElement) {
          this.videoElement.style.display = '';
        } else {
          // Video element was removed, bail out
          return;
        }
        
        setTimeout(() => {
          // Re-check if elements still exist in the setTimeout callback
          if (this.isMouseLeaving) {
            if (this.videoElement) {
              this.videoElement.pause();
              this.videoElement.style.display = 'none';
              this.videoElement.style.opacity = '0';
            }
            
            if (this.existingImage) {
              this.existingImage.style.display = '';
              this.existingImage.style.opacity = '1';
            }
            return;
          }
          
          if (!this.videoElement) {
            // Video element no longer exists
            return;
          }
          
          this.videoElement.style.opacity = '1';
          
          // Check if user already moved the mouse out before trying to play
          if (!this.isMouseLeaving) {
            // Track that we're attempting to play
            const playAttemptTime = Date.now();
            this.lastPlayAttemptTime = playAttemptTime;
            
            this.videoElement.play().catch(e => {
              // Only log warning if it's not an abort error or if it's not due to quick mouse movements
              if (!(e.name === 'AbortError' && this.isMouseLeaving)) {
                console.warn("Video play failed after loadeddata:", e);
              }
              
              // Only handle errors if this is still the most recent play attempt
              if (this.lastPlayAttemptTime === playAttemptTime && !this.hasSuccessfulVideo) {
                if (this.videoElement) {
                  this.videoElement.style.display = 'none';
                  this.videoElement.style.opacity = '0';
                }
                
                if (this.existingImage) {
                  this.existingImage.style.display = '';
                  this.existingImage.style.opacity = '1';
                }
              }
            });
          }
        }, 50);
      };
      
      // Handle video loading errors
      this.videoElement.onerror = () => {
        this.currentVideoIndex++;
        
        if (!this.videoElement || this.isMouseLeaving) {
          return; // Bail out if videoElement was removed or mouse left
        }
        
        if (this.currentVideoIndex < this.previewUrls.length) {
          this.videoElement.src = `${this.previewUrls[this.currentVideoIndex]}?_ts=${Date.now()}`;
          this.videoElement.load();
          
          // Track that we're attempting to play
          const playAttemptTime = Date.now();
          this.lastPlayAttemptTime = playAttemptTime;
          
          this.videoElement.play().catch(e => {
            // Only log warning if it's not an abort error or if it's not due to quick mouse movements
            if (!(e.name === 'AbortError' && this.isMouseLeaving)) {
              console.warn("Video play failed after error:", e);
            }
          });
        } else {
          this.hasSuccessfulVideo = false;
          
          if (this.existingImage) {
            this.existingImage.style.display = '';
            this.existingImage.style.opacity = '1';
          }
          
          if (this.videoElement && this.videoElement.parentElement) {
            this.videoElement.style.opacity = '0';
            setTimeout(() => {
              if (this.videoElement && this.videoElement.parentElement) {
                this.videoElement.parentElement.removeChild(this.videoElement);
                this.videoElement = null;
              }
            }, 300);
          }
        }
      };
    }
  }

  // Main function to handle thumbnail preview logic
  const handleThumbLogic = async (containerElement, entityType) => {
    const currentConfig = CONFIG[entityType];
    if (!currentConfig) return;

    // Process a single card element
    const processCard = async (cardElement) => {
      // Skip if already processed
      if (cardElement.dataset[`${entityType}CardProcessed`]) return;
      cardElement.dataset[`${entityType}CardProcessed`] = "true";

      // Find the thumbnail section
      const thumbnailSection = cardElement.querySelector('div.thumbnail-section');
      if (!thumbnailSection) return;

      // Find the existing image thumbnail
      const existingImage = thumbnailSection.querySelector(`img.${entityType.slice(0, -1)}-card-image`) || thumbnailSection.querySelector('img');
      if (!existingImage) return;

      // Extract entity ID from the card
      const entityId = helpers.getEntityId(cardElement, currentConfig.urlPattern);
      if (!entityId) return;

      // Clean up any custom styles previously added
      helpers.cleanupCustomStyles(thumbnailSection, cardElement);

      // Create and initialize the video preview manager
      new VideoPreviewManager(cardElement, existingImage, entityType, entityId, currentConfig);
    };

    // Process existing cards
    containerElement.querySelectorAll(currentConfig.cardSelector).forEach(processCard);

    // Use MutationObserver to process newly added cards
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList.contains(currentConfig.cardSelector.replace('div.', ''))) {
              processCard(node);
            } else {
              const cards = node.querySelectorAll(currentConfig.cardSelector);
              cards.forEach(processCard);
            }
          }
        });
      });
    });

    // Observe the container element for added cards
    observer.observe(containerElement, { childList: true, subtree: true });
  };

  // Set up path listeners for different entity pages
  ['studios', 'tags', 'performers', 'groups'].forEach(entityType => {
    csLib.PathElementListener(`/${entityType}`, "div.item-list-container", (containerElement) => {
      handleThumbLogic(containerElement, entityType);
    });
  });

})();