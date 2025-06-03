"use strict";
(function () {
  const api = window.PluginApi;
  const csLib = window.csLib;

  let currentVideoIndex = 0;
  let videoUrls = [];
  let slideshowInterval = null; // Keeping this variable to clear it when navigating
  let currentVideoElement = null; // Keep track of the currently displayed video element for transitions
  let fadeOutTimeout = null; // To keep track of the fade out fallback timeout

  // Store plugin settings
  let pluginSettings = {};

  function displayVideo(bannerElement, videoUrl) {
    // console.log(`displayVideo called with URL: ${videoUrl}`);

    if (!videoUrl) {
        console.warn("displayVideo called with null or undefined URL, skipping.");
        // Try displaying the next video if the current URL is invalid
        currentVideoIndex = (currentVideoIndex + 1) % videoUrls.length;
        if (videoUrls.length > 0) {
            // Add a small delay before trying the next video to prevent rapid calls
            setTimeout(() => {
                 displayVideo(bannerElement, videoUrls[currentVideoIndex]);
            }, 50);
        } else {
            // console.log("No video URLs available to display.");
            // Handle case where no valid videos are found (e.g., display a placeholder)
            // Ensure any existing video element is removed with transition
            if (currentVideoElement) {
                //  console.log("No video URLs, removing current video element.");
                 currentVideoElement.style.opacity = '0';
                  const noVideosTransitionEndHandler = () => {
                    //  console.log("No videos transitionend event fired.");
                     if(currentVideoElement && currentVideoElement.parentElement === bannerElement) {
                         currentVideoElement.remove();
                        //  console.log("Removed old video element when no new videos found after fade out.");
                     }
                     currentVideoElement = null; // Clear reference
                     if (fadeOutTimeout) { clearTimeout(fadeOutTimeout); fadeOutTimeout = null; }
                  };
                  currentVideoElement.addEventListener('transitionend', noVideosTransitionEndHandler, { once: true });
                   // Fallback removal
                   fadeOutTimeout = setTimeout(() => {
                        //  console.log("No videos removal fallback timeout triggered.");
                        if (currentVideoElement && currentVideoElement.parentElement === bannerElement && currentVideoElement.style.opacity === '0') {
                            currentVideoElement.remove();
                            // console.log("Fallback: Removed old video element after timeout when no new videos found.");
                        } else if (currentVideoElement && currentVideoElement.parentElement === bannerElement) {
                            //  console.log("Fallback timeout: Current video still in DOM when no new videos found.");
                        } else {
                            // console.log("Fallback timeout: Current video element already removed when no new videos found.");
                        }
                        currentVideoElement = null;
                        fadeOutTimeout = null;
                   }, 600);
            }

             // Remove gradient overlay if no videos are found
             const existingOverlay = bannerElement.querySelector('.gradient-overlay');
             if (existingOverlay) {
                 existingOverlay.remove();
                //  console.log("Removed gradient overlay as no videos were found.");
             }
        }
        return;
    }


    // Create the new video element
    const videoElement = document.createElement('video');

    // Add error handler before setting src
    videoElement.onerror = () => {
        console.warn(`Error loading video from URL: ${videoUrl}, skipping.`);
        // Clean up the failed video element
         if (videoElement && videoElement.parentElement) {
             videoElement.parentElement.removeChild(videoElement);
            //  console.log("Removed failed video element from DOM.");
         }

        // Try displaying the next video
        currentVideoIndex = (currentVideoIndex + 1) % videoUrls.length;
        if (videoUrls.length > 0) {
            // Add a small delay before trying the next video to prevent rapid error loop
            setTimeout(() => {
                 displayVideo(bannerElement, videoUrls[currentVideoIndex]);
            }, 50);
        } else {
            //  console.log("No more video URLs to try after error.");
              // Handle case where no valid videos are found after errors
              // Ensure any existing video element (if any was left) is removed
                if (currentVideoElement) {
                //    console.log("No more video URLs, removing current video element.");
                   currentVideoElement.style.opacity = '0';
                    const errorHandlerTransitionEndHandler = () => {
                    //    console.log("Error handler transitionend event fired.");
                       if(currentVideoElement && currentVideoElement.parentElement === bannerElement) {
                           currentVideoElement.remove();
                        //    console.log("Removed old video element in error handler after fade out.");
                       }
                       currentVideoElement = null; // Clear reference
                       if (fadeOutTimeout) { clearTimeout(fadeOutTimeout); fadeOutTimeout = null; }
                    };
                    currentVideoElement.addEventListener('transitionend', errorHandlerTransitionEndHandler, { once: true });
                     // Fallback removal
                     fadeOutTimeout = setTimeout(() => {
                        //   console.log("Error handler removal fallback timeout triggered.");
                          if (currentVideoElement && currentVideoElement.parentElement === bannerElement && currentVideoElement.style.opacity === '0') {
                              currentVideoElement.remove();
                            //   console.log("Fallback: Removed old video element in error handler after timeout.");
                          } else if (currentVideoElement && currentVideoElement.parentElement === bannerElement) {
                            //    console.log("Fallback timeout: Current video still in DOM in error handler.");
                          } else {
                            //   console.log("Fallback timeout: Current video element already removed in error handler.");
                          }
                          currentVideoElement = null;
                          fadeOutTimeout = null;
                     }, 600);
              }
             // Remove gradient overlay if no videos are found
             const existingOverlay = bannerElement.querySelector('.gradient-overlay');
             if (existingOverlay) {
                 existingOverlay.remove();
                //  console.log("Removed gradient overlay as no videos were found after errors.");
             }
        }
    };

    videoElement.src = videoUrl; // Set src AFTER adding onerror

    videoElement.autoplay = true;
    videoElement.loop = false; // Do not loop, rely on 'ended' event or timeout
    videoElement.muted = true; // Start muted for autoplay
    videoElement.style.position = 'absolute';
    videoElement.style.top = '0';
    videoElement.style.left = '0';
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';
    videoElement.style.objectFit = 'cover';
    videoElement.style.zIndex = '-1'; // Behind the content

    // Apply brightness filter from settings
    const brightnessPercentage = pluginSettings.videoBrightness || 65; // Use setting or default to 65%
    videoElement.style.filter = `brightness(${brightnessPercentage}%)`;
    // console.log(`Applying brightness filter: ${brightnessPercentage}%`);


    videoElement.style.opacity = '0'; // Start hidden for fade in
    videoElement.style.transition = 'opacity 0.5s ease-in-out'; // Add transition for fade

    // Add the new video element to the banner BEFORE fading out the old one
    // Use a small delay to ensure the DOM is ready for the new element
    setTimeout(() => {
         bannerElement.prepend(videoElement); // Add video as the first child
        //  console.log("Created and added new video element to DOM.");

         // Reference the old video element before updating currentVideoElement
         const oldVideoElement = currentVideoElement;

         // Update the current video element reference to the NEW element
         currentVideoElement = videoElement;

         // Start fade in for the new video
         // Use a very small delay to ensure the element is in DOM and transition can apply
         setTimeout(() => {
            if(videoElement === currentVideoElement) { // Ensure this is still the current video
               videoElement.style.opacity = '1';
              //  console.log("Starting fade in transition for new video.");
            } else {
                // console.log("New video element changed before fade in could start.");
            }
         }, 50); // Small delay for fade in

         // Start fade out for the old video and remove it after transition
         if (oldVideoElement) {
            //  console.log("Old video element found, starting fade out process.");
             // Add a small delay before starting fade out to overlap with new video fade in
              setTimeout(() => {
                //  console.log("Setting old video opacity to 0.");
                 oldVideoElement.style.opacity = '0';

                 // Remove the old video element after the transition completes
                 const transitionEndHandler = () => {
                    //   console.log("Old video transitionend event fired.");
                      if(oldVideoElement && oldVideoElement.parentElement === bannerElement) { // Check if still in DOM and is the element we expect
                          oldVideoElement.remove();
                        //   console.log("Removed old video element after fade out transition.");
                      }
                      // Clear the fallback timeout if transitionend worked
                      if (fadeOutTimeout) {
                           clearTimeout(fadeOutTimeout);
                           fadeOutTimeout = null;
                        //    console.log("Cleared fade out fallback timeout.");
                      }
                 };
                 oldVideoElement.addEventListener('transitionend', transitionEndHandler, { once: true }); // Use { once: true } to automatically remove the listener

                 // Fallback removal for the old element just in case transitionend doesn't fire
                  fadeOutTimeout = setTimeout(() => {
                    //    console.log("Fade out fallback timeout triggered.");
                       if (oldVideoElement && oldVideoElement.parentElement === bannerElement && oldVideoElement.style.opacity === '0') {
                           oldVideoElement.remove();
                        //    console.log("Fallback: Removed old video element after timeout.");
                       } else if (oldVideoElement && oldVideoElement.parentElement === bannerElement) {
                            // console.log("Fallback timeout: Old video still in DOM but opacity not 0, may indicate transition issue.");
                       } else {
                        //    console.log("Fallback timeout: Old video element already removed.");
                       }
                       fadeOutTimeout = null;
                  }, 600); // Slightly longer than transition duration

             }, 10); // Small delay to overlap fades
         } else {
            //  console.log("No old video element found.");
         }


       // Listen for the new video to end to switch to the next one
      videoElement.onended = () => {
        // console.log("New video ended, switching to next.");
        currentVideoIndex = (currentVideoIndex + 1) % videoUrls.length;
        // Use a small delay before displaying the next video to allow transition overlap
        setTimeout(() => {
             displayVideo(bannerElement, videoUrls[currentVideoIndex]);
        }, 200); // Delay for overlap

      };

       // If the new video is short or duration is not available, set a timeout to switch
        videoElement.onloadedmetadata = () => {
            // console.log("New video metadata loaded.");
            const duration = videoElement.duration;
            const minDisplayTime = 5; // Display each video for at least 5 seconds as a fallback
            // console.log(`New video duration: ${duration}`);
            if (duration === Infinity || (duration > 0 && duration < minDisplayTime)) {
                //  console.log(`New video duration is infinity or less than ${minDisplayTime}s (${duration}), setting timeout fallback.`);
                 // Clear any previous timeout for this video element
                 if (videoElement.timeoutId) {
                     clearTimeout(videoElement.timeoutId);
                 }
                videoElement.timeoutId = setTimeout(() => {
                //    console.log("Timeout triggered for new video, switching to next video.");
                   // Only switch if this is still the current video element
                   if (videoElement === currentVideoElement) {
                       currentVideoIndex = (currentVideoIndex + 1) % videoUrls.length;
                       // Use a small delay before displaying the next video to allow transition overlap
                       setTimeout(() => {
                            displayVideo(bannerElement, videoUrls[currentVideoIndex]);
                       }, 200); // Delay for overlap
                   } else {
                    //    console.log("Timeout triggered but video element is no longer current.");
                   }
               }, minDisplayTime * 1000);
            }
        };

    }, 50); // Initial delay before creating and adding the new element
  }

  // Function to handle the banner logic for both studio and performer pages
  async function handleBannerLogic(bannerElement) {
    // console.log("Handle banner logic triggered for element:", bannerElement);

     // --- Start: Get plugin settings ---
     try {
         // Fetch plugin settings using the correct plugin ID
         pluginSettings = await csLib.getConfiguration("VideoBanner", { videoBrightness: 65 }); // Default brightness to 65%
        //  console.log("Plugin settings loaded:", pluginSettings);
     } catch (error) {
         console.error("Error loading plugin settings:", error);
         // Use default settings if loading fails
         pluginSettings = { videoBrightness: 65 };
        //  console.log("Using default plugin settings:", pluginSettings);
     }
     // --- End: Get plugin settings ---


     // Add a gradient overlay to the banner element to soften edges
     // (Keep this to soften the video edges outside the detail container)
     bannerElement.style.position = 'relative'; // Ensure positioning context for the gradient overlay
     // Check if a gradient overlay already exists and update/replace it if it does
     let gradientOverlay = bannerElement.querySelector('.gradient-overlay');
     if (!gradientOverlay) {
         // Create a new div for the gradient overlay if it doesn't exist
         gradientOverlay = document.createElement('div');
         gradientOverlay.classList.add('gradient-overlay'); // Add a class for easy identification
         gradientOverlay.style.position = 'absolute';
         gradientOverlay.style.top = '0';
         gradientOverlay.style.left = '0';
         gradientOverlay.style.width = '100%';
         gradientOverlay.style.height = '100%';
         gradientOverlay.style.zIndex = '-1'; // Below the content but above the video
         bannerElement.appendChild(gradientOverlay); // Add the gradient overlay
        //  console.log("Added gradient overlay div.");
     }
     // Update the gradient style to a linear gradient from left (dark) to right (transparent)
     gradientOverlay.style.background = 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)';
    //  console.log("Applied/Updated linear gradient overlay style to banner element.");


     // Clear any existing slideshow interval and handle removal of the current video element on navigation
     if (slideshowInterval) {
       clearInterval(slideshowInterval);
       slideshowInterval = null;
      //  console.log("Cleared existing slideshow interval.");
     }
     // Clear any pending fade out fallback timeout
     if (fadeOutTimeout) {
         clearTimeout(fadeOutTimeout);
         fadeOutTimeout = null;
        //  console.log("Cleared fade out fallback timeout on navigation.");
     }

     if (currentVideoElement) {
        //  console.log("Removing current video element on navigation.");
         // Start fade out and remove after transition on navigation
         currentVideoElement.style.opacity = '0';
         const navigationTransitionEndHandler = () => {
            //  console.log("Navigation transitionend event fired.");
             if(currentVideoElement && currentVideoElement.parentElement === bannerElement) { // Check if still in DOM and is the element we expect
                 currentVideoElement.remove();
                //  console.log("Removed current video element on navigation after fade out.");
             }
         };
         // Use a small delay before adding the listener to ensure opacity change takes effect
         setTimeout(() => {
              if(currentVideoElement) {
                  currentVideoElement.addEventListener('transitionend', navigationTransitionEndHandler, { once: true });
              }
         }, 10);

         // Fallback just in case transitionend doesn't fire (e.g., element removed before transition ends)
         setTimeout(() => {
            //   console.log("Navigation removal fallback timeout triggered.");
              // Only remove if it hasn't been replaced by a new video yet and is invisible
              if (currentVideoElement && currentVideoElement.parentElement === bannerElement && currentVideoElement.style.opacity === '0') {
                  currentVideoElement.remove();
                //   console.log("Fallback: Removed old video element on navigation after timeout.");
              } else if (currentVideoElement && currentVideoElement.parentElement === bannerElement) {
                //   console.log("Fallback timeout: Current video still in DOM on navigation, may indicate transition issue.");
              } else {
                //   console.log("Fallback timeout: Current video element already removed on navigation.");
              }
               // Note: currentVideoElement is cleared below after this if block
         }, 600); // Slightly longer than transition duration

          currentVideoElement = null; // Clear reference immediately on navigation start
     }
      // Also clear any pending timeouts from previous videos
      // This is handled within the displayVideo function now by checking currentVideoElement

     // Extract ID from the URL and determine page type
     let id = null;
     let queryFilter = null;
     const studioIdMatch = window.location.pathname.match(/\/studios\/([^\/]+)/);
     const performerIdMatch = window.location.pathname.match(/\/performers\/([^\/]+)/);
     const groupIdMatch = window.location.pathname.match(/\/groups\/([^\/]+)/);
     const tagIdMatch = window.location.pathname.match(/\/tags\/([^\/]+)/);

    //  console.log("Current pathname:", window.location.pathname);
    //  console.log("Studio ID match result:", studioIdMatch);
    //  console.log("Performer ID match result:", performerIdMatch);
    //  console.log("Group ID match result:", groupIdMatch);
    //  console.log("Tag ID match result:", tagIdMatch);

     if (studioIdMatch) {
       id = studioIdMatch[1];
       queryFilter = "studios";
      //  console.log("Processing Studio ID:", id);
     } else if (performerIdMatch) {
       id = performerIdMatch[1];
       queryFilter = "performers";
      //  console.log("Processing Performer ID:", id);
     } else if (groupIdMatch) {
       id = groupIdMatch[1];
       queryFilter = "groups";
      //  console.log("Processing Group ID:", id);
     } else if (tagIdMatch) {
       id = tagIdMatch[1];
       queryFilter = "tags";
      //  console.log("Processing Tag ID:", id);
     } else {
         console.error("Could not extract Studio or Performer or Group or Tag ID from URL");
         // Remove any existing video element and gradient if navigation fails
         if (currentVideoElement) {
            //   console.log("Navigation failed, removing current video element.");
              currentVideoElement.style.opacity = '0';
               const navFailTransitionEndHandler = () => {
                //   console.log("Navigation fail transitionend event fired.");
                  if(currentVideoElement && currentVideoElement.parentElement === bannerElement) {
                      currentVideoElement.remove();
                    //   console.log("Removed old video element on navigation fail after fade out.");
                  }
                  currentVideoElement = null; // Clear reference
                  if (fadeOutTimeout) { clearTimeout(fadeOutTimeout); fadeOutTimeout = null; }
               };
               currentVideoElement.addEventListener('transitionend', navFailTransitionEndHandler, { once: true });
                // Fallback removal
                fadeOutTimeout = setTimeout(() => {
                    //  console.log("Navigation fail removal fallback timeout triggered.");
                     if (currentVideoElement && currentVideoElement.parentElement === bannerElement && currentVideoElement.style.opacity === '0') {
                         currentVideoElement.remove();
                        //  console.log("Fallback: Removed old video element after timeout on navigation fail.");
                     } else if (currentVideoElement && currentVideoElement.parentElement === bannerElement) {
                        //   console.log("Fallback timeout: Current video still in DOM on navigation fail.");
                     } else {
                        //   console.log("Fallback timeout: Current video element already removed on navigation fail.");
                     }
                     currentVideoElement = null;
                     fadeOutTimeout = null;
                }, 600);
         }
          // Remove gradient overlay if navigation fails
          const existingOverlay = bannerElement.querySelector('.gradient-overlay');
          if (existingOverlay) {
              existingOverlay.remove();
            //   console.log("Removed
          }
         return; // Exit if no valid ID found
     }

    //  console.log("Extracted ID:", id);
    //  console.log("Determined query filter:", queryFilter);

     // Handle data fetching based on page type
     if (queryFilter === "tags") {
       // Determine if it's the scenes, markers, or main tag page
       const pathname = window.location.pathname;
       const isScenesTab = pathname.endsWith('/scenes');
       const isMarkersTab = pathname.endsWith('/markers');
       const isGroupsTab = pathname.endsWith('/groups');
       const isPerformersTab = pathname.endsWith('/performers');
      //  console.log("Tag page details:", { pathname, isScenesTab, isMarkersTab, isGroupsTab, isPerformersTab });

       let scenePreviews = [];
       let markerPreviews = [];
       let groupScenePreviews = []; // Videos from scenes in groups linked to the tag
       let performerScenePreviews = []; // Videos from scenes with performers who have the tag

       const scenesQuery = `
         query FindScenesForTag($id: ID!) {
           findScenes(scene_filter: { tags: { value: [$id], modifier: INCLUDES_ALL } }) {
             scenes {
               id
               paths {
                 preview
               }
             }
           }
         }
       `;

       const markersQuery = `
         query FindSceneMarkersForTag($id: ID!) {
           findSceneMarkers(scene_marker_filter: { tags: { value: [$id], modifier: INCLUDES_ALL } }) {
             scene_markers {
                id
                scene {
                  id
                }
             }
           }
         }
       `;

       try {
         if (isGroupsTab) { // Fetch scenes from groups linked to the tag for the groups tab
            // console.log("Fetching scenes from groups for tag page...");
            // First, find groups associated with the tag
            const groupsQuery = `
                query FindGroupsForTag($tagId: ID!) {
                  findGroups(group_filter: { tags: { value: [$tagId], modifier: INCLUDES_ALL } }) {
                    groups {
                      id
                    }
                  }
                }
            `;
            const groupsResponse = await csLib.callGQL({ query: groupsQuery, variables: { tagId: id } });
            // console.log("GraphQL Groups Response (Tags page, Groups tab):", groupsResponse);

            const groupIds = groupsResponse?.findGroups?.groups?.map(group => group.id) || [];
            // console.log("Group IDs associated with tag:", groupIds);

            if (groupIds.length > 0) {
                 // Then, find scenes associated with these groups
                 const scenesByGroupQuery = `
                     query FindScenesByGroupIds($groupIds: [ID!]) {
                       findScenes(scene_filter: { groups: { value: $groupIds, modifier: INCLUDES } }) {
                         scenes {
                           id
                           paths {
                             preview
                           }
                         }
                       }
                     }
                 `;
                const scenesByGroupResponse = await csLib.callGQL({ query: scenesByGroupQuery, variables: { groupIds } });
                // console.log("GraphQL Scenes by Group Response (Tags page, Groups tab):", scenesByGroupResponse);

                groupScenePreviews = scenesByGroupResponse?.findScenes?.scenes
                    ?.filter(scene => scene.paths?.preview)
                    .map(scene => `${scene.paths.preview}?_ts=${Date.now()}`) || [];
                // console.log("Group scene preview URLs (Tags page, Groups tab):", groupScenePreviews);

                // Shuffle the collected group scene preview URLs
                for (let i = groupScenePreviews.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [groupScenePreviews[i], groupScenePreviews[j]] = [groupScenePreviews[j], groupScenePreviews[i]];
                }
                // console.log("Shuffled group scene preview URLs (Tags page, Groups tab):", groupScenePreviews);
            } else {
                // console.log("No groups found for this tag.");
            }

         }

         if (isPerformersTab) { // Fetch scenes from performers who have the tag for the performers tab
            // console.log("Fetching scenes from performers for tag page...");
            // First, find performers associated with the tag
            const performersQuery = `
                query FindPerformersForTag($tagId: ID!) {
                  findPerformers(performer_filter: { tags: { value: [$tagId], modifier: INCLUDES_ALL } }) {
                    performers {
                      id
                    }
                  }
                }
            `;
            const performersResponse = await csLib.callGQL({ query: performersQuery, variables: { tagId: id } });
            // console.log("GraphQL Performers Response (Tags page, Performers tab):", performersResponse);

            const performerIds = performersResponse?.findPerformers?.performers?.map(performer => performer.id) || [];
            // console.log("Performer IDs associated with tag:", performerIds);

            if (performerIds.length > 0) {
                 // Then, find scenes associated with these performers
                 const scenesByPerformerQuery = `
                     query FindScenesByPerformerIds($performerIds: [ID!]) {
                       findScenes(scene_filter: { performers: { value: $performerIds, modifier: INCLUDES } }) {
                         scenes {
                           id
                           paths {
                             preview
                           }
                         }
                       }
                     }
                 `;
                const scenesByPerformerResponse = await csLib.callGQL({ query: scenesByPerformerQuery, variables: { performerIds } });
                // console.log("GraphQL Scenes by Performer Response (Tags page, Performers tab):", scenesByPerformerResponse);

                performerScenePreviews = scenesByPerformerResponse?.findScenes?.scenes
                    ?.filter(scene => scene.paths?.preview)
                    .map(scene => `${scene.paths.preview}?_ts=${Date.now()}`) || [];
                // console.log("Performer scene preview URLs (Tags page, Performers tab):", performerScenePreviews);

                // Shuffle the collected performer scene preview URLs
                for (let i = performerScenePreviews.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [performerScenePreviews[i], performerScenePreviews[j]] = [performerScenePreviews[j], performerScenePreviews[i]];
                }
                // console.log("Shuffled performer scene preview URLs (Tags page, Performers tab):", performerScenePreviews);
            } else {
                // console.log("No performers found for this tag.");
            }

         }

         if (isScenesTab || (!isScenesTab && !isMarkersTab && !isGroupsTab && !isPerformersTab)) { // Fetch scenes for scenes tab or main tag page
           // console.log("Fetching scenes for tag page...");
           const scenesResponse = await csLib.callGQL({ query: scenesQuery, variables: { id } });
           // console.log("GraphQL Scenes Response (Tags page):", scenesResponse);
           scenePreviews = scenesResponse?.findScenes?.scenes
             ?.filter(scene => scene.paths?.preview)
             .map(scene => `${scene.paths.preview}?_ts=${Date.now()}`) || [];
           //  console.log("Scene preview URLs (Tags page):", scenePreviews);
         }

         if (isMarkersTab || (!isScenesTab && !isMarkersTab && !isGroupsTab && !isPerformersTab)) { // Fetch markers for markers tab or main tag page
          //  console.log("Fetching markers for tag page...");
           const markersResponse = await csLib.callGQL({ query: markersQuery, variables: { id } });
          //  console.log("GraphQL Markers Response (Tags page):", markersResponse);
           markerPreviews = markersResponse?.findSceneMarkers?.scene_markers
             ?.filter(marker => marker.id && marker.scene?.id)
             .map(marker => `/scene/${marker.scene.id}/scene_marker/${marker.id}/stream?_ts=${Date.now()}`) || [];
          //  console.log("Marker preview URLs (Tags page):", markerPreviews);
         }

         // Combine URLs based on the tab, prioritizing markers on the main page
         if (isGroupsTab) {
             videoUrls = groupScenePreviews; // Only group scene previews on groups tab
            //  console.log("Video URLs (Groups tab):", videoUrls);
         } else if (isPerformersTab) {
             videoUrls = performerScenePreviews; // Only performer scene previews on performers tab
            //  console.log("Video URLs (Performers tab):", videoUrls);
         } else if (isMarkersTab) {
             videoUrls = markerPreviews; // Only marker previews on markers tab
            //  console.log("Video URLs (Markers tab):", videoUrls);
         } else if (isScenesTab) {
             videoUrls = scenePreviews; // Only scene previews on scenes tab
            //   console.log("Video URLs (Scenes tab):", videoUrls);
         } else { // Main tag page
             videoUrls = [...markerPreviews, ...scenePreviews]; // Marker previews then scene previews
            //   console.log("Video URLs (Main Tags page, prioritized markers):", videoUrls);
         }

         // Proceed with displaying videos using the collected list
         if (!videoUrls || videoUrls.length === 0) {
            // console.log("No preview videos found for this tag based on the current tab.");
            // Handle case where no valid videos are found
             if (currentVideoElement) {
                //   console.log("No videos found, removing current video element.");
                  currentVideoElement.style.opacity = '0';
                   const noVideosTransitionEndHandler = () => {
                    //   console.log("No videos transitionend event fired.");
                      if(currentVideoElement && currentVideoElement.parentElement === bannerElement) {
                          currentVideoElement.remove();
                        //   console.log("Removed old video element when no new videos found after fade out.");
                      }
                      currentVideoElement = null; // Clear reference
                      if (fadeOutTimeout) { clearTimeout(fadeOutTimeout); fadeOutTimeout = null; }
                   };
                   currentVideoElement.addEventListener('transitionend', noVideosTransitionEndHandler, { once: true });
                    // Fallback removal
                    fadeOutTimeout = setTimeout(() => {
                        //  console.log("No videos removal fallback timeout triggered.");
                         if (currentVideoElement && currentVideoElement.parentElement === bannerElement && currentVideoElement.style.opacity === '0') {
                             currentVideoElement.remove();
                            //  console.log("Fallback: Removed old video element after timeout when no new videos found.");
                         } else if (currentVideoElement && currentVideoElement.parentElement === bannerElement) {
                            //   console.log("Fallback timeout: Current video still in DOM when no new videos found.");
                          } else {
                            //   console.log("Fallback timeout: Current video element already removed when no new videos found.");
                          }
                          currentVideoElement = null;
                          fadeOutTimeout = null;
                     }, 600);
               }

               // Remove gradient overlay if no videos are found
               const existingOverlay = bannerElement.querySelector('.gradient-overlay');
               if (existingOverlay) {
                   existingOverlay.remove();
                //    console.log("Removed gradient overlay as no videos were found.");
               }

            return; // Exit if no videos found
         }

         // Select a random starting video index based on the tab
         currentVideoIndex = Math.floor(Math.random() * videoUrls.length);
         if (isGroupsTab) {
            //   console.log(`Starting slideshow with a random group scene preview at index: ${currentVideoIndex} (out of ${videoUrls.length} total videos) on Groups tab.`);
         } else if (isPerformersTab) {
            //   console.log(`Starting slideshow with a random performer scene preview at index: ${currentVideoIndex} (out of ${videoUrls.length} total videos) on Performers tab.`);
         } else if (isMarkersTab) {
            //   console.log(`Starting slideshow with a random marker preview at index: ${currentVideoIndex} (out of ${videoUrls.length} total videos) on Markers tab.`);
         } else if (isScenesTab) {
              // console.log(`Starting slideshow with a random scene preview at index: ${currentVideoIndex} (out of ${videoUrls.length} total videos) on Scenes tab.`);
         } else if (markerPreviews.length > 0) { // Main tag page, prioritize markers
             currentVideoIndex = Math.floor(Math.random() * markerPreviews.length);
            //  console.log(`Starting slideshow with a random marker preview at index: ${currentVideoIndex} (out of ${markerPreviews.length} markers) on Main tag page.`);
         } else { // Main tag page, no markers, use scenes
            //  console.log(`No marker previews found. Starting slideshow with a random scene preview at index: ${currentVideoIndex} (out of ${videoUrls.length} total videos) on Main tag page.`);
         }

         // Display the first video
         displayVideo(bannerElement, videoUrls[currentVideoIndex]);

       } catch (error) {
         console.error("Error fetching data for tag page:", error);
         if (error.response) {
              console.error("GraphQL Error Response Details:", error.response);
         }
          // Optionally handle error display or fallback UI for tag pages
       }
     } else { // Handle studios, performers, groups with the existing logic
       // GraphQL query to get scenes for the studio, performer, or group with generated preview paths
       // Dynamically build the filter based on page type
       const query = `
         query FindScenes($id: ID!) {
           findScenes(scene_filter: { ${queryFilter}: { value: [$id], modifier: INCLUDES_ALL } }) {
             scenes {
               id
               paths {
                 preview
               }
             }
           }
         }
       `;

      //  console.log("Generated GraphQL query:", query);

       try {
         const response = await csLib.callGQL({ query, variables: { id } });
        //   console.log("GraphQL Response:", response);

         // Log the scenes array before filtering
         const allScenes = response?.findScenes?.scenes;
        //  console.log(`All scenes returned by query (${queryFilter} page):`, allScenes);

         // Populate videoUrls with all scenes that have a truthy preview path
         // Add cache-busting timestamp here
         videoUrls = allScenes?.filter(scene => scene.paths?.preview).map(scene => `${scene.paths.preview}?_ts=${Date.now()}`);

         if (!videoUrls || videoUrls.length === 0) {
          //  console.log(`No preview videos found for this ${queryFilter}.`);
           // TODO: Handle case where no valid videos are found (e.g., display a placeholder)
           // If no videos are found, ensure any existing video element is removed with transition
           if (currentVideoElement) {
                // console.log("No videos found, removing current video element.");
                currentVideoElement.style.opacity = '0';
                 const noVideosTransitionEndHandler = () => {
                    // console.log("No videos transitionend event fired.");
                    if(currentVideoElement && currentVideoElement.parentElement === bannerElement) {
                        currentVideoElement.remove();
                        // console.log("Removed old video element when no new videos found after fade out.");
                    }
                    currentVideoElement = null; // Clear reference
                    if (fadeOutTimeout) { clearTimeout(fadeOutTimeout); fadeOutTimeout = null; }
                 };
                 currentVideoElement.addEventListener('transitionend', noVideosTransitionEndHandler, { once: true });
                  // Fallback removal
                  fadeOutTimeout = setTimeout(() => {
                      //  console.log("No videos removal fallback timeout triggered.");
                       if (currentVideoElement && currentVideoElement.parentElement === bannerElement && currentVideoElement.style.opacity === '0') {
                           currentVideoElement.remove();
                          //  console.log("Fallback: Removed old video element after timeout when no new videos found.");
                       } else if (currentVideoElement && currentVideoElement.parentElement === bannerElement) {
                            // console.log("Fallback timeout: Current video still in DOM when no new videos found.");
                        } else {
                            // console.log("Fallback timeout: Current video element already removed when no new videos found.");
                        }
                        currentVideoElement = null;
                        fadeOutTimeout = null;
                   }, 600);
             }

             // Remove gradient overlay if no videos are found
             const existingOverlay = bannerElement.querySelector('.gradient-overlay');
             if (existingOverlay) {
                 existingOverlay.remove();
                //  console.log("Removed gradient overlay as no videos were found.");
             }

            return; // Exit if no videos found
          }

          // console.log(`Collected potential video URLs for slideshow (${queryFilter} page):`, videoUrls);

          // Select a random starting video index
          currentVideoIndex = Math.floor(Math.random() * videoUrls.length);
          // console.log(`Starting slideshow at random index: ${currentVideoIndex}`);

          // Display the first video (error handling for 404 will be done during playback attempt)
          displayVideo(bannerElement, videoUrls[currentVideoIndex]);


        } catch (error) {
          console.error(`Error fetching scenes or processing data for ${queryFilter} page:`, error);
          // Log the error response details if available
          if (error.response) {
               console.error("GraphQL Error Response Details:", error.response);
          }
           // Optionally handle error display or fallback UI for other page types
        }
     }
  }

  // Use separate PathElementListeners for studios and performers
  csLib.PathElementListener("/studios/", "div.detail-header", async (bannerElement) => {
    // console.log("Studio banner element found:", bannerElement);
    handleBannerLogic(bannerElement);
  });

  csLib.PathElementListener("/performers/", "div.detail-header", async (bannerElement) => {
    // console.log("Performer banner element found:", bannerElement);
    handleBannerLogic(bannerElement);
  });

  // Use PathElementListener for groups
  csLib.PathElementListener("/groups/", "div.detail-header", async (bannerElement) => {
    // console.log("Group banner element found:", bannerElement);
    handleBannerLogic(bannerElement);
  });

  // Use PathElementListener for tags
  csLib.PathElementListener("/tags/", "div.detail-header", async (bannerElement) => {
    // console.log("Tag banner element found:", bannerElement);
    handleBannerLogic(bannerElement);
  });
})();