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
    },
    galleries: {
      cardSelector: 'div.gallery-card',
      headerSelector: 'a.gallery-card-header',
      urlPattern: '/galleries/',
      graphqlFilter: 'galleries',
      imageClass: 'gallery-card-image'
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
    tagGalleries: `
      query GetTagGalleriesForThumbnail($entityId: ID!) {
        findGalleries(gallery_filter: { tags: { value: [$entityId], modifier: INCLUDES_ALL } }) {
          galleries {
            id
            cover {
              paths {
                thumbnail
              }
            }
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
    `,
    galleryCover: `
      query GalleryCover($entityId: ID!) {
        findGallery(id: $entityId) {
          cover {
            paths {
              thumbnail
            }
          }
        }
      }
    `,
    galleryImages: `
      query GalleryImagesForThumbnail($entityId: ID!) {
        findImages(image_filter: { galleries: { value: [$entityId], modifier: INCLUDES_ALL } }) {
          images {
            id
            paths {
              thumbnail
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
      
      // Styling for smooth overlay transition
      videoElement.style.transition = 'opacity 0.3s ease-in-out';
      videoElement.style.opacity = '0';
      videoElement.style.display = 'none';
      videoElement.style.position = 'absolute';
      videoElement.style.top = '0';
      videoElement.style.left = '0';
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.style.objectFit = 'cover';
      videoElement.style.zIndex = '1';
      
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
      
      // Make sure image is visible and in layout
      if (this.existingImage) {
        this.existingImage.style.display = '';
        this.existingImage.style.opacity = '1';
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
            this.existingImage.style.opacity = '1';
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
        // Galleries: use the gallery's cover image (or a random gallery image) as the thumbnail
        if (this.entityType === 'galleries') {
          try {
            const coverResponse = await csLib.callGQL({
              query: QUERIES.galleryCover,
              variables: { entityId: this.entityId }
            });
            
            const coverUrl = coverResponse?.findGallery?.cover?.paths?.thumbnail;
            if (coverUrl) {
              this.randomSceneThumbnailUrl = coverUrl;
              this.existingImage.src = coverUrl;
              this.isFetching = false;
              return;
            }
            
            const imagesResponse = await csLib.callGQL({
              query: QUERIES.galleryImages,
              variables: { entityId: this.entityId }
            });
            
            const imageUrls = imagesResponse?.findImages?.images
              ?.map(image => image?.paths?.thumbnail)
              ?.filter(url => url) || [];
              
            if (imageUrls.length > 0) {
              const shuffledImages = helpers.shuffleArray([...imageUrls]);
              this.randomSceneThumbnailUrl = shuffledImages[0];
              this.existingImage.src = this.randomSceneThumbnailUrl;
              this.isFetching = false;
              return;
            }
          } catch (error) {
            // Fall through to default behaviour if gallery queries fail
          }
          
          this.isFetching = false;
          return;
        }
        
        let query;
        if (this.entityType === 'tags') {
          query = QUERIES.tagScreenshots;
        } else {
          query = QUERIES.entityRandomThumbnail.replace('FILTER_PLACEHOLDER', this.config.graphqlFilter);
        }
        
        const response = await csLib.callGQL({ query, variables: { entityId: this.entityId } });
        let candidateUrls = helpers.extractScreenshots(response, this.entityType);
        
        if (this.entityType === 'tags') {
          try {
            // Get performers with images for this tag
            const performersWithImagesResponse = await csLib.callGQL({ 
              query: QUERIES.tagPerformersWithImages, 
              variables: { entityId: this.entityId } 
            });
            
            const performers = performersWithImagesResponse?.findPerformers?.performers || [];
            const performerIds = performers.map(p => p.id);
            
            // Add non-default performer images to the candidate pool
            const performerImagePaths = performers
              .map(p => p.image_path)
              .filter(path => path && !path.includes('?default=true'));
            candidateUrls = [...candidateUrls, ...performerImagePaths];
            
            // Add performer scene screenshots to the candidate pool
            if (performerIds.length > 0) {
              const performerScenesResponse = await csLib.callGQL({ 
                query: QUERIES.performerScreenshots, 
                variables: { performerIds } 
              });
              
              const performerSceneScreenshots = performerScenesResponse?.findScenes?.scenes
                ?.map(scene => scene?.paths?.screenshot)
                ?.filter(url => url) || [];
              
              candidateUrls = [...candidateUrls, ...performerSceneScreenshots];
            }
            
            // Add gallery covers tagged with this tag to the candidate pool
            const galleriesResponse = await csLib.callGQL({
              query: QUERIES.tagGalleries,
              variables: { entityId: this.entityId }
            });
            
            const galleryCoverUrls = galleriesResponse?.findGalleries?.galleries
              ?.map(gallery => gallery?.cover?.paths?.thumbnail)
              ?.filter(url => url) || [];
              
            candidateUrls = [...candidateUrls, ...galleryCoverUrls];
          } catch (error) {
            // Continue with whatever candidates we already have
          }
        }
        
        if (candidateUrls.length > 0) {
          candidateUrls = helpers.shuffleArray(candidateUrls);
          this.randomSceneThumbnailUrl = candidateUrls[0];
          
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
      
      // Append video to the header link and make the link a positioning context
      const cardHeaderLink = this.cardElement.querySelector(this.config.headerSelector);
      if (cardHeaderLink) {
        cardHeaderLink.style.position = 'relative';
        cardHeaderLink.style.display = 'block';
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

        if (!this.videoElement) return;

        // Keep the image in layout as a placeholder so the card doesn't collapse
        if (this.existingImage) {
          this.existingImage.style.opacity = '0';
        }

        this.videoElement.style.display = '';
        this.videoElement.style.opacity = '1';

        if (this.isMouseLeaving) {
          this.videoElement.pause();
          this.videoElement.style.opacity = '0';
          if (this.existingImage) {
            this.existingImage.style.opacity = '1';
          }
          return;
        }

        const playAttemptTime = Date.now();
        this.lastPlayAttemptTime = playAttemptTime;

        this.videoElement.play().catch(e => {
          if (!(e.name === 'AbortError' && this.isMouseLeaving)) {
            console.warn("Video play failed after loadeddata:", e);
          }

          if (this.lastPlayAttemptTime === playAttemptTime && !this.hasSuccessfulVideo) {
            if (this.videoElement) {
              this.videoElement.style.display = 'none';
              this.videoElement.style.opacity = '0';
            }
            if (this.existingImage) {
              this.existingImage.style.opacity = '1';
            }
          }
        });
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

  // Process a single card for a given entity type
  const processCard = (cardElement, entityType) => {
    const currentConfig = CONFIG[entityType];
    if (!currentConfig) return;

    // Skip if already processed for this type
    if (cardElement.dataset[`${entityType}CardProcessed`]) return;
    cardElement.dataset[`${entityType}CardProcessed`] = "true";

    // Find the thumbnail section
    const thumbnailSection = cardElement.querySelector('div.thumbnail-section');
    if (!thumbnailSection) return;

    // Find the existing image thumbnail
    const imageClass = currentConfig.imageClass || `${entityType.slice(0, -1)}-card-image`;
    const existingImage = thumbnailSection.querySelector(`img.${imageClass}`) || thumbnailSection.querySelector('img');
    if (!existingImage) return;

    // Extract entity ID from the card
    const entityId = helpers.getEntityId(cardElement, currentConfig.urlPattern);
    if (!entityId) return;

    // Clean up any custom styles previously added
    helpers.cleanupCustomStyles(thumbnailSection, cardElement);

    // Create and initialize the video preview manager
    new VideoPreviewManager(cardElement, existingImage, entityType, entityId, currentConfig);
  };

  // Main function to handle thumbnail preview logic for all configured card types
  const handleThumbLogic = (containerElement) => {
    // Process existing cards of all types
    Object.keys(CONFIG).forEach(entityType => {
      containerElement.querySelectorAll(CONFIG[entityType].cardSelector).forEach(card => processCard(card, entityType));
    });

    // Use MutationObserver to process newly added cards
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            Object.keys(CONFIG).forEach(entityType => {
              const currentConfig = CONFIG[entityType];
              if (node.classList.contains(currentConfig.cardSelector.replace('div.', ''))) {
                processCard(node, entityType);
              } else {
                const cards = node.querySelectorAll(currentConfig.cardSelector);
                cards.forEach(card => processCard(card, entityType));
              }
            });
          }
        });
      });
    });

    observer.observe(containerElement, { childList: true, subtree: true });
  };

  // Set up path listeners for different entity pages
  ['studios', 'tags', 'performers', 'groups', 'galleries'].forEach(entityType => {
    csLib.PathElementListener(`/${entityType}`, "div.item-list-container", (containerElement) => {
      handleThumbLogic(containerElement);
    });
  });

})();
