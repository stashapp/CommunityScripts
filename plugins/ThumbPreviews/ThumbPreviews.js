"use strict";
(function () {
  const csLib = window.csLib;

  // Generic function to handle thumbnail preview logic for different entity types
  const handleThumbLogic = async (containerElement, entityType) => {
    // console.log(`PathElementListener triggered for /${entityType}. Found item-list-container:`, containerElement);

    // Configuration for different entity types
    const config = {
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

    const currentConfig = config[entityType];
    if (!currentConfig) {
      // console.error(`Unsupported entity type: ${entityType}`);
      return;
    }

    // Function to process a single card element
    const processCard = async (cardElement) => {
      // Check if this card has already been processed
      if (cardElement.dataset[`${entityType}CardProcessed`]) {
        // console.log(`${entityType} card already processed, skipping:`, cardElement);
        return;
      }
      // Mark this card as processed
      cardElement.dataset[`${entityType}CardProcessed`] = "true";

      // console.log(`processCard entered with element:`, cardElement);
      // console.log(`Processing ${entityType} card:`, cardElement);

      // Find the thumbnail section
      const thumbnailSection = cardElement.querySelector('div.thumbnail-section');
      if (!thumbnailSection) {
        // console.warn(`Thumbnail section not found for ${entityType} card:`, cardElement);
        return;
      }

      // Find the existing image thumbnail (assuming it has a specific class like .studio-card-image or is the only img)
      const existingImage = thumbnailSection.querySelector(`img.${entityType.slice(0, -1)}-card-image`) || thumbnailSection.querySelector('img');

      if (!existingImage) {
          // console.warn(`Existing image thumbnail not found for ${entityType} card:`, cardElement);
          return;
      }

      // console.log("Found existing image thumbnail:", existingImage);

      // Add initial styles for smooth transition
      existingImage.style.transition = 'opacity 0.3s ease-in-out'; // Added transition
      existingImage.style.opacity = '1'; // Ensure initial opacity is 1

      // Extract Entity ID from the card.
      const entityId = cardElement.dataset.entityId || cardElement.querySelector(`a[href^="${currentConfig.urlPattern}"]`)?.href.match(new RegExp(`${currentConfig.urlPattern.replace('/', '\\/')}([^\\/]+)`))?.[1];

      if (!entityId) {
        // console.warn(`${entityType} ID not found for card:`, cardElement);
        return;
      }

      // console.log(`Found ${entityType} ID:`, entityId);

      // Store state on the thumbnail section or card element
      let defaultImageUrl = null;
      let previewUrls = [];
      let videoElement = null;
      let isFetching = false; // Flag to prevent multiple fetch requests
      let currentVideoIndex = 0; // Added variable to track current video index
      let isMouseLeaving = false; // Added variable to track mouse leave state
      let hasSuccessfulVideo = false; // Flag to track if any video successfully loaded

      // Variable to store the random scene thumbnail URL for default thumbnails
      let randomSceneThumbnailUrl = null;

      // Check if the existing image is the default thumbnail
      try {
          const imageUrl = new URL(existingImage.src);
          if (imageUrl.searchParams.get('default') === 'true') {
              defaultImageUrl = existingImage.src;
              // console.log("Identified default thumbnail URL:", defaultImageUrl);
          }
      } catch (e) {
          // console.warn("Could not parse image URL to check for default param:", existingImage.src, e);
      }

      // If it's a default thumbnail, immediately fetch a random scene thumbnail and replace the image src
      if (defaultImageUrl) {
          // This fetching logic is similar to the mouseenter, but runs immediately for default thumbnails
          let randomQuery;
          
          if (entityType === 'tags') {
              // For tags, use scene markers
              randomQuery = `
                  query FindRandomSceneMarkerForThumbnail($entityId: ID!) {
                    findSceneMarkers(
                      scene_marker_filter: { tags: { value: [$entityId], modifier: INCLUDES_ALL } }
                    ) {
                      scene_markers {
                        id
                        screenshot
                      }
                    }
                  }
              `;
          } else {
              // For other entity types, use scenes
              randomQuery = `
                  query FindRandomSceneForThumbnail($entityId: ID!) {
                    findScenes(
                      scene_filter: { ${currentConfig.graphqlFilter}: { value: [$entityId], modifier: INCLUDES_ALL } }
                    ) {
                      scenes { # Fetch all scenes initially
                        id
                        paths {
                          screenshot # Also get screenshot path here
                        }
                      }
                      # Request total count to know if there are any scenes, though not strictly needed for this logic
                      count
                    }
                  }
              `;
          }

          csLib.callGQL({ query: randomQuery, variables: { entityId } }).then(response => {
              if (entityType === 'tags') {
                  const markers = response?.findSceneMarkers?.scene_markers;

                  if (markers && markers.length > 0) {
                      // Shuffle the array of markers
                      for (let i = markers.length - 1; i > 0; i--) {
                          const j = Math.floor(Math.random() * (i + 1));
                          [markers[i], markers[j]] = [markers[j], markers[i]]; // Swap elements
                      }
                      // console.log(`Shuffled markers for default thumbnail:`, markers);

                      // Get the preview from the first marker in the shuffled array
                      randomSceneThumbnailUrl = markers[0]?.screenshot;

                      if (randomSceneThumbnailUrl) {
                          // console.log(`Found random marker screenshot URL on load, replacing default:`, randomSceneThumbnailUrl);
                          // Replace the existing image thumbnail source
                          existingImage.src = randomSceneThumbnailUrl;
                      } else {
                          // console.log(`First shuffled marker has no screenshot path.`, entityId);
                      }
                  } else {
                      // console.log(`No random marker screenshot found on load for this ${entityType}, trying scenes as fallback.`, entityId);
                      
                      // Fallback to scenes for tags
                      const sceneFallbackQuery = `
                          query FindRandomSceneForTagThumbnailFallback($entityId: ID!) {
                            findScenes(
                              scene_filter: { tags: { value: [$entityId], modifier: INCLUDES_ALL } }
                            ) {
                              scenes {
                                id
                                paths {
                                  screenshot
                                }
                              }
                            }
                          }
                      `;
                      
                      csLib.callGQL({ query: sceneFallbackQuery, variables: { entityId } }).then(fallbackResponse => {
                          const scenes = fallbackResponse?.findScenes?.scenes;
                          
                          if (scenes && scenes.length > 0) {
                              // Shuffle the array of scenes
                              for (let i = scenes.length - 1; i > 0; i--) {
                                  const j = Math.floor(Math.random() * (i + 1));
                                  [scenes[i], scenes[j]] = [scenes[j], scenes[i]]; // Swap elements
                              }
                              // console.log(`Shuffled fallback scenes for default thumbnail:`, scenes);

                              // Get the screenshot from the first scene in the shuffled array
                              randomSceneThumbnailUrl = scenes[0]?.paths?.screenshot;

                              if (randomSceneThumbnailUrl) {
                                  // console.log(`Found random scene screenshot URL on load (fallback), replacing default:`, randomSceneThumbnailUrl);
                                  // Replace the existing image thumbnail source
                                  existingImage.src = randomSceneThumbnailUrl;
                              } else {
                                  // console.log(`First shuffled fallback scene has no screenshot path.`, entityId);
                              }
                          } else {
                              // console.log(`No fallback scenes found for tag ${entityId}.`);
                          }
                      }).catch(error => {
                          console.error("Error fetching fallback scene thumbnail on load:", error);
                      });
                  }
              } else {
                  const scenes = response?.findScenes?.scenes;

                  if (scenes && scenes.length > 0) {
                      // Shuffle the array of scenes
                      for (let i = scenes.length - 1; i > 0; i--) {
                          const j = Math.floor(Math.random() * (i + 1));
                          [scenes[i], scenes[j]] = [scenes[j], scenes[i]]; // Swap elements
                      }
                      // console.log(`Shuffled scenes for default thumbnail:`, scenes);

                      // Get the screenshot from the first scene in the shuffled array
                      randomSceneThumbnailUrl = scenes[0]?.paths?.screenshot;

                      if (randomSceneThumbnailUrl) {
                          // console.log(`Found random scene thumbnail URL on load, replacing default:`, randomSceneThumbnailUrl);
                          // Replace the existing image thumbnail source
                          existingImage.src = randomSceneThumbnailUrl;
                      } else {
                          // console.log(`First shuffled scene has no screenshot path.`, entityId);
                      }
                  } else {
                      // console.log(`No random scene thumbnail found on load for this ${entityType}.`, entityId);
                  }
              }
          }).catch(error => {
              // console.error("Error fetching random scene thumbnail on load:", error);
          });
      }

      // Add mouse enter/leave listeners to the thumbnail section
      cardElement.addEventListener('mouseenter', async () => {
          // console.log(`Mouse entered thumbnail section for ${entityType}:`, entityId);
          isMouseLeaving = false; // Reset flag on mouse enter

          // If a video element already exists from a previous hover, remove it
          if (videoElement) {
              // console.log(`Removing existing video element on mouse enter.`, entityId);
              if (videoElement.parentElement) {
                  videoElement.parentElement.removeChild(videoElement);
              }
              videoElement = null; // Clear the reference
          }

          // If video URL hasn't been fetched yet and not currently fetching
          if (!previewUrls.length && !isFetching) {
              isFetching = true;
              // console.log(`Fetching preview URLs for ${entityType}:`, entityId);
              
              let query, queryName, urlPath;
              
              if (entityType === 'tags') {
                  // For tags, get both scene markers and scenes
                  query = `
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
                  `;
                  queryName = 'combined';
                  urlPath = 'combined';
              } else {
                  // For other entity types, use scenes
                  query = `
                    query FindSceneForEntityThumbnail($entityId: ID!) {
                      findScenes(scene_filter: { ${currentConfig.graphqlFilter}: { value: [$entityId], modifier: INCLUDES_ALL } }) {
                        scenes {
                          id
                          paths {
                            preview
                          }
                        }
                      }
                    }
                  `;
                  queryName = 'findScenes';
                  urlPath = 'scenes';
              }

              try {
                const response = await csLib.callGQL({ query, variables: { entityId } });
                // console.log(`GraphQL Response for ${entityType} thumbnail on hover:`, response);
                
                if (entityType === 'tags') {
                    // Extract stream URLs from markers and preview URLs from scenes, combine them
                    const markerUrls = response?.findSceneMarkers?.scene_markers
                      ?.map(marker => marker?.stream)
                      ?.filter(url => url) || [];
                    
                    const sceneUrls = response?.findScenes?.scenes
                      ?.map(scene => scene?.paths?.preview)
                      ?.filter(url => url) || [];
                    
                    // Shuffle markers and scenes separately
                    // Shuffle marker URLs
                    for (let i = markerUrls.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [markerUrls[i], markerUrls[j]] = [markerUrls[j], markerUrls[i]];
                    }
                    
                    // Shuffle scene URLs
                    for (let i = sceneUrls.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [sceneUrls[i], sceneUrls[j]] = [sceneUrls[j], sceneUrls[i]];
                    }
                    
                    // Combine shuffled marker URLs first, then shuffled scene URLs
                    previewUrls = [...markerUrls, ...sceneUrls];
                    
                    // console.log(`Found ${markerUrls.length} marker streams and ${sceneUrls.length} scene previews for tag ${entityId}`);
                    // console.log("Shuffled markers first, then scenes:", previewUrls);
                      
                    // Remove the fallback logic since we're now getting both in one query
                } else {
                    // Extract preview URLs from the scenes for other entity types
                    previewUrls = response?.[queryName]?.[urlPath]
                      ?.map(scene => scene?.paths?.preview)
                      ?.filter(url => url);
                }

                if (previewUrls.length > 0) {
                  // For non-tags, shuffle the array of preview URLs
                  if (entityType !== 'tags') {
                      for (let i = previewUrls.length - 1; i > 0; i--) {
                          const j = Math.floor(Math.random() * (i + 1));
                          [previewUrls[i], previewUrls[j]] = [previewUrls[j], previewUrls[i]]; // Swap elements
                      }
                      // console.log("Shuffled preview URLs:", previewUrls);
                  }
                  // console.log("Found preview URLs on hover:", previewUrls);
                  // Create video element now that we have the URLs
                  videoElement = document.createElement('video');
                  currentVideoIndex = 0; // Start with the first video
                  videoElement.src = `${previewUrls[currentVideoIndex]}?_ts=${Date.now()}`; // Use the first URL
                  videoElement.loop = false; // Change loop to false to allow 'ended' event
                  videoElement.muted = true;
                  videoElement.playsInline = true;

                  // Add ended listener for sequential playback
                  videoElement.addEventListener('ended', () => {
                      // console.log(`Video ended, moving to next for ${entityType}:`, entityId);
                      
                      // Fade out the current video
                      videoElement.style.opacity = '0';

                      // Wait for the fade-out transition to complete before loading/playing the next video
                      setTimeout(() => {
                          currentVideoIndex = (currentVideoIndex + 1) % previewUrls.length; // Calculate next index, looping back
                          videoElement.src = `${previewUrls[currentVideoIndex]}?_ts=${Date.now()}`; // Set new source
                          videoElement.load(); // Load the new video
                          
                          // After loading, fade in and play the next video
                          videoElement.style.opacity = '1'; // Fade in the next video
                          videoElement.play().catch(e => console.warn("Video play failed after ended:", e)); // Play next video
                      }, 300); // Match the CSS transition duration (0.3s)
                  });

                  // Copy classes from the original image element to the video element
                  videoElement.className = existingImage.className;
                  // console.log("Copied classes from image to video:", videoElement.className);

                  // Styling for smooth transition (initially hidden and transparent)
                  videoElement.style.transition = 'opacity 0.3s ease-in-out'; // Added transition
                  videoElement.style.opacity = '0'; // Initially transparent
                  videoElement.style.display = 'none'; // Initially hidden

                  // Add load success handler to track successful video loads
                  videoElement.onloadeddata = () => {
                      // console.log(`Video successfully loaded: ${videoElement.src} for ${entityType}: ${entityId}`);
                      hasSuccessfulVideo = true; // Mark that at least one video was successful

                      // Now that video data is loaded, hide the image and show the video
                      existingImage.style.display = 'none';
                      videoElement.style.display = ''; // Show the video

                      // Start fading in the video after display is set
                       setTimeout(() => {
                          // Check if mouse has left the card during the timeout
                          if (isMouseLeaving) {
                              // console.log(`Mouse left during video display timeout, reverting to image.`, entityId);
                              // Revert to image state
                              if (videoElement) {
                                  videoElement.pause();
                                  videoElement.style.display = 'none';
                                  videoElement.style.opacity = '0';
                                  // console.log(`Immediately hid video on mouse leave during display timeout.`, entityId);
                              }
                              existingImage.style.display = '';
                              existingImage.style.opacity = '1';
                              return; // Exit this timeout callback
                          }
                          videoElement.style.opacity = '1'; // Fade in the video
                          videoElement.play().catch(e => {
                              console.warn("Video play failed after loadeddata:", e);
                              // If play fails and no video has been successful (shouldn't happen if loadeddata fired, but as a safeguard)
                              if (!hasSuccessfulVideo) {
                                  // console.log(`Video play failed after loadeddata and no successful video loaded, reverting to image.`, entityId);
                                  videoElement.style.display = 'none';
                                  videoElement.style.opacity = '0';
                                  existingImage.style.display = '';
                                  existingImage.style.opacity = '1';
                              }
                          });
                       }, 50); // Small delay to allow display change
                  };

                  // Add error handling
                  videoElement.onerror = () => {
                      // console.warn(`Error loading video from URL: ${videoElement.src} for ${entityType}: ${entityId}. Trying next URL.`);

                      // Move to the next video index
                      currentVideoIndex++;

                      // Check if there is a next video URL
                      if (currentVideoIndex < previewUrls.length) {
                          // Load and try to play the next video
                          videoElement.src = `${previewUrls[currentVideoIndex]}?_ts=${Date.now()}`; // Set new source
                          videoElement.load(); // Load the new video
                          videoElement.play().catch(e => console.warn("Video play failed after error:", e)); // Try playing
                          // console.log(`Attempting to load next video: ${videoElement.src}`);
                      } else {
                          // No more videos in the list, revert to image immediately
                          // console.log(`No more preview URLs to try. Reverting to image immediately.`, entityId);
                          hasSuccessfulVideo = false; // Mark that no video was successful
                          
                          // Show the image immediately
                          existingImage.style.display = '';
                          existingImage.style.opacity = '1';

                          // Remove the failed video element from the DOM after a short delay for potential fade-out
                          if (videoElement && videoElement.parentElement) {
                               videoElement.style.opacity = '0'; // Start fade out video
                               setTimeout(() => {
                                   if (videoElement && videoElement.parentElement) {
                                       videoElement.parentElement.removeChild(videoElement);
                                       videoElement = null; // Clear reference
                                       // console.log("Removed failed video element from thumbnail after trying all.");
                                   }
                               }, 300); // Match fade out transition
                          }
                      }
                  };

                  // Find the card header link
                  const cardHeaderLink = cardElement.querySelector(currentConfig.headerSelector);
                  if (cardHeaderLink) {
                      // Append video element as a child of the header link
                      cardHeaderLink.appendChild(videoElement);
                      // console.log(`Appended video element to ${currentConfig.headerSelector} link (initially hidden).`);
                  } else {
                      // console.warn(`${currentConfig.headerSelector} link not found, cannot append video element.`);
                      // Fallback or error handling if header link is not found
                      // For now, we'll just log a warning and the video won't be appended
                  }

                } else {
                  // console.log(`No preview video found for this ${entityType} on hover.`);
                  // Maybe show a placeholder or do nothing
                }

              } catch (error) {
                // console.error(`Error fetching scene for ${entityType} thumbnail on hover:`, error);
                previewUrls = []; // Reset URLs on error
              } finally {
                  isFetching = false; // Allow fetching again if needed (though unlikely with this logic)
              }
          }

          // If it's a default thumbnail and we haven't fetched a random scene thumbnail yet
          if (defaultImageUrl && !randomSceneThumbnailUrl && !isFetching) {
              isFetching = true;
              // console.log(`Fetching random scene thumbnail for default ${entityType} thumbnail:`, entityId);
              
              let randomSceneQuery;
              
              if (entityType === 'tags') {
                  // For tags, use scene markers
                  randomSceneQuery = `
                      query FindRandomSceneMarkerForThumbnail($entityId: ID!) {
                        findSceneMarkers(
                          scene_marker_filter: { tags: { value: [$entityId], modifier: INCLUDES_ALL } }
                          filter: { per_page: 1 }
                        ) {
                          scene_markers {
                            id
                            screenshot
                          }
                        }
                      }
                  `;
              } else {
                  // For other entity types, use scenes
                  randomSceneQuery = `
                      query FindRandomSceneForThumbnail($entityId: ID!) {
                        findScenes(
                          scene_filter: { ${currentConfig.graphqlFilter}: { value: [$entityId], modifier: INCLUDES_ALL } }
                          filter: { per_page: 1 }
                        ) {
                          scenes {
                            id
                            paths {
                              screenshot
                            }
                          }
                        }
                      }
                  `;
              }

              try {
                  const response = await csLib.callGQL({ query: randomSceneQuery, variables: { entityId } });
                  // console.log("GraphQL Response for random scene thumbnail:", response);
                  
                  if (entityType === 'tags') {
                      const marker = response?.findSceneMarkers?.scene_markers?.[0];
                      randomSceneThumbnailUrl = marker?.screenshot;
                      
                      // If no marker found, fallback to scenes
                      if (!randomSceneThumbnailUrl) {
                          // console.log(`No marker screenshot found for tag ${entityId}, trying scene fallback...`);
                          const sceneFallbackQuery = `
                              query FindRandomSceneForTagThumbnailFallback($entityId: ID!) {
                                findScenes(
                                  scene_filter: { tags: { value: [$entityId], modifier: INCLUDES_ALL } }
                                  filter: { per_page: 1 }
                                ) {
                                  scenes {
                                    id
                                    paths {
                                      screenshot
                                    }
                                  }
                                }
                              }
                          `;
                          
                          const sceneFallbackResponse = await csLib.callGQL({ query: sceneFallbackQuery, variables: { entityId } });
                          // console.log("GraphQL Scene Fallback Response for random thumbnail:", sceneFallbackResponse);
                          
                          const scene = sceneFallbackResponse?.findScenes?.scenes?.[0];
                          randomSceneThumbnailUrl = scene?.paths?.screenshot;
                      }
                  } else {
                      const scene = response?.findScenes?.scenes?.[0];
                      randomSceneThumbnailUrl = scene?.paths?.screenshot;
                  }

                  if (randomSceneThumbnailUrl) {
                      // console.log("Found random scene thumbnail URL:", randomSceneThumbnailUrl);
                      // TODO: Use this URL later for default thumbnails
                  } else {
                      // console.log(`No random scene thumbnail found for this ${entityType}.`, entityId);
                  }
              } catch (error) {
                  // console.error("Error fetching random scene thumbnail:", error);
                  randomSceneThumbnailUrl = null; // Reset URL on error
              } finally {
                  isFetching = false; // Allow fetching again if needed
              }
          }

          // Now that we potentially have the video element, show and play it
          if (videoElement && previewUrls.length > 0) {
              // Step 1: Smoothly fade out the image
              existingImage.style.opacity = '0';

          } else if (previewUrls.length === 0) {
              // If fetch happened and no URLs were found, ensure image is visible
              // console.log(`No preview URLs available for this ${entityType}, keeping image visible.`, entityId);
              existingImage.style.display = ''; // Ensure image is visible
              existingImage.style.opacity = '1'; // Ensure image is fully opaque
          }
      });

      cardElement.addEventListener('mouseleave', () => {
          // console.log(`Mouse left thumbnail section for ${entityType}:`, entityId);
          isMouseLeaving = true; // Set flag on mouse leave
          previewUrls = [];
          hasSuccessfulVideo = false; // Reset the successful video flag
          
          // Step 3 (mouseleave): Hide the video smoothly and show the image smoothly
          if (videoElement) { // If video element exists
              videoElement.pause();
              // Fade out the video smoothly
              videoElement.style.opacity = '0';

              // Wait for video fade-out transition to complete before removing and showing image
              setTimeout(() => {
                  // Remove the video element from the DOM
                  if (videoElement && videoElement.parentElement) {
                      videoElement.parentElement.removeChild(videoElement);
                      // console.log(`Removed video element from DOM on mouse leave.`, entityId);
                  }
                  videoElement = null; // Clear the reference

                  // Show the image and fade it in
                  existingImage.style.display = ''; // Use default display for image
                   setTimeout(() => {
                     existingImage.style.opacity = '1'; // Fade in the image
                   }, 10); // Small delay to allow display change

                  // console.log(`Paused and hiding video, showing image for ${entityType}:`, entityId);
              }, 300); // Wait for video fade-out duration (0.3s)

          } else {
              // If no video was shown, just ensure image is visible
              existingImage.style.display = '';
              existingImage.style.opacity = '1';
              // console.log(`No video was shown, ensuring image is visible for ${entityType}:`, entityId);
          }
      });

      // Initial state: ensure image is visible and video is not
      // These initial states are also handled by the style settings above, but keep display here for clarity
      existingImage.style.display = ''; // Make sure image is visible by default
      existingImage.style.opacity = '1'; // Ensure image is fully visible initially

      // If a video element somehow exists already, hide and make it transparent
      const initialVideo = thumbnailSection.querySelector('video');
      if(initialVideo) {
          initialVideo.style.display = 'none';
          initialVideo.style.opacity = '0';
      }

      // Remove all the custom CSS styles we added previously for positioning, z-index, etc.
      // These should now be handled by StashApp's original CSS targeting the image class
      // Keep these removals here to clean up in case they were applied previously
      thumbnailSection.style.position = ''; // Remove position: relative
      thumbnailSection.style.width = '';
      thumbnailSection.style.paddingTop = ''; // Remove aspect ratio padding
      thumbnailSection.style.overflow = '';

      // Video element styles (most handled by copied classes)
      // Remove styles previously set manually if they exist on an initial video element
       if (initialVideo) {
           initialVideo.style.position = ''; // Remove position: absolute
           initialVideo.style.top = '';
           initialVideo.style.left = '';
           initialVideo.style.width = '';
           initialVideo.style.height = '';
           initialVideo.style.objectFit = '';
           initialVideo.style.zIndex = ''; // Remove z-index
           initialVideo.style.pointerEvents = ''; // Remove pointer-events
       }

      // Remove overlay container z-index
      const overlayContainer = cardElement.querySelector('.card-controls') || cardElement.querySelector('.card-popovers');
      if (overlayContainer) {
          // console.log("Found overlay container, removing custom z-index.", overlayContainer);
          overlayContainer.style.zIndex = ''; // Remove custom z-index
          overlayContainer.style.position = ''; // Remove any custom position we might have added
      }

      // Remove favorite button z-index and positioning
      const favoriteButton = cardElement.querySelector('.favorite-button');
      if (favoriteButton) {
          // console.log("Found favorite button, removing custom z-index and position.", favoriteButton);
          favoriteButton.style.zIndex = ''; // Remove custom z-index
          favoriteButton.style.position = ''; // Remove any custom position
          favoriteButton.style.top = '';
          favoriteButton.style.right = '';
      }

      // Log the state of the card element after setup
      // console.log("Card element setup complete:", cardElement);
    };

    // Process existing cards within the container on page load
    containerElement.querySelectorAll(currentConfig.cardSelector).forEach(processCard);
    // console.log(`Processed initial ${entityType} cards within container.`);

    // Use MutationObserver to process newly added cards (e.g., during infinite scroll)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          // Check if the added node is an element and a card
          if (node.nodeType === Node.ELEMENT_NODE) {
            // If the added node itself is a card, process it
            if (node.classList.contains(currentConfig.cardSelector.replace('div.', ''))) {
              // console.log(`MutationObserver directly added ${entityType} card:`, node);
              processCard(node);
            } else {
              // Otherwise, search within the added node for cards
              const cards = node.querySelectorAll(currentConfig.cardSelector);
              if (cards.length > 0) {
                // console.log(`MutationObserver found ${cards.length} ${entityType} cards within added node:`, node);
                cards.forEach(processCard);
              } else {
                // console.log(`MutationObserver added element without ${entityType} cards:`, node);
              }
            }
          }
        });
      });
    });

    // Observe the container element for added cards
    observer.observe(containerElement, { childList: true, subtree: true });
    // console.log(`MutationObserver started on item-list-container for ${entityType}.`);

    // TODO: Consider disconnecting the observer when navigating away (PathElementListener does not handle this)
    // A more robust solution might involve tracking the current page and disconnecting observers on page change.
  };

  // Use PathElementListener to detect navigation to the studios listing page and wait for the main content container
  // We are guessing the main content container is div.item-list-container based on observed added nodes
  csLib.PathElementListener("/studios", "div.item-list-container", async (containerElement) => {
    handleThumbLogic(containerElement, "studios");
  });

  csLib.PathElementListener("/tags", "div.item-list-container", async (containerElement) => {
    handleThumbLogic(containerElement, "tags");
  });

  csLib.PathElementListener("/performers", "div.item-list-container", async (containerElement) => {
    handleThumbLogic(containerElement, "performers");
  });

  csLib.PathElementListener("/groups", "div.item-list-container", async (containerElement) => {
    handleThumbLogic(containerElement, "groups");
  });

})(); 