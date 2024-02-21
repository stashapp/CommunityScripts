// CSS themes: Themes are defined within const variables, as the CSS text can be large to quickly where next theme variable begins
// search for commented out line // Category CSS Begin or Category CSS End {Categories: Themes, Global, Galleries, Images, Movies, Performers, Scenes, Studios, Tags}
// Once a new theme has been defined reference where it begins and ends in the same style of commented out links.
// The variable that consolodated all themes is called themeSwitchCSS variable
// at the bottom of this file

// Themes CSS Begin
const blackHole = `
/* Black Hole Theme by BViking78 v2.0 */
/* STASH GENERAL */
/* Set Background to Black & Optional Custom Image */
body {
	background: black url("") no-repeat fixed center;
	background-size: contain;
}

/* Change Top Nav Bar Colors */
.bg-dark {
    background-color: #000000!important;
}

/* Set Red Border on Button on Hover */
.btn-primary.btn:hover {
  border: 1px solid red;
}

/* Set Background to Transparent for Tags/Performers Popups*/
.fade.hover-popover-content {
  background: transparent;
}

/* Zoom Performers image when Hover*/
.hover-popover-content {
  max-width: initial;
}
.image-thumbnail:hover {
  height: 100%;
}

/* Set Opacity Studio Logo to 100% */
.scene-studio-overlay {
	opacity: 100%;
}

/* Making Checkbox Slightly Bigger */
.grid-card .card-check {
	top: 0.9rem;
	width: 1.75rem;
}

/* Center Titles on Cards */
.grid-card a .card-section-title {
	text-align: center;
}

/* Setting Background on Cards to Black and Borders to "Stash Grey" */
.card {
	background-color: black;
	border: 1px solid #30404d;
}

/* STASH MAIN PAGE*/
/* Change Card Header Color */
.card-header {
  background: black;
  border: 1px solid white;
}
/* Change Markdown Color */
.card-body {
  background: black;
  border: 1px solid white;
}

/* SCENE PAGE */
/* Hide the scene scrubber */
.scrubber-wrapper {
  display: none;
}

/* Setting Row "Scrape With" Background to Black */
#scene-edit-details .edit-buttons-container {
    background-color: black;
}

/* Setting Other Rows Background to Black */
div.react-select__control {
    background-color: black;
}

/* SETTING */
/* Setting Text Input Border to White */
.input-control, .text-input {
	border: 1px solid white;
}

/* Setting Background on Task Queue to Black */
#tasks-panel .tasks-panel-queue {
    background-color: black;
}`;
// Themes CSS End

// Themes CSS Begin
const glassy = `
/* Glassy - A Window To Your Collection - A Stash Theme By Serechoo Commit Hash: bde716b */
/* General Styling */

/* Common Styles */
* {
	text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
	color: white;
}

/* Header Style */
h1,
h2,
h3,
h4,
h5,
h6 {
	font-weight: 700;
}

p {
	font-weight: 300;
	color: rgba(255, 255, 255, 0.8);
	/* Adjust the alpha value for text transparency */
}


/* Change cursor to pointer on hover for clickable elements */

.movie-card-image cursor: pointer;

/* Nav Button Effects */
.nav-item:hover {
	opacity: 0.8;
}


/* Stylized Settings - Anything with the "embossed"/white shadow around the card */
/*.minimal.p-4.p-xl-2.d-flex.d-xl-inline-block.flex-column.justify-content-between.align-items-center.btn.btn-primary,*/
.PerformerTagger-performer,
.StudioTagger-studio,
li.row.mx-0.mt-2.search-result,
li.row.mx-0.mt-2.search-result.selected-result.active,
div.mt-3.search-item,
div.changelog-version.card,
.tasks-panel,
.setting-section,
.flex-column.nav.nav-pills {
	background: rgba(0, 0, 0, 0.4);
	/* Darker background for dark mode, adjust opacity as needed */
	color: #fff;
	/* Text color for dark mode */
	border-radius: 10px;
	/* Adjust the border-radius for rounded corners */
	padding: 20px;
	/* Adjust the padding as needed */
	box-shadow: 0 4px 8px rgba(255, 255, 255, 0.1), 0 0 10px rgba(255, 255, 255, 0.1);
	/* Raised embossed effect */
}

/* Popup Modal Styling - Settings Section - General "Dark Themed Glassy Look" */
.detail-header.collapsed,
.performer-head.col,
.scene-card.zoom-1.grid-card.card,
.performer-card.grid-card.card,
.movie-card.grid-card.card,
.studio-card.grid-card.card,
.div.card,
p.title,
div.stats-element,
.show.dropdown,
.fade.hover-popover-content.show.popover.bs-popover-bottom,
.ml-1.d-flex.align-items-center,
div.queue-controls,
div.queue-content,
select.input-control.form-control,
.scene-edit-details,
.sticky.detail-header,
.bg-secondary.text-white.dropdown-item,
.react-select__input,
.react-select__control.css-13cymwt-control,
select.query-text-field-clear.d-none.btn.btn-secondary,
select.query-text-field.bg-secondary.text-white.border-secondary.form-control,
div.input-group,
.bg-secondary.text-white.dropdown-menu.show,
.mb-2.mr-2.d-flex>*,
.btn-secondary.form-control,
.saved-filter-list-menu.dropdown-menu.show,
.background-image-container,
.detail-header.full-width,
button.btn.btn-secondary,
.job-table.card,
div.tagger-container.mx-md-auto,
button.btn.btn-primary,
div.card,
div.setting,
div.collapsible-section.collapse.show,
div.setting-group.collapsible,
div.wall.w-100.row.justify-content-center,
div.changelog-version-body.markdown.collapse.show,
div.markdown,
div.modal-header,
div.modal-footer,
div.modal-body,
div.modal-content {
	background: rgba(0, 0, 0, 0.3);
	/* Darker background for dark mode, adjust opacity as needed */
}

/* Additional styling for text inside the containers - Helping Readability */
.tasks-panel-queue h2,
.setting-section h2,
.flex-column.nav.nav-pills h2,
.div.card h2 {
	color: #ffcc00;
	/* Adjust the text color for headings in dark mode */
}

.tasks-panel-queue p,
.setting-section p,
.flex-column.nav.nav-pills p,
.div.card p {
	color: #ddd;
	/* Adjust the text color for paragraphs in dark mode */
}

/* Scrollbar Modification */
::-webkit-scrollbar {
	width: 10px;
}

::-webkit-scrollbar-track {
	background: transparent;
}

::-webkit-scrollbar-thumb {
	background: #f0f0f0;
	border: 2px solid #ddd;
	border-radius: 6px;
}

/* Navigation Bar Styling */
nav.bg-dark {
	background: rgba(10, 20, 25, 0.50) !important;
}

.bg-dark {
	background: none !important;
	background-color: none !important;
}

.form-group .bg-dark {
	background: rgba(10, 20, 25, 0.20) !important;
}


/* Animation for Scene, Performer, and Studio Cards on Main Page */
@keyframes scrollLeftToRight {

	0%,
	100% {
		transform: translateX(0);
	}

	50% {
		transform: translateX(-200%);
	}
}

/*Target the Specific Slick Tracks to Animate and Include a Pause on Hover*/

.movie-recommendations .slick-track,
.scene-recommendations .slick-track,
.performer-recommendations .slick-track,
.studio-recommendations .slick-track {
	animation: scrollLeftToRight 4800s linear infinite;
	white-space: nowrap;
	overflow: hidden;
	animation-play-state: running;
}


.movie-recommendations .slick-track:hover,
.scene-recommendations .slick-track:hover,
.performer-recommendations .slick-track:hover,
.studio-recommendations .slick-track:hover {
	animation-play-state: paused;
}


/*Main Page - Blur Other Cards That Are Not Moused Over*/

.movie-recommendations .slick-track:hover .movie-card.grid-card.card:not(:hover),
.scene-recommendations .slick-track:hover .scene-card.zoom-1.grid-card.card:not(:hover),
.performer-recommendations .slick-track:hover .performer-card.grid-card.card:not(:hover),
.studio-recommendations .slick-track:hover .studio-card.grid-card.card:not(:hover) {
	filter: blur(2px);
}

/* Hide slick-dots element on Main Page - Less Clutter */
.slick-dots {
	display: none !important;
}

/*Hide the Prev-Next Arrows on Main Page*/
.slick-arrow.slick-prev,
.slick-arrow.slick-next {
	display: none !important;
	width: 0 !important;
	margin: 0 !important;
}

/* CSS for Highlighting Cards on Mouseover - Vertical Wipe Effect */
.grid-card.card {
	position: relative;
	transition: border 0.5s ease, transform 0.5s ease, filter 0.5s ease;
	border-radius: 10px;
}

.movie-card.grid-card.card {
	position: relative;
}


.studio-card.grid-card.card::before,
.movie-card.grid-card.card::before,
.grid-card.card.zoom-1::before,
.performer-card.grid-card.card::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: linear-gradient(to bottom, transparent 50%, rgba(255, 255, 255, 0.5) 150%);
	background-size: 100% 200%;
	transition: background-position 0.5s ease;
	z-index: -1;
	/* Set a lower z-index for the pseudo-element */
}


.grid-card.card.zoom-1:hover::before,
.performer-card.grid-card.card:hover::before,
.movie-card.grid-card.card:hover::before,
.studio-card.grid-card.card:hover::before {
	background-position: 0 -100%;
}

/*This generates the white border around the cards on hover and makes them "pop" with a subtle transform */

.grid-card.card:hover {
	border: 2.5px solid #fff;
	transform: scale(1.01);
	overflow: hidden;
	filter: blur(0);
}

/* Background Studio Grey Banners -- Better Readability */
.studio-logo,
.studio-card-image {
	border-radius: 10px;
	/* Adjust the border-radius for rounded corners */
	background-color: rgba(26, 26, 26, 0.6);
}

/* Centering in .card-section */
.card-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
}

/* Glassy Translucent Effect for .scene-card__date and .performer-card__age */
.scene-card__date,
.performer-card__age {
	background-color: rgba(173, 216, 230, 0.12);
}

/* Global Changes */

/*Hide Donate Button*/
.btn-primary.btn.donate.minimal {
	display: none;
}


/* Scenes Tab Styling */
.scenes-tab {
	padding: 0px !important;
}

/* Studios Tab Styling */
.studios-tab {
	width: 15%;
}


/* Add a background image to the existing background container */
body {
	background-image: url('https://erowall.com/wallpapers/original/33330.jpg');
	background-size: contain;
	background-position: center;
	background-attachment: fixed;
}

/* Create the parallax effect */
body::before {
	content: "";
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: -1;
	background: inherit;
	transform: translateZ(-1px) scale(1.5);
}

/* Styling for Glassy Translucent Effect */
.performer-card-image,
.studio-card-image,
.video-section .thumbnail-section,
.card-section .performer-card.grid-card,
.card-section .studio-card-image,
.card-section .movie-card-image {
	border-radius: 15px;
	overflow: hidden;
}

.studio-image {
	width: 100%;
	display: block;
	text-align: center;
}

.wall-item {
	border: 1px solid rgba(0, 0, 0, 0);
	/* 1px solid black border with 50% transparency */
}

.btn.btn-primary {
	border: 1px solid rgba(50, 50, 50, 0.5);
	/* 1px solid dark grey border with 50% transparency */
}

/* Muted Green Borders for .tasks-panel-queue */
.tasks-panel-queue {
	box-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
	/* Glow effect */

	border-radius: 15px;
	/* Adjust the border-radius for rounded corners */
	margin: 10px 0;
	/* Add some margin for spacing */
	padding: 10px;
	/* Add padding to the container */
}


/* [Gallery tab] Hides the lightbox header and footer to make the image area larger. Mouse reveals them as an overlay to the image*/

.Lightbox-header,
.Lightbox-footer {
	z-index: 9999;
	position: absolute;
	width: 100%;
	opacity: 0;
	background-color: #0008;
	transition: opacity 0.5s ease;
}

.Lightbox-footer {
	bottom: 0;
}

.Lightbox-navbutton {
	opacity: 0;
	transition: opacity 0.5s ease;
}


.Lightbox-navbutton:hover,
.Lightbox-header:hover,
.Lightbox-footer:hover {
	opacity: 1;
}


/* Resize preview button on Images and put them in top left */

.preview-button .preview-button .btn.btn-primary {
	position: absolute;
	top: 0;
	left: 0;
	transform: scale(0.5);
}


/* Magnify Button Hover Effect - Shows a magnify button in the middle of the card on hover */
.fa-icon {
	background-color: transparent;
	border: none;
	outline: none;
	transition: transform 0.2s ease-in-out;
}

.fa-icon:hover {
	transform: scale(1.1);
}

/* Transparent Preview Placeholder in Magnifying Glass - Refactoring The Behaviour and Appearance of the Magnifying Glass */
.preview-button .btn.btn-primary {
	background-color: rgba(0, 0, 0, 0);
	/* Full transparent background */
	/* Add any other styling as needed */
}

/* [Images tab] Don't crop preview thumbnails */

.flexbin>*>img {
	object-fit: inherit;
	max-width: none;
	min-width: initial;
}

/* Main Page - Animate Headers - Vertical Fade-in effect */

@keyframes textAnimation {
	0% {
		opacity: 0;
		transform: translateY(-20px);
	}

	100% {
		opacity: 1;
		transform: translateY(0);
	}
}

.recommendation-row-head h2 {
	margin: 0;
	text-align: center;
	animation: textAnimation 1s ease-in-out;
	/* Adjust the animation duration and timing function as needed */
}

/*Disables Images from Being Input into Performer and Studio Banners*/
.background-image-container>picture {
	display: none;
}

/*Make the fill color of the search bars almost completely transparent*/

.query-text-field.bg-secondary.text-white.border-secondary.form-control path {
	fill: none;
}

/*Studios Back to Top Button Text Centered*/
.sticky.detail-header {
	text-align: center;
}

/*Tags Styling*/
.tag-item.badge.badge-secondary {
	background: rgba(0, 0, 0, 0.8);
	/* Darker background for dark mode, adjust opacity as needed */
	color: #fff;
	/* Text color for dark mode */
	border-radius: 10px;
	/* Adjust the border-radius for rounded corners */
	padding: 10px;
	/* Adjust the padding as needed */
	box-shadow: 0 4px 8px rgba(255, 255, 255, 0.1), 0 0 5px rgba(255, 255, 255, 0.1);
	/* Raised embossed effect */
}

span.tag-item.badge.badge-secondary {
	position: relative;
}

span.tag-item.badge.badge-secondary::before {
	content: "";
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: white;
	opacity: 0;
	border-radius: inherit;
	pointer-events: none;
	z-index: -1;
	transition: opacity 0.3s ease-in-out;
}

span.tag-item.badge.badge-secondary:hover::before {
	opacity: 1;
	animation: pulse 1s infinite;
}

@keyframes pulse {
	0% {
		transform: scale(1);
	}

	50% {
		transform: scale(1.05);
	}

	100% {
		transform: scale(1);
	}
}


/*'+' Symbol on Tags are hidden*/
span.tag-item.badge.badge-secondary button.minimal.ml-2.btn.btn-primary {
	display: none;
}

/*Change Country Flag Location on Performers*/
.performer-card__country-flag {
	position: absolute;
	top: 0;
	left: 0;
	margin: 8px;
	/* Adjust margin as needed */
}


/* [Performers tab] Show a larger image in performer's page for desktop */
.performer-image-container {
	flex: 0 0 2%;
	max-width: 2%;
}


/* Parallax effect for desktop and mobile */
body::before {
	content: "";
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: -1;
	background: inherit;
	transform: translateZ(-1px) scale(1.5);
}

/* Make these have transparent backgrounds - Settings */
.package-manager-toolbar,
.collapsible-section.collapse.show,
div.setting,
div.setting-section {
	background: rgba(0, 0, 0, 0);
}

/* Adjust Task Panel Transparency to be more visible */
#tasks-panel .tasks-panel-queue {
	background: rgba(0, 0, 0, 0.6);
}

/* Strip[ Padding and Margins from Checkboxes on Performers */
.card-check {
	padding: 0;
	margin: 0;
	/* Optional: Remove any margin if applied by default */
}

/*Ratings Banner Color Overhaul*/

/* Rating banner style for rating 1 */
.rating-banner.rating-1 {
    background-color: red;
    color: black;
}

/* Rating banner style for rating 2 */
.rating-banner.rating-2 {
    background-color: orange;
    color: black;
}

/* Rating banner style for rating 3 */
.rating-banner.rating-3 {
    background-color: yellow;
    color: black;
}

/* Rating banner style for rating 4 */
.rating-banner.rating-4 {
    background-color: limegreen;
    color: black;
}

/* Rating banner style for rating 5 */
.rating-banner.rating-5 {
    background-color: green;
    color: black;
}

/*Mobile Overhaul*/

/* Media query for mobile devices */
@media only screen and (max-width: 767px) {

	/* Different background for mobile devices */
	body {
		background-image: url('https://w0.peakpx.com/wallpaper/266/1012/HD-wallpaper-street-night-city-neon-road-cars.jpg');
	}
}

/* Responsive Adjustments */
@media screen and (max-width: 768px) {
	.container {
		padding: 8px;
	}

	.logo {
		font-size: 12px;
	}

	.card {
		padding: 8px;
	}

	.card-title {
		font-size: 14px;
	}

	.card-description {
		font-size: 12px;
	}

	.btn {
		padding: 6px 12px;
		font-size: 12px;
	}
}

/* Media query for mobile devices */
@media only screen and (max-width: 767px) {

	/* Disable animations and hover effects on mobile */
	.movie-recommendations .slick-track,
	.scene-recommendations .slick-track,
	.performer-recommendations .slick-track,
	.studio-recommendations .slick-track,
	.movie-recommendations .slick-track:hover,
	.scene-recommendations .slick-track:hover,
	.performer-recommendations .slick-track:hover,
	.studio-recommendations .slick-track:hover {
		animation: none;
		animation-play-state: running;
		/* Ensure animations are not paused on hover on mobile */
	}
}

/* Apply styles for mobile devices (adjust max-width as needed) */
@media only screen and (max-width: 767px) {
	.VideoPlayer {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 240px;
		/* Adjust the height as needed */
		z-index: 1000;
		/* Adjust the z-index as needed */
	}

	.nav.nav-tabs {
		margin-top: 240px;
		/* Set margin-top equal to the height of VideoPlayer */
		z-index: 1100;
	}
}

/* Apply styles for mobile devices (adjust max-width as needed) */
@media only screen and (max-width: 767px) {
	.scene-header.d-xl-none width: 100%;
	/* Ensure full width on mobile */
}

/* Apply styles for mobile devices (adjust max-width as needed) */
@media only screen and (max-width: 767px) {
	h1 {
		font-size: 24px;
		/* Adjust the font size for h1 on mobile */
	}

	h2 {
		font-size: 22px;
		/* Adjust the font size for h2 on mobile */
	}

	h3 {
		font-size: 18px;
		/* Adjust the font size for h3 on mobile */
	}

	h4 {
		font-size: 18px;
		/* Adjust the font size for h4 on mobile */
	}

	h5 {
		font-size: 16px;
		/* Adjust the font size for h5 on mobile */
	}

	h6 {
		font-size: 14px;
		/* Adjust the font size for h6 on mobile */
	}
}

/* Media query for mobile devices */
@media only screen and (max-width: 767px) {
	.studio-logo {
			{
			background: rgba(0, 0, 0, 0.4);
			/* Darker background for dark mode, adjust opacity as needed */
			color: #fff;
			/* Text color for dark mode */
			border-radius: 10px;
			/* Adjust the border-radius for rounded corners */
			padding: 20px;
			/* Adjust the padding as needed */
			box-shadow: 0 4px 8px rgba(255, 255, 255, 0.1), 0 0 10px rgba(255, 255, 255, 0.1);
			/* Raised embossed effect */
		}
	}

	/* Apply styles for mobile devices (adjust max-width as needed) */
	@media only screen and (max-width: 767px) {
		#studio-page .detail-container {
			margin-bottom: 0;
			/* Adjust margin-bottom as needed to reduce the gap */
		}

		#studio-page .nav.nav-tabs {
			margin-top: 0;
			/* Adjust margin-top as needed to reduce the gap */
		}
	}

	/* Apply styles for mobile devices (adjust max-width as needed) */
	@media only screen and (max-width: 767px) {
		#performer-page .detail-container {
			margin-bottom: 0;
			/* Adjust margin-bottom as needed to reduce the gap */
		}

		#performer-page .nav.nav-tabs {
			margin-top: 0;
			/* Adjust margin-top as needed to reduce the gap */
		}
	}


.performer.performer-video.lazy-load {
	background: rgba(0, 0, 0, 0.4);
	/* Darker background for dark mode, adjust opacity as needed */
	color: #fff;
	/* Text color for dark mode */
	border-radius: 10px;
	/* Adjust the border-radius for rounded corners */
	padding: 20px;
	/* Adjust the padding as needed */
	box-shadow: 0 4px 8px rgba(255, 255, 255, 0.1), 0 0 10px rgba(255, 255, 255, 0.1);
	/* Raised embossed effect */
}

.performer-video.lazy-load {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
}

.performer-video.lazy-load:hover {
    opacity: 1;
}

.tag-card-header video {
    width: auto;
    height: 100%;
    object-fit: cover;
    object-position: center;
}


and add these changes/updates to it:

/* General Styling */
* {
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
    color: white;
    font-weight: 300;
}

/* Header Style */
h1, h2, h3, h4, h5, h6 {
    font-weight: 700;
    font-size: 24px;
}

p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 16px;
}

/* Nav Button Effects */
.nav-item:hover {
    opacity: 0.8;
}

/* Stylized Settings */
/* ... (your existing styles for settings) ... */

/* Additional styling for text inside the containers */
.tasks-panel-queue h2,
.setting-section h2,
.flex-column.nav.nav-pills h2,
.div.card h2 {
    color: #ffcc00;
    font-size: 24px;
}

.tasks-panel-queue p,
.setting-section p,
.flex-column.nav.nav-pills p,
.div.card p {
    color: #ddd;
    font-size: 16px;
}

/* Scrollbar Modification */
::-webkit-scrollbar {
    width: 10px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background: #f0f0f0;
    border: 2px solid #ddd;
    border-radius: 6px;
}
`;
// Themes CSS End

// Themes CSS Begin
const materialize = `
/*
by killhellokitty aka Joshua D Brown
2022, 2023, 2024 
killhellokitty21@gmail.com
GITHUB: https://github.com/killhellokitty/stash-material-ize-theme


                    GNU AFFERO GENERAL PUBLIC LICENSE
                       Version 3, 19 November 2007

 Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.

Full licensing information is included in the repository. A copy of the licence is also included in the repository.
*/
html {
    font-size: 16px;
}

/* *** */

 body {
    font-family: -apple-system, BlinkMacSystemFont, "Roboto Flex", Roboto, "Segoe UI", Oxygen-Sans, Ubuntu, Cantarell, "Liberation Sans", "Helvetica Neue","Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", emoji, math, serif, ui-serif;
    width: 100%;
    height: 100%;
    background: rgb(var(--body-color2));
    background: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjMWEyMDI1Ij48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDVMNSAwWk02IDRMNCA2Wk0tMSAxTDEgLTFaIiBzdHJva2U9IiMxMDE0MTciIHN0cm9rZS13aWR0aD0iMSI+PC9wYXRoPgo8L3N2Zz4=");
    background-color: transparent;
    padding: 0.1px 0 0;
    color: rgb(var(--on-surface));
    text-decoration: none;
    text-decoration-color: transparent;
    text-shadow: var(--ultra-light-text-shadow);
    text-rendering: geometricPrecision;
    filter: none;
    scrollbar-width: auto;
    scrollbar-color: rgba(255,255,255,0.46) rgba(0,0,0,0.12);
    -webkit-font-smoothing: antialiased;
    -webkit-font-smoothing: subpixel-antialiased;
    -moz-osx-font-smoothing: auto;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: 0.025em;
    line-height: 20px;
    transition: background 0.55s ease, background-color 0.55s ease, color 0.2s ease-in, text-decoration-color 0.15s ease-in-out, text-shadow 0.15s ease-in-out, scrollbar-color 0.55s ease;
    -webkit-transition: background 0.55s ease, background-color 0.55s ease, color 0.2s ease-in, text-decoration-color 0.15s ease-in-out, text-shadow 0.15s ease-in-out;
}
@media (max-width: 575.98px) {
    body {
        background: rgb(var(--body-color2));
    }
}

::-webkit-scrollbar {
    width: 9px;
}
body ::-webkit-scrollbar {
    width: 9px;
}
::-webkit-scrollbar-track {
    background: rgb(var(--background));
}
body ::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.12);
}
::-webkit-scrollbar-track-piece {
    background: rgb(var(--background));
}
body ::-webkit-scrollbar-track-piece {
    background: rgba(0,0,0,0.12);
}
::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.46);
    border-radius: 3px;
    border: 0;
    opacity: 1;
    -webkit-transition: background 0.55s ease-in;
}
body ::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.46);
    border-radius: 3px;
    border: 0;
    opacity: 1;
    -webkit-transition: background 0.55s ease-in;
}
::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.52);
}
body ::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.52);
}
::-webkit-scrollbar-corner {
    background-color: rgb(var(--background));
}
body ::-webkit-scrollbar-corner {
    background-color: rgba(0,0,0,0.12);
}

::-webkit-resizer {
    background-color: rgb(var(--body-color2));
}
body ::-webkit-resizer {
    background-color: rgba(0,0,0,0.12);
}

.row {
    margin-right: auto;
    margin-left: auto;
}

[type=number]::-webkit-inner-spin-button {
    height: 46px;
    background: rgb(var(--on-surface-variant)) url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAAADgkQYQAAAAKUlEQVQYlWNgwAT/sYhhKPiPT+F/LJgEsHv37v+EMGkmkuImoh2NoQAANlcun/q4OoYAAAAASUVORK5CYII=) no-repeat center center;
    position: absolute;
    right: 0.037em;
    top: 0.1em;
    width: 2em;
    padding: 0.25em;
    border-radius: 0 3px 3px 0;
    opacity: 1;
} 
[type=number]::-webkit-outer-spin-button {
    height: 28px;
}

h1,
.markdown h1 {
    font-weight: 200;
    font-size: 57px;
    line-height: 64px;
    letter-spacing: -0.25px;
}
h2,
.markdown h2 { 
    font-weight: 400;
    font-size: 45px;
    line-height: 52px;
    letter-spacing: 0;
}
h3,
.markdown h3 {
    font-weight: 400;
    font-size: 36px;
    line-height: 44px;
    letter-spacing: 0;
}
h4,
.markdown h4 { 
    font-weight: 400;
    font-size: 28px;
    line-height: 36px;
    letter-spacing: 0;
}
h5,
.markdown h5 { 
    font-weight: 400;
    font-size: 22px;
    line-height: 28px;
    letter-spacing: 0;
}
h6,
.markdown h6 { 
    font-weight: 500; /* Medium */
    font-size: 16px;
    line-height: 24px;
    letter-spacing: 0.016em;
}

/* RGBA color space var() with HEX after.  Ex. background-color: rgba(var(--color),var(--alpha));*/
:root {
    /* Widget Colors*/
    --nav-color: 56, 72, 87; /*#384857*/
    --nav-color2: 32, 41, 51; /*#202733*/
    --body-color: 19, 26, 30; /*#1B252A*/
    --body-color2: 26, 31, 37; /*#1a2025*/
    --card-color: 37, 53, 64; /*#253240*/
    --card-color-hover: 44, 63, 76; /*#2c384c*/
    --card-color-collaps-show: 30, 43, 52; /*#1e2a34*/
    --card-color-collaps-show-hover: 39, 57, 68; /*#273844*/
    --card-color2: 41, 56, 67; /*#293943*/
    --card-color2-text: 225, 232, 236; /*#e1e8ec*/
    --card-color2-hover: 51, 69, 83; /*#334453*/
    --card-color-sel: 48, 63, 77; /*#30384D*/
    --card-fold: 59, 76, 92; /*#3b4b5c*/
    --date-color: 168, 186, 202; /*#a8baca*/
    --description-color: 227, 238, 249; /*#e3eef9*/
    --btn-primary: 99, 164, 208; /*#63a4d0*/
    --btn-primary-text: 0, 52, 77; /*#00344d*/
    --btn-min-primary: 184, 223, 255; /*#b8dfff*/
    --btn-toggler-color: 238, 247, 255; /*#eef7ff*/
    --tab-active-color: 122, 190, 238; /*#7abeee*/
    --popover-color: 70, 95, 114; /*#466172 --#3c5463*/
    --popover-color2: 80, 108, 130; /*#506e82 --#466172*/ 
    --popover-color3: 60, 82, 98; /*#3c5462*/
    --tooltip-color: 46, 47, 51; /*#2e3133*/
    --menu-color: 50, 62, 72; /*#323e48 should this be named --surface-container? */
    --modal-color: 25, 30, 38; /*#192026*/
    --accordion-color: 64, 80, 97; /*#405261*/
    --accordion-color-hover: 72, 90, 109; /*#485c6d*/ 
    --tables-even: 60, 84, 99;/* #3c5463 */
    --tables-odd: 66, 83, 93;/* #42535d */
    --tables-hover: 84, 108, 128;/*#546c80 */
    /* Primary Colors */
    --pry-color: 136, 206, 255; /*#88ceff*/
    --on-pry: 0, 52, 77; /*#00344d*/
    --pry-container: 0, 76, 110; /*#004c6e*/
    --on-pry-container: 200, 230, 255; /*#c8e6ff*/
    /* Secondary Colors */
    --secondary: 183, 201, 217; /*#b7c9d9*/
    --on-sec: 33, 50, 63; /*#21323f*/
    --sec-container: 56, 73, 86; /*#384956*/
    --on-sec-container: 211, 231, 243; /*#d3e7f3*/
    /* Tertiary Colorsf*/
    --tertiary: 5, 125, 116; /*#057d74 --lch 46.921% 31.12 186.214 --*/
    --on-tertiary:  237, 252, 250; /*#edfcfa*/
    --tertiary-container: 6, 65, 62; /*#06413e*/
    --on-tertiary-container: 197, 246, 245; /*#c5f6f5*/
    /* Split Complementary Colors */
    /*--split-comp: ;*/ /* */
    /*--on-split-comp: ;*/ /* */
    --split-comp-container: 68, 3, 40;/*#440328 */
    --on-split-comp-container: 249, 116, 192; /*#f974c0*/
    /* Compliementary Colors */
    --complement: 174, 121, 250; /*#ae79fa*/
    --on-complement: 75, 19, 156; /*#4b139c -- 24.833, 81.813, 310.395*/
    --complenent-container: ;
    --on-complement-container: ;
    /* Error Colors */
    --error: 255, 180, 171; /*#ffb4ab*/
    --on-error: 105, 0, 5; /*#690005*/
    --error-container: 147, 0, 10; /*#93000a*/
    --error-container-sel: 167, 0, 11; /*#a7000b*/
    --on-error-container: 255, 218, 214; /*#ffdad6*/
    /* Background Colors */
    --background: 25, 28, 30; /*#191c1e*/
    --on-background: 253, 253, 253; /*#fdfdfd*/
    /* Surface & Outline Colors */
    --surface: 30, 36, 42; /*#1e242a*/
    --surface-sel: 33, 41, 47; /*#21292f*/
    --on-surface: 226, 226, 229; /*#e2e2e5*/
    --surface-variant: 65, 71, 77; /*#41474d*/
    --on-surface-variant: 193, 199, 206; /*#c1c7ce*/
    --outline: 139, 145, 152; /*#8b9198*/
    --outline-variant: 69, 71, 73; /*#454749*/
    --outline-variant-lighter: 109, 116, 123; /*#6d747b*/
    /* Link Colors */
    --link-color: 217, 234, 249; /*#d9eaf9 very light primary*/
    --link-hover: 136, 206, 255; /* --pry-color; */
    --link-active: 60, 175, 255; /*#3cafff* richer primary color. */
    --link-visited: 136, 147, 255; /*#8893ff primary's Analogous Color. */
    --link-icon: 10, 148, 244; /*#0a94f4*/
    --link: 10, 148, 244; /* #0a94f4 --- lch 59.684 56.934 272.643 */
    /* Misc Colors */
    --red: 255, 136, 147; /*#ff8893*/
    --green: 7, 255, 227; /*#07ffe3*/
    --twitter-blue: 29, 161, 242; /*#1DA1F2*/
    --twitter-secondary: 20, 23, 26; /*#14171A*/
    --warning: 255, 185, 136; /*#ffb988*/
    --mars: 80, 143, 184; /*#508fb8*/
    --white-color: 248, 255, 254; /*#f8fffe*/
    --nav-white: 246, 247, 249; /*#f6f7f9*/
    --focus-ring: 238, 245, 244; /*#eef5f4*/
    --focus-ring-active: 255, 136, 206; /*#ff88ce*/
    --muted-text: 213, 229, 242; /*#d5e5f2*/
    --interactive-input: 239, 239, 241; /*#efeff1 --- lch 94.498 1.035 290.078*/
    --star-color: 255, 243, 111; /* #fff36f --- lch 94.53 64.926 100.665 */
    --setting-h1: 162, 217, 255; /*#a2d9ff*/
    /* Select Toggle Colors */
    --sec-cntnr-select-hover: 66, 86, 101; /*#425665*/
    --sec-cntnr-select-active: 76, 99, 117; /*#4c6375*/
    --background-select-hover: 37, 41, 44; /*#25292c*/
    /* Alpha's */
    --btn-hover: 0.08;
    --btn-hover-rev: 0.92;
    --btn-hover-highlight: linear-gradient(to right, rgb(255,255,255,0.08), rgb(255,255,255,0.08));
    --btn-active: 0.12;
    --btn-active-rev: 0.88;
    --btn-active-highlight: linear-gradient(to right, rgb(255,255,255,0.11), rgb(255,255,255,0.11));
    --btn-dummy-highlight: linear-gradient(to right, transparent, transparent);
    --disabled: 0.38;
    --btn-background-disabled: 0.12;
    --text-field-tint: 0.06;
    --text-field-text: 0.87;
    --text-screen: 0.35;
    /* Elevation Box-Shadows */
    --elevation-0: 0px 0px 0px 0px rgba(0,0,0,0.2), 0px 0px 0px 0px rgba(0,0,0,0.14), 0px 0px 0px 0px rgba(0,0,0,0.12);
    --elevation-1: 0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12);
    --elevation-2: 0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12);
    --elevation-3: 0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12);
    --elevation-4: 0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12);
    --elevation-5: 0px 8px 10px -6px rgba(0,0,0,0.2), 0px 16px 24px 2px rgba(0,0,0,0.14), 0px 6px 30px 5px rgba(0,0,0,0.12);
    --elevation-0-inverse: inset 0px 0px 0px 0px rgba(0,0,0,0.2), inset 0px 0px 0px 0px rgba(0,0,0,0.14), inset 0px 0px 0px 0px rgba(0,0,0,0.12);
    /* Transitions */
    --trans-0: background-color 0.55s cubic-bezier(0.4, 0, 0.2, 1), background-image 0.55s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s ease-in, outline-color 0.45s ease-in, color 0.25s ease-in-out, text-shadow 0.2s ease-in;
    /* Fonts */
    --HeaderFont: -apple-system, blinkmacsystemfont, OpenSans, "DejaVu Sans", "Roboto Flex", Roboto, "Segoe UI", "Noto Sans", 'Helvetica Neue', Arial, Ubuntu, 'Liberation Sans', Helvetica, sans-serif, system-ui;
    --BodyFont: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto Flex", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Liberation Sans", "Noto Sans", "Helvetica Neue", Arial, Helvetica, sans-serif, "Apple Color Emoji", "Noto Color Emoji", "Segoe UI Emoji", emoji, math, serif, ui-serif, system-ui;
    --MonoFont: "SF Mono", SFMono-Regular, Monaco, Consolas, Hermit, "Inconsolata", "FiraCode Mono", "Roboto Mono", "Source Code Pro", 'Courier New', "Liberation Mono", 'NotoSans Mono', monospace;
    --SerifFont: "Apple Garamond", "Baskerville", "Times New Roman", "Droid Serif", "Times","Source Serif Pro", serif, system-ui;
    --UnicodeFont: "Noto", "FiraCode", "Roboto Flex", Roboto, system-ui;
    --LogoFont: "San Francisco", "DejaVu Sans", Arial, "Helvetica Neue", "Roboto Flex", Roboto, sans-serif, system-ui;
    --light-txt-shadow: 1px 2px 1px rgba(0,0,0,0.22);
    --really-light-txt-shadow: 0.5px 1px 0.5px rgba(0,0,0,0.16);
    --ultra-light-text-shadow: 0.1px 0.1px 0.1px rgba(0,0,0,0.004);
    /* Stash Logo */
    --StashLogo: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAABfGlDQ1BpY2MAACiRfZE9SMNQFIVPU6VFKg52kOKQoTpZEBVx1CoUoUKoFVp1MHnpHzRpSFJcHAXXgoM/i1UHF2ddHVwFQfAHxNHJSdFFSrwvKbSI8cLjfZx3z+G9+wChWWWa1TMOaLptZlJJMZdfFUOvCCAMIIaQzCxjTpLS8K2ve+qmukvwLP++P6tfLVgMCIjEs8wwbeIN4ulN2+C8TxxlZVklPiceM+mCxI9cVzx+41xyWeCZUTObmSeOEoulLla6mJVNjXiKOK5qOuULOY9VzluctWqdte/JXxgp6CvLXKc1jBQWsQQJIhTUUUEVNhK066RYyNB50scfc/0SuRRyVcDIsYAaNMiuH/wPfs/WKk5OeEmRJND74jgfI0BoF2g1HOf72HFaJ0DwGbjSO/5aE5j5JL3R0eJHwMA2cHHd0ZQ94HIHGHoyZFN2pSAtoVgE3s/om/LA4C3Qt+bNrX2O0wcgS7NK3wAHh8BoibLXfd4d7p7bvz3t+f0A2AxyabPxfMUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAZiS0dEACAAKwAzs0pcbAAAAAlwSFlzAAAN1wAADdcBQiibeAAAAAd0SU1FB+YCAQIDHPIdvdgAAAG/elRYdFJhdyBwcm9maWxlIHR5cGUgaWNjAAA4jaVUWW5DIQz85xQ9gvH6OA6Bh9T7X6Bmy9akUltLBDGG8WDmJXyWEj56qGGAHphBi5JWI2AakFY9jQ0F2RgR5JAkGQHsVE9HH8fYCDH7jwWNSkYGHAUEuMAfonnVsNhHVMJ6VfbLCL/cX5VVjHQWirhghuAXA0PjmdCVIDXzDsHG0+4Hu97D27HwvFqBJXg7Rxtnot4OPOBnueJ2h29Bjnci9peZUjHyqgB+4DX+Zn/oUg21zjXtBHsv3ADrCq7uAeeN274aB4eLiT6/0n7JoqKniNA+sNJO4C0ETj5chPRX6xfV7jTx2RPqm3qTsa71Ofd0SwguAnwWEH5WEPNNgcAqhrPYKEKzCLMTaesfhI94UwC3T+IuuoPhycDuKSUivDdkhMLzpNSz9SCUsbY0FLaaYOCXHMdcVyWqZRAVV/FKgbZ5MzraJKT0UilyalNRO8ZrXLTwS0JMNvJ2jDke1QGNbpvrNTvR7jyqx+DFbLMJksZBmjaDLJcH382gTQSZ6jgoPA3GpYyNKaW8KkziJuWd73azn579+qf1zXj/IHo0YvgCnwkgHdTgVlIAACd9SURBVHja7Z15eBzlla/fasnG7GvIAnGcmIDDZoPNalsth3WwZbKSmblbAOGEJHNvcpfJ3Mydmczc525zMwvJXJJYMjBZJ0BYLNuE1Rs2izE7Dlsg7BiMd+NFUtf941fVXV2qbrWkrq6q7vM+j0CWSt1fV9V36nzn/M75wDAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzBaDifpARjJ0N3V4X2nW6C3b2XSQzISwAxAi/DVz5/FwL4JtR3sQu8SMwitgBmAJqa7K1/pVwcDxwHnAocCDwHPAO8AhfDBbs5l0e2rkv44RgyYAWgyNOkdwA3+OAd8CDgV6ABmAScCR3q/3w28DDwCrAbWAb8Ddka9hy0XmgczABmnu6uT0GT3OQD4OHAW0AmcCXwMqGUdsAn4LbAWuB94AngLGAgf6DqwaLEZhKxiBiCD6CnvEnH5PgCcDMxGT/qTgaMZ23XeB7wGPIa8gweB54Gt5YdpPOYdZAszABmgu2sOEUtzgP3QU/0MIA+cDUxGT/+42Aq8gAzBamQYXgP2DjnSgV7zDlKNGYCUclVXPtqxhyOATwEz0aSfCnwYrfMbzQBaGjyJlgpr0dJhExHrkoE2hxtuW5HAMI1KmAFICd3zzwN3IOpX44BjgdPRhD8XOB5F8tPGTuAlFERchYKKvwfeH3KkeQepwAxAglRJ0x2CJvm5aNKfjoxAe9JjHgEuSis+A6zxvp4C3iYq1WjBxEQwA9BAvnLpTAYLkXO4Dbnx0yil6aYAh8c8pE1APwoUtsX8XnuAV4D1KHbwEEo1bi87yottWjCxMZgBiJkqT/kDUcDubJSmm4ECeuNjHI4/Cf18/0NIAzDdG0Mjgog+m4FngQe8sTwBvIEMUjm2XIgNMwAx0N2Vx3FcXLfs9DroSXsqStPNBk5Cqbu4GJEb7o3vFOSF+GnEoxpwyvrR5H8cGYMHgOeQkSh9mBw4BfMO6okZgDpQ5Sk/AZiERDidSJTzcWD/GIezC6n6/EDcOu/f74/wdQ5EcuFzKHkoE1FQMm62Ay8iD2U1Wja8ijyYIZhBGD1mAEZJlUl/JHqyz0JP0VOBDxJfmm4QPdGfQqm4NcAG4F0iUnHDTZYKn6sNOAYFIztRcPIEFKyMm+Dn872YDcizGfL53ME2Fi27rwHDag7MANTIgvl5CtGJ+fHAR9ETMo+emMcBB8U4nB2UnpCriOkJqZLhyFvkcKRFmOV95mmo1qARWoT3KdUt+B7OS8jzqdtnbxXMAFShylP+MPQE9MU409ATMq5I+gBaIz+BXOK1wLMubA5eQNdxcFw3lpt+wbxOCk6kBdyP0jJnDlrmfILaag7GiosyGRso1S08icRJg0OPduhdsqIBw8oOZgACXHFRJ7nxkTd5O/AR4DQ04WciA3BojMPZigJhfpT8ceB1pM0vI4kcendXHjfn4JS7RQ5a7pzqnafZlFcdxs1eJEt+lFKW43lgW9lROcCCiYAZgGpu7kHAJ5FLn0cu/keJLwjmF934N69fdFN+86YwT17FUzqIkqCpE6UbGylo2oLOYbBuIdKIQrrOaaNoSQNQ4YbNoafXVKJr5uOg5rLbrHTpuaprDm504VI7mvzT0VLhXGRg44yVBBkA3kTn2K9beJYcm8qGm0IDGyctYQCqPOX3R+tVv2b+DLSejWv9upuhQpymbrwxTLbkRLRMyFPKljTqntyJzv3D6Fr4dQu7ow5uhmsRRdMagO6uPDg5cEvm3cHFxQnWzM9Gwpex1sxXwhfiPI3SV/d7328kUg9fYNHi1UmfutioUuG4P6XmJXNQQHESCjA2ggLl12kNVa7T+P13ce2NjzT03MVF0xiAq+Z3hJV3Pn7N/AxKYpzJSOgSB7tQWsp/sqzDKuIi6e7Kk3NcCuXXzW9fNg15BrNQyjHuuoggYU/tYeQt7Ig6OMveQaYNQIX+d1Cep+6glKeOI03nC1X8mngJVRw24ZYG5o9ycK/D9XetSPrUpY5hKiODKdfTiTflGsV7KFbzAKVYzRtExGocx6VncXYaqGbKAFw+dxZtucjrPg7dFNMpiXGOJz6lmi9V9aPLvhBnSFccF5dFfdm5IdLAVy7tZDBadTUOyZF9b84XXcXlzUWxD2USHqeUrXkOZRyKFHIuuUL6W6Sl3gCkpGbeL1YJCnGGFKs4rovrpP+iZ42oe8AdHMRpawv3QPTjOY1kG2qR5tctPEqFh4HjQE/KlnypMwBVnvJ+zfxUSmKcONeGW4gW4gwtV3VdepfYU74RXDU/jxsdSTyA8vLqM5G3EGd5dZhBlMb16zLWUqUuY3DA5fo7kr1vUmEAaqyZz6M03UTiiQ6HVWQPIsueeiFOK6PSa8JGwX9YnIaMwUzUYCVO5WYU4crMR7x/p6ZuITEDoAhwjoJblmXxa+b9mvRZyMWLq2Y+rCP3hThDdORttPHjPqsySzPD1G5Mobx46SM0tpGqizyBZyjdb35vhiH3m1uARUvjNwgNMwBVcsDBmvk8pWKSOGrmd6OUnF9J9jBK2TWtEKdVuXJeB44TeXuPR2lhv0eD3wUpzh4NUexBsYJg3cILNLhFWqwGIDJ4g4uD46vA/DTdVOKpmQ8LPHwhTuQeeDcvX8fWnSPtm2FkAQnDCK/Ewx5nB+rl0IguSGFqijm5To5Fi5fX7U3ragCquGB+zXwwTReXDnwXOpHr0KRvSYmnUZnu+fkKu6lxIKUCsE7iLwCrRD+qW3icUjDxMbx7uJ73bN0MQMTkPxStu/w03Wlo3RV3JdiLwHXAUtR0cmjlV4sr8IwSX+7spP3gqiXg09D9+2kUj0qiNftO4Brgr/DiBfUyAnUxAKHJfyrwZUptow5r1FkKUEABvmeQO7UaBVzK2kj50WPzAlqbYbZRn4yyCJ9BS4RGphWD7AK+Avzc/0E97tsxG4AFC6ZTeKvoyU8CfoUCLGnC3/76YWCF9//fY8uClqRKdai/C9NpSFx0NnqINbIOoRq/B76IlrXkXJeFY9SfjNkABKznwcBC4A+TPEM14KIqr6dQJuB+4BnH4d1gLtnJ5XALBTMGTYLSzkT1dTwCLVXPQZN+GnL9G73ur5XlwB+j9OGY788xGYDA5M8BfwH8JclsUjkWdqFKr4eAlSh4+Aq2222mqRLom4DEZNPRhD8L1RM0osNxvbgW+BZefGssRmDUBiC0bvpD9PRP44aVI6GAhEBPIO9gDaoCey/qYPMO0sMV82aTcyKePQ4OLh9AaeeZKPV8CvFVhzaCvcA3gR/5PxjtvTgqA9B9aQcUin96Jlr3T0r6rMSA3377AeQdrEdy4aGNOV1YlIGWXc1EleDdAajByBnoKX+m9+9GVg3GzVvAH6H7ctTe6egMQOnEHwP8Ep3kZsfvKfc4Je/gWdS9dwjmHdSfKq3J/SYip6Cn/Ewk6Imr01NaeBi4DC1ZR3XPjfjkBCb/AcA/AZcnfRYSYhvqOLsWWWG/4+yQJhHjC/tx7dK7kh5vJqkhRXcWSs9NRxLfRuxHkCZ+CnwVr+PUSI3AiAxA6GL8KfA/yNae9XHRjyb/o8g7WIuMw/aog807qEyVCe8Lc6Yij/McVA7eqD0H0sog8J2dm/f97UFHSKIwkvurZgMQujCfAa4nGZFPFtiClgdrkEF4HC0fhlR9FQbhumWtbRCGqeI7nlKK7jSUp09KjJNWNgP/Fljq7XlSsxGoyQBcPreDtlzx0KnAjejCGMOzD1V9rUdLhQdQYLFlKxCrCHH8mpGgEOd47EFTC08DX0B1MORwWNi3Ytg/qskABCz00UiKeH7SnzbDvId6ENyPvIMnkahjSHXi/gMH8IM77kh6vHWhuys/pBiv0J4jN1A4Erny56IU3VQaUzPSjNyKYnLboLaHybAGIDD59wP+Hvha0p+yidiDIrjrkHfgbxSS+RbiwwhxJqGgXQdK0U0m+xqSNOCiuNxf4T1QhjMCVQ1AaG32J8D3sPVXXAQ7xmSugOlbXzyHHXsibw2/5v4kyoU4cfR/MKRduQppc4Dq90pFA9Ddlde2s8q7Xgz8hPhacxlD2U1pg5GVpLCAaZhejp9AQpwOSluuHdDwQbYmv0NFQ4+BpnBPBZFapAFY0NVJofTQmQLchGqhjWTwC5ieRJ6BV8DkvOsGKphyjkPBdWMzBl/5zEwGByOX5m1IiHMqesLPRNLbo2huIU6auRv4V8irrHhPRF6cgGU/AvhnYF7Sn8Yowy9gehB5B49QoYDJwaGnb8Wo32iYfRmOQ5H62WhNH1fHZmN0XAP8F7y2YlFGYIgBCFzwccD/Av5T0p/CqEpUAdMGQpuW1Npcssoei/7uS9MoCXFOQA8JI53sQbG7Xv8H4etfdqVD1v4q4Pu0nrQy6+xA3WWDBUyvE1HA5LguPUtW0d2VZ1zBpT83ZOIfjiZ5sFb+WNJbK28M5Q3gS+jBALj0BraqK17xUNvuTuAXaHMFI7v4BUyPUZIoVyxgQu6737zVF+IcR+M31DDqy1pkBF6Hci/AAVhw5QwK7xQrJSejFML0pEdt1J1tSCm2FhmER1FWYQqlFN2pyPBntVbeiOY64BuEOgs7UOb6H4LWC19MerRG7PgFTLtR8C6OFu1GeugHvg38g/+D3r6VOIHJ3wZ8F/hzLHVjGM3IJpQavAu0SU9QifVHqM+YTX7DaE6OAv4WxXVwcIoG4GykIW6mlkmGYQxlKvA/8WovcmgrpL9D60DDMJqfz6Omorl2lB44MekRGbGxBAWA5lB7Xf1rSEp6Osr9G81FDikEX207/YRJTwC/QRHh/ZD4wyr+moN7UX34T9GOSDtRZV7UTjf9qHPRD4DvOEobPQmchzXkaDbeRmngx5yQ+u9Q1I3lD4ALUKMGUwJmkw1ov4anij9xXHCdTwDzUTfZ05FcdCXq7nwPihQH+QLQgxmBrLMF1YwsRdf5eaA/oAMYsnn6UaiM8xK0M+onMQloVngH9Yi7c+hlLXI46sKzDd0YeyKP0t9/C/jfmGeYNXYhL+4O4E7UNqys2Ux5LcC8Tr/+v4jXEuDDSA8+F22VPAlTiqWV3SjAs9D/QVD62d2VpzA4SK4t+vKFj/UYj9JH/yHpD2cMy16k9rwbPe0fxWsRFqRMCRhFd1cnEY8OB2ULZiFjMAsVh5h2IB24wP9B+zQOwNgbhQSMwOFIJfq5pD+kMYRBtPv1chT0fRB5gWXUVA4cRQVj0Ia6vnQiY3A2avNkJMe/oD3kt0N9ugRdcclscm1FvdjHUZHY2Ul/UANQ4P5+NOlXo+xN+UR12uldfG/FFxjLzkBBxqP2zeehmMEMrE680axB20a/CtDutvOjJfeO7RU9Qtf8TBQw/ETSH7hF2YSaxy4F7kONYUK7UZWX/FajXtuDB9kfNYC8AGUTppKtrZezyO9QxP8R/wf1bgsWsTHMIszIN4rtqKT7DqTj/y2hoK2Ly6IaJ32Quq3du7vypZa1JQ5GBuAi7+skrDFkvdkMXAnc5v8grp6AvhHwEgt/AvxfrAVYXOxGqdw70cR/AjV7KWOs1zqW4J02gXBxy1/+cNRj4BK0VDgBu3nGyj7gTwdcrmn3TnXc3YEjWsb9RywIXC/60a5R9yIXfx3aSAYAxyngurm6XuPYL1yFZcLRaFfXuSiIOBnbCWY0XIM2ad0HjWsNHrimh6J042VJn4gM46KGrqtQMG+NC2+GJ2Zc17ZhlntBVweF0Nt5ruSxSJAyF/WQn4htGFELtwNX4DX/bOS+AF//7LnsHShqwiaizMDMpE9Ixngb9W1cgmTavye0PZwD9MR8XRNx3UL9B31ySGDUgYzBuWiPOGMo61HQ70VQ6KWnwduGhbb+mo4yA59M+sSknC3o2gXluEOatTbSmCe+dqtgDMahZcGnUczgTGxXIp/XULrvfv8HSW0TFlrezUNbxh+V4LlJI7tQPcYdqOhuiBwXkruGiRuAIBXiBRNQ08rzUVrxdFq3MGU78FX0tAUq3zhVNvSoerON9O9Cx1+NNpBt9QKyfaj78t3AMiTH3er/0nXltaVhf8dUGYAgFW7EA9EWZReh/QpPoXWaWQ4Af4mKclwY3eSv9neBv82h85rz3msHVXabDbxfO/DfUfPJ1N5bMRGU4y5F6/ua5LhJkomL1N2Vp5AbJFcoK2DxS5cvRqKjE2nuJ08PKsYpa+scda48HLRUmO39ex2q8XdrMABHe+83Ed3Y/wTc4B8zjBE4BPih996twBuU5LiriJDj7np/L7+898GkxxlJbDqAcmqXJo78tQGtO2dQ0hg0W+nyXai8dyMMM/lL5b/z0L6Ovlrv1yhdV6jBAByLtOWTvB+/jbrJ3ucfF36NBZ+bTaG/mLw5FvgZqhxtRjah3ZqXUEGOO9YIfiUvrt4eRJy5d/9uKIBT9oHG8iH8v+2eOwdyxazJJhRg+Q0US5cvQRqDSWS7dPlpJLbZCOrkGsVVl3bgFvAn/ylIpReU6hYYGcHjP4T6Rl6Gth3ja398Otf+4tHiAQtvWU33/A7Vj6tI5ZsoVjEl6RNYJ7ajjkl+bf0QOS6M7d6uUmdzKBIEjfQaDkucBuBYtLHoeuQivYLcyboYg96ly4vfd3fNCZ6bt4BbgFvJfuny26hV+zPthQEGcu0Vd/p1C8WPdTSarPWeeNOQUbkc2LJvx8FDDuhdvCp4bR/3xv7P3piyyB7gGeSBLSMGOW6FSe9nwWaje3cbsICI3Z/HSpxLgBPQxD8SVaitRZZzDRI9DIT/rh7uTfe8fNSnCpcun4WeamnmfeDfo6KbqucncBPth3Z+uTrisJuRdmCwxiXAKlT+G+Z7wH+lSr+BiE1m/5Hs1IAMUC7HfZiAHDeXcygU3Lie9JORDuYidI9+GN3N96Al3d4sLQFcpG12gI95X/4GhQ8iY7AaGYP+8IkZtWewJLKjzSByXV9AT6S0ly4X0ES+YbjzUfqMDuBeDXRXeM2RGPtqx34DCVh6/PcPj623b2Xw3F+HPLHvkF6Fp4seUquAPmCN6/KmEzoLgwPb6b3jsVG9QYVJvx/apCOPJv0ZRG/IOxjXB4/bAITJoZthItp/8A3KjcFL1NMYRLe32ofW1U8jHfuJwIUomzCNdJQu/xJ19hms9vnLbyp3HuoEVK/gZyUjMAH4GxT4us9lWCMw6H2WiSiQmSY2Ui7HfRlvLVmc/I5L7+LRBbC7u/LgFsAps3sTUJDan/QzqM0bdWs4ZsTEbQCqDdpBruYX0EYFbyJ3605kiX+HJ5OMxxg4gLsbxSjWo1TXqcgQXIj0Bkm4rauAP8Nba1b6vJfP6wj+81SGBv3C1HO55wcFv+TIG+CqrvyQqHfACOxEy4ZjkbozSbZSkuPeTYQcdywR/O6uPI6Tw3W9mJQm//7I6+xE99YMRhYXiWXyQ3oq8BzgGOCz3tdblIzBSmQM9kI8xsArXd6B4hNrkJptOlIenk/jSpdfQIGz14c7sK3kn34QrcvrGfSrxVhMQ41CLwe2VLpDXdfF0VjfpJQZOKnuZ646vhzXzxQ9RR3luN1deXrvmUX3+fd7n7kAmvRT0IYsFyIF62jl7LEZgDiDgJPR5D1mjC/3NhKx3IXctBeIiIaONThy5UXn4IyP7Hrtly5fgi5mXKXL76HJ1DfcZwoYwQkoVvDVGl7/VrTsqiUIOBF5Ih+r4XX/Dj3d+yuNOaRPuAD4CfEHYfdR6o67DD31txZ/641nLJM+ggPQXhr+pD+N+tRGLENdmPqzFgSsh+X6ENDlfW1EF/JOZAyex8vFBvc2GM1JWnTnA8Xvu+fmg+Gqd4A+B/pcGbOZ1L90eS/w1+D0+ads2MlfAHJcjboB1YJD7QZ/JA+Gr6PrsNAf3zBBwbtRQPAH1H8z2kEUVA52x90YPmgskz5im4UDURzp08i4nUb9g8qZXALEMegPoifxJcC7yBjchS74c96anu6uPP2FfYzLjR/Vxe5dWvqbBfPzFNzih3kDuBGl1CZRv9Lla4EfDz/5O0qdlnJ0Af+N5BWPwaDgvRrnsEbgJ8h4/gX1EWm9gZZufSiY/Cqh+88FFo3iXtCYXXyb6L3oQWgZ40/6aURvt1YvMmkAYh04Wk9d7H1tQhVXvjF4dlxu/PvgR2KBUVZfLVwcDh4Cev6+5H39nLGVLt+CCmiqdvW5cl4+eEJrCfqFGelybyTHf5CSUvB5gO75s+ldvLrsoFBm4HvICFwxwnH5vEe5HPdFxtAdN8hQ994B9bc8GaWPz0e9Lg8b5dhHSr286SFkYQlQC0ehNdeF6MZ4DLma9wG/xWEXlDcuHZVnEJ1W7Eeln88i0c4USh2Rhytdfhjt0roFIKdhRhLISfuT7YQYz+doYkNTKSkFN+NGr4wCRmAX8OcoM3Bhje+xAykMlyFjv4E6yHGv6pqDG62yPQTJqs9D1/QUJMttNJn0ABo1+cMciSz0+ahd1hPoZrkP2IDr7oRyKz84UOD6O1aP6E0qGIO93vs9gSri/NLli9BTO1i6/AqK+L8EmnEL+x6JfK9Q0O+vvc82UuL0AHzmo0n9Z0B/1FIACHrUvtT5X9DkimIPmui+HPdx6iDHXTBvNgUvPx+a/Ieia+XfQyeTvDak7jUAPlleAtTCESgiOwc9ZZ9EnsG9SOO9A6CtPVecZPXwDLz9FHehDRweQs07pyGv4EIU2Pw2kkcDlfPO/rjG7Wmnf8LA1xi9yzwSxpId+hpaBvzYH/+QeMCSlXTPz+MUwHXYgMqcf0YpjuLLce9DLn6ZHHe0S7rgkz40ow5DHswF6Gl/EnL500Im04ATURpwUlyDHwPbkDG4x/t6Gm87LaE7LDeuwMJbRuYZ+Jxz4ic5aXJkXPADSO65gWH27wulz+ajllujjTD3IcFVfw1pwI+ja/fRUb7XRuBfe+dWkzWiZ2Forf1vUDpxvTfWNQOD7hvtbeW3aC5XYOHttV+TK+Z3knMj588RlE/6E0lvc5lbUHxlMGtpwLRyKKq0mo0qFp+iZAyeAmcbQKG/5BmQc+m9vfaA0gMbXuCBDS8A0D3/PHCL8al3vS+g8uQv9krUWZyKRDdjSS81YgngEwwKPoerp29P3/Kyg0KZgV+i8/8OngS6OPkrGJBKXP35s+nf5+m2yif/kcgTuxAFbT9F/VORcZDJGECsA68jh6Dc/kxUd/80WiLcjbyErQAUHLq7OgCHXFsbC2+7r+Y3qLY5YyUCJ64RQb8w9fAM/UzFl4HNFYJsQSMwgBSgZb+rlUAvAvrL++wehYKxF6BJP4XsVCb6ZNIANDILUC8ORs1EzkGy1WcoGYMnwNkCUBgcLG2T5Tr0LFlR10GEgn5/g1zUsZJEHwRfq/BtqgQFRy/M6aR4i5XfaR9AUu4LUfznBCTNzSqZNQBZ5iAkAT4LBak2oKDU3SjNuBnAddzihM3hsLBvxZje1H+tQns7uYGBr6O0WqMZiWpwOK5GQcEf+Z9vbLX0HYGhucX/OpJsz6A06Y+neXpEZlIH4A+8GTgQ1WqfgTbF/C0lY/AoXoS6gBt4eo9chBIMiuUGBi5FKbW4y3vjZgLwXaQUvNsFruzKj0iVF9XkpTA4nlzbvg8BMxylWfOozLZZJn2QzHoAzWIAghyA3MvpSAf/HFIf3oWMgRfgK/VBrKW8tLu8vNcP+tVbXpqUEfArFr/kSDDFlfNns2hx5Wh+mXvvD951cB33w8CZubZ9FyEp9nE0/yazZgBSygGo+OM0Sq7uClSstB6vL7zfNAOoHNEuSf38Wvvj6zzWkXYEqrex8IOC/w7Y7EQoBaPce2/WfwQ403Vcf9JPRi20WoXMLgFaif3Rk3sq8BVUtrwCeQbrcHIbcQvgBoyB64lihir96hH0C5OGZqjzCAUFg0KH0FiPAc7CdS5G6dpPkHzhU1KYB5AxJiBp6ymom+uLuIWVyDNYh5/uckrGoM1xGXSdb5BM0C9MHB6Az9eQcfyh/lm8RXKoLuBstKafhQRJrTrpg2TSAMQ68AyxH5KWnoQadr6Imm3cCTwM7lvguIOucymqk4/rhk+DB+Cfj+/qPLj3gDMRpV0vRlqMSZhnGiaTBqCVPYBKjEeS0xORpv8lcFai4qFvEm9NOaTHCBwNfB+cx1FmZRLZ3rwlbswANCHjkSqtUTvnJB0EDNPIz551XG9P4bq/cFr7tBuGUcJ1Y7LHcRoA8wDSRb02BjEaT2EwF0/WM24PwAxAdjEjkB7c9sF9Y3+VCMwDaB3i6gpsxE9cKwCLARhGBojtQWoeQOuQtiyAUTtmAIwxYxM6u2TSAMQ6cMNoITJpAMwDSBcjDQKax5AeMmkAYh24YbQQmTQANvnThQmBsksmDUCsAzeMFiK2nYEsBtA6WBowu5gHYNQFm9TZJJMGwDyAdGExgOySSQMQ68CN2DEjkB7MABhjxiZ0dsmkAbAlQPqwasBskkkDYKSLRu4ObNSXTBoA8wCyi03+dJFJHQCYAUgTNqmzi3kARl2wYqBsonnk1H86mQfQOtiEzi4ugFsYrPsLmwdgRGHGIl24AI5T/208zANoHWxSZ5dMxgBiHbgxKiwGkE0yaQBsCZAubEJnl0wagFgHbsSKGYt0kVkdgN1I6cGUgNkltmsRpwEYAF72/m+kA6sFyBb9wKPAQ3G9QZzbg/cD/xnoAy4DPo32hTeSwSZ1dtgErAB+5f1/U1xvFKcBANgM3IqMwMnAZ4HPACc24L2N0WPGovEMAs8CtwO3AE+ih2iR3r6VdX/TWCahP9Cr5udxFQYcAB73vq4FzkNeQQdweBxjMIZgMYB0sg24H7gRuBt4K3xAHBPfJ9ancM9iDbx77hzIFQOZG4FfAL8GTgM+D3QBn8TKk+PGYgDpwAV+BywBbgbWA3uCB+RwWNi3IvaBNMQN7126vPh9d1fe/3Yv8KD39X3gIuQVnA0c3IhxtRg2qZNnFwro3QTcAbwSPiDOp30UDV+HF5cH8/K4pVvyNaAX+CVwBvBF4A+Ajzd6fAZgxqLevAr8Brn5DwE7g78cGGznhmX3JjKwxAJxPUtKli7gFewCVoCzAtzJwFzgC8AMYP+kxtokWAygsexBKbxfoyD4i4SEcY1+2keRikh80SvoyntnyAWtkb4P3ADMRMuDC4Bjkh5vhrEYQPy8DdyDUnj3A1uDv3RxWNS3IukxFkmFAfDp6Sv3ClzXwXHc7Wi9dCcwBZgPfA6YCoxPeswZwiZ1fPQDT6GU923Ab1FajwN27OH9gyek4mkfRaoMQBD/hHXPy/u3bgHY4H31AHngS8Ac4ANJj7fJMGNRG+8hoc6NwHLg3fAB318Rm4ivLqTWAPj0RscK3kNiiSiBUVvSY04pFgOoD4PAc5QLdvYFD0jr0z6K1BuAIEWvYH7eD6f0A495X9cC56NYwWzgsKTHm0IsBjB6tgFrKAl23gwfkKWJ75MpA+DTuzjSK3gb+BkSVoQFRnZD2zkYDS7wEuWCnd3BA7ZNOJqbbrop6XGOmkwagCBFr6BkCPYAD3hfYYHRQUmPNyO0ekegXcDDlAQ7vw8fkMWnfRSZNwA+/gW5sqsTp5RufRUFDH8BnElJYDQp6fEmQKtP6lp4DQl2bkIK1R3BXzq49PStSnqMdaVpDIBPMMcaEhgtRxHboMBoOiYwiqKVDMVeFEO6GQWVXyCFgp24aDoDEKQUNJwNbg50YV8ErmGowOgjSY83ZlppUtfC28C9KKi3GtgSPqCZJ75PUxsAn97Fq4vfd3d5GQSHbcAySgKjS5HA6BSaV2DU6lmAfuBpJNi5HWlK1LEqBxRaY9IHaQkDEKQUNOzE8/QGgWe8r4WUC4yOSnq8daSVdQDvAauQPHc58E74gN7bW2vi+7ScAfDp7VtR/D4QK9iEijcWI0/gc8gz+BStJTBqhslfQIKdxeiaPkGGBTtx0bIGIEhEKtFvxvgo8P8oCYxmkW2BUTNM7OHYDqxFa/u7gDfCB9jEL2EGIIB/Y1wxN0+u1JvoLeCnKDV0OsoezAOOI1sTaiRjzdLn8nkJWIqu0yOEBDuOW16CbggzABFctzRSabgHPVnWoizCxUhXcBbNKTDKghF4H1iHJv2yvVvee3m/w48sO8Ce9tUxAzAM/g10+bxZtDnFMMArwI+BnyMD8EVkED6W9HirMBIhUNon/+soe3MjUnzuAPAnv4vLoiYT7MSFGYAauX7J/cXvA17BTpRLvg8tCeahJcLpwISkx9xk7EVdpf0OO88T2jLLnvYjxwzAKCjKjufncUotjF4A/gG4HgULL0PBww8nPV6PrMYANiID+yuUymtJwU5cmAEYA4tCVYk5ChTIbUXVY3eg9GFQYDQu6TFnhAGky/A77Dzj/QwHFxfHJn2dMANQJ0qboXTgqt3xIFKdPY3iBXOQV9BJMgKjkcYAkvACNqOn/I1oaTVEsNNsxThJYwagzvQsLt2gIYHRTUh+GhQYTaG1BEZRFNB6PijY2Rs8wJ728WEGIEYiBEb7UFOJ9ZQERl9CRUmHxjyctMUAtqMIvi/YeT18gE38+DED0AD8G/nLn72Q9oHiw+1N4CcMFRhNJr4JmIY04MtIsHMzyuG/H/yl6zosWrIixrc3gpgBaCA33HpX8fuAV7Ab9ZpbA/wjalhyGWpgcmDSY64T7yN13k3AMnBfCtsYe9ongxmAhCgFDTtx3WL/iVeAH6HehmcjQ3ARMLEObznSJUA9vIA3KBfsbC8fikuvBfUSxQxAwvQsXlH8PtCrYCfaXeZe1NTUFxidxtgERo1Y2+9FgTxfsPMcJthJLWYAUkRE0NBFEfK/B65D7c59gdGHRvjycQcB36FcsLM5/JLBEmwjHZgBSCHBJ2R3V57+fTnGjS9sRU/UZWgDlM+gDVFOJjmB0QDqqnMbEu08TVGwI+tlT/t0YwYg5ZRiBXm8UMEg2ofuKRQvmINSiXngyCovVU8h0BbKBTsbwwf02MTPBGYAMkKPJzvO5XJcMXe2/+N30SS8DW2W+jm0eeoU1OWunhRQvUMfWt8/Rkiw097ez49uXZv0qTJGgBmAjFEoFCoJjNZ5Xz8ALkSxgpnAId4xI40B+AZkB+qRfyOK6L8WPtjc/OxiBiDDFDsYzZ9Dzi0G2t9ELc9/BcxA2YMu/PxCbfhbYt2Dcvfr0N4KRcbt5/DDm1ckfQqMMWIGoAm4bvHy4vchgdFqHFbjcg1SG+6q8SXXI0HSy7TQJhmtiBmAJsOfoAsu7aBQcPzp+5L3VSubvC+Ra9222c1Omho/GDER8AoAe4obhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhtHS/H9rDg3TqGByPQAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMi0wMi0wMVQwMjowMToyMiswMDowMKI08DMAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjItMDItMDFUMDI6MDE6MjIrMDA6MDDTaUiPAAAAG3RFWHRpY2M6Y29weXJpZ2h0AFB1YmxpYyBEb21haW62kTFbAAAAInRFWHRpY2M6ZGVzY3JpcHRpb24AR0lNUCBidWlsdC1pbiBzUkdCTGdBEwAAABV0RVh0aWNjOm1hbnVmYWN0dXJlcgBHSU1QTJ6QygAAAA50RVh0aWNjOm1vZGVsAHNSR0JbYElDAAAAAElFTkSuQmCC);
    /* Media Sizes */
    --breakpoint-xs: 0;
    --breakpoint-sm: 576px;
    --breakpoint-md: 768px;
    --breakpoint-lg: 992px;
    --breakpoint-xl: 1200px;
}

/* Toast-Container */
.toast-container { 
    left: 74%;
    top: 1rem;
    z-index: 59000 
}
.toast-container .success{
    background-color: rgb(var(--green));
    color: #001b18;
}
.toast-container .danger{
    background-color: rgb(var(--error));
    color: rgb(var(--on-error));
}
.toast-container .warning{
    background-color: rgb(var(--warning));
    color: #743000;
}
.toast-container .toast-header{
    background-color: transparent;
    border: 0;
    color: rgb(var(--surface));
}
.toast-container .toast-header .close{
    color: rgb(var(--surface));
}

/* Focus is NOT the same as Focus-Visible */
/**:focus:not(:focus-visible), */
*.focus:not(:focus-visible) {
    outline-color: transparent;
    outline-offset: 0;
    outline-style: none;
    outline-width: 0;
    /**/
    box-shadow: none;
}
*:is(:focus-visible) {
    outline-color: rgb(var(--focus-ring));
    outline-offset: -0.10rem;
    outline-style: solid;
    outline-width: 0.19rem;
    /*
    * Background and Foreground Colors *
    background-color: rgba(var( --pry-container));
    color: rgb(var(--on-tertiary-container))
    */
    /**/
    box-shadow: none;
    animation: focus-ring-width-bounce-outer 0.45s cubic-bezier(0.25, 1, 0.5, 1) 0.15s forwards;
}
@keyframes focus-ring-width-bounce-outer {
    0% {
        outline-width: 0.19rem;
    }
    50% {
        outline-width: 0.55rem;
    }
    100% {
        outline-width: 0.30rem;
    }
}
/* - */
code, 
.code {
    font-family: var(--MonoFont);
    font-size: 12px;
    font-weight: 200;
    line-height: 16px;
    letter-spacing: 0.078em;
    font-variant: tabular-nums slashed-zero;
    color: rgb(var(--on-background));
    background-color: rgb(var(--body-color2),0.35);
    border-radius: 3px;
    padding: 0.2em 0.4em;
    text-rendering: optimizeLegibility;
}

small,
.small {
    font-size: 11px;
    font-weight: 200;
    line-height: 16px;
    letter-spacing: 0.048em;
}

a,
a.link,
p > a,
dd > a:link {
    color: rgb(var(--link));
    background-color: transparent;
    text-decoration: none;  
    text-decoration-color: transparent;           
    font-style: normal;
    transition: color .2s ease-in-out, text-decoration-color .2s ease-in-out, text-shadow .25s ease-in;
    outline: 0;
}
a:hover,
a.link:hover,
p > a:hover {
    color: rgb(var(--link));
    text-decoration: solid underline;
    text-decoration-color: currentColor;
    text-decoration-thickness: 10%;
    text-underline-offset: 0.17em;
} 
dd > a:hover,
dd > a:focus,
dd > a:focus:hover {
    color: #1d91e1;
    text-shadow: var(--light-txt-shadow);
    text-decoration: underline;
    text-decoration-color: currentColor;
    text-decoration-style: solid;
    text-underline-offset: 0.28em;
    text-decoration-thickness: 10%;
}
a:focus-visible {
    color: #00f9dd;
    text-shadow: none;
    text-decoration: underline;
    text-underline-offset: 0.2em;
    outline: 0;
}
dd > a:visited {
    color: #AD87DF; /*purple*/
    text-decoration: none;
    outline: none;
}
dd > a:visited:hover,
dd > a:visited:focus,
dd > a:visited:focus:hover {
    color: #CAA1FC;/*purple*/
    text-shadow: none;
    text-decoration: underline;
    outline: none;
}
dd > a:active {
    color: #2dffe7;
    text-shadow: none;
    text-decoration: underline;
    outline: none;
}
dd > a:active:hover,
dd > a:active:focus,
dd > a:active:focus:hover{
    color: #42ffea;
    text-shadow: none;
    text-decoration: underline;
    outline: none;
}

hr {
    border-top: 0;
    border-style: none;
}

::selection {
    background: rgb(var(--on-background));
    color: rgb(var(--background));
    transition: background 0.25s ease, color 0.15s linear;
    -webkit-transition: background 0.25s ease, color 0.15s linear;
}
::-moz-selection {
    background: rgb(var(--on-background));
    color: rgb(var(--background));
    -moz-transition: background 0.25s ease, color 0.15s linear;
}

textarea::selection, 
input::selection {
    background-color: rgb(var(--on-surface-variant));
    color: rgb(var(--surface));
    transition: background 0.25s ease, color 0.15s linear;
    -webkit-transition: background 0.25s ease, color 0.15s linear;
}
textarea::-moz-selection, 
input::-moz-selection {
    background-color: rgb(var(--on-surface-variant));
    color: rgb(var(--surface));
    -moz-transition: background 0.25s ease, color 0.15s linear;
}

select {
    -webkit-appearance: none;
    -moz-appearance: none;
    -ms-appearance: none;
    appearance: none;
    background:transparent;
    background-image: url("data:image/svg+xml;utf8,<svg fill='%23e2e2e5' width='16' height='16' viewBox='0 0 16 16' class='bi bi-caret-down-fill' xmlns='http://www.w3.org/2000/svg'><path d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/></svg>");
    background-repeat: no-repeat;
    background-position: calc( 100% - 16px ) calc(50% + 0.065em);
    background-size: 20px;
}
/*select:hover {
    background-image: url("data:image/svg+xml;utf8,<svg fill='%23e2e2e5' height='30' viewBox='0 0 24 22' width='28' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
}
select:active,
select:focus {
    background-image: url("data:image/svg+xml;utf8,<svg fill='%23d3e7f3' height='30' viewBox='0 0 24 22' width='28' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
}*/
select::-ms-expand { 
	display: none; 
}

select>option:hover {
    box-shadow: inset 0 0 10px 100px #00dfc6 !important;
    color: black !important;
}
option {
    border-color: #accae5 !important;
    box-shadow: inset 0 0 10px 100px #accae5 !important;
    background-color: #2c4a60 !important;
    color: #cae6ff !important;
}
option:disabled {
    opacity: 0.38 !important;
}
option:checked {
    border-color: #accae5 !important;
    background-color: #2c4a60 !important;
    color: #cae6ff !important;
}  

/* ||Autofill Text Entries */
input:not(.login input):autofill,
input:not(.login input):autofill:hover, 
input:not(.login input):autofill:focus {
    -webkit-text-fill-color: rgb(var(--on-pry-container));
    box-shadow: inset 0 0 0px 40rem rgb(var(--pry-container));
    caret-color: rgb(var(--on-pry-container));
}
input:not(.login input):autofill:focus {
    box-shadow: inset 0 0 0 1px rgb(var(--pry-color)), inset 0 0 0px 40rem rgb(var(--pry-container));
}
input:not(.login input)::-webkit-autofill,
input:not(.login input)::-webkit-autofill:hover, 
input:not(.login input)::-webkit-autofill:focus {
    -webkit-text-fill-color: rgb(var(--on-pry-container));
    box-shadow: inset 0 0 0px 40rem rgb(var(--pry-container));
    caret-color: rgb(var(--on-pry-container));
}
input:not(.login input)::-webkit-autofill:focus {
    box-shadow: inset 0 0 0 1px rgb(var(--pry-color)), inset 0 0 0px 40rem rgb(var(--pry-container));
}

#root {
     position: absolute;
     width: 100%;
     height: 100%;
     z-index: 2;
}

/* ||Check-Boxes & Radio */
.grid-card .card-check {
    width: 1.75rem;
    left: 0.8rem;
    margin-top: -8px;
    height: 1.75rem;
}
.grid-card .card-check,
.grid-card .card-check:checked {
    top: 1.3rem;
}
label.form-check-label {
    margin-left: 12px;
}
input[type=radio] {
    appearance: none;
    -moz-appearance: none;
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    display: inline-block;
    position: relative;
}
input[type=checkbox] {
    width: 18px;
    height: 18px;
    border: 0;
    transition: box-shadow 0.35s ease-in-out, accent-color 0.45s ease, outline 0.35s ease-in-out;
    -webkit-transition: box-shadow 0.35s ease-in-out, accent-color 0.45s ease, outline 0.35s ease-in-out;
    /*box-shadow: inset 0 0 0 5rem rgba(var(--white-color),var(--btn-hover));*/
}
:is(.scene-card, .performer-card, .studio-card, .tag-card) input[type=checkbox].card-check.form-control,
:is(.scene-card, .performer-card, .studio-card, .tag-card) input[type=checkbox].card-check.form-control:focus-visible {
    box-shadow: inset 0 0 0 2px rgb(var(--white-color)), inset 0 0 0 5rem transparent;
}
:is(.scene-card, .performer-card, .studio-card, .tag-card) input[type=checkbox].card-check.form-control:checked,
:is(.scene-card, .performer-card, .studio-card, .tag-card) input[type=checkbox].card-check.form-control:checked:focus-visible {
    box-shadow: inset 0 0 0 2px rgb(var(--pry-color)), inset 0 0 0 5rem transparent;
}
.scene-table label input[type=checkbox].form-control,
input[type=checkbox].form-check-input.position-static {
    margin: 0 auto;
    width: auto;
    height: auto;
    vertical-align: middle;
    text-align: center;
    box-shadow: 0 0 0 0.11rem rgb(var(--on-background)), inset 0 0 0 5rem rgb(var(--tables-even));
    outline-offset: 0.16rem;
    outline-width: 0.11rem;
}
input[type=checkbox].form-check-input.position-static {
    box-shadow: 0 0 0 0.11rem rgb(var(--on-surface)), inset 0 0 0 5rem rgb(var(--card-color));
}

.scene-table label input[type=checkbox].form-control:nth-of-type(odd) {
    box-shadow: 0 0 0 0.11rem rgb(var(--on-surface)), inset 0 0 0 5rem rgb(var(--tables-odd));
}
.scene-table label input[type="checkbox"].form-control:hover {
    box-shadow: 0 0 0 0.11rem rgb(var(--on-background)), inset 0 0 0 5rem rgb(var(--tables-hover));
}
.scene-table label input[type=checkbox].form-control:nth-of-type(odd):hover {
    box-shadow: 0 0 0 0.11rem rgb(var(--on-surface)), inset 0 0 0 5rem rgb(var(--tables-hover));
}
input[type=checkbox].form-check-input.position-static:hover {
    box-shadow: 0 0 0 0.11rem rgb(var(--on-surface)), inset 0 0 0 5rem rgb(var(--card-color));
}
.scene-table label input[type="checkbox"].form-control:checked,
.scene-table label input[type="checkbox"].form-control:checked:hover,
.scene-table label input[type="checkbox"].form-control:checked:focus,
input[type=checkbox].form-check-input.position-static:checked,
input[type=checkbox].form-check-input.position-static:checked:hover,
input[type=checkbox].form-check-input.position-static:checked:focus {
    box-shadow: 0 0 0 0.11rem rgb(var(--pry-color)), inset 0 0 0 5rem transparent;
}
table.table.table-striped.table-bordered>tbody>tr:hover>td label input[type="checkbox"].form-control:focus-visible,
table.table.table-striped.table-bordered>tbody>tr:nth-child(odd):hover>td label input[type="checkbox"].form-control:focus-visible {
    accent-color: rgb(var(--body-color2));
}
table.table.table-striped.table-bordered>tbody>tr:hover>td label input[type="checkbox"].form-control:checked:focus-visible,
table.table.table-striped.table-bordered>tbody>tr:nth-child(odd):hover>td label input[type="checkbox"].form-control:checked:focus-visible,
table.table.table-striped.table-bordered>tbody>tr:hover>td label input[type="checkbox"].form-control:checked,
table.table.table-striped.table-bordered>tbody>tr:nth-child(odd):hover>td label input[type="checkbox"].form-control:checked {
    accent-color: rgb(var(--pry-color));
}
.form-check-input {
    margin-top: -0.05rem;
}
input[type=radio]:focus-visible {
    outline-style: none;
    outline-width: 0;
}
input[type=checkbox]:focus-visible {
    outline-color: rgb(var(--focus-ring));
    outline-style: solid;
    outline-width: 0.19rem;
    outline-offset: -0.1rem;
    box-shadow: inset 0 0 0 5rem rgba(var(--white-color),var(--btn-hover));
}
input[type=checkbox]:checked {
    accent-color: rgb(var(--pry-color));
    box-shadow: none;
}
input[type=checkbox]:checked:hover {
    accent-color: #a2d9ff;
}
input[type=checkbox]:checked:focus-visible {
    accent-color: rgb(var(--complement));
    outline-color: rgb(var(--focus-ring));
    outline-style: solid;
    outline-width: 0.19rem;
    outline-offset: -0.1rem;
    box-shadow: none;
}
input[type=checkbox]:disabled {
    accent-color: rgb(var(--pry-color));
    box-shadow: inset 0 0 0 2px rgb(var(--on-surface-variant)), inset 0 0 0 5rem rgb(var(--body-color2));
    opacity: var(--disabled);
}
input[type=checkbox]:disabled:checked {
    accent-color: rgb(var(--pry-color));
    box-shadow: inset 0 0 0 2px rgb(var(--pry-color)), inset 0 0 0 5rem transparent;
    opacity: var(--disabled);
}
    /* New Editor Pages & Tagger-Container Preferences & Modal */
input#ignore-auto-tag[type="checkbox"] {
    box-shadow: inset 0 0 0 2px rgb(var(--on-surface-variant)), inset 0 0 0 5rem rgb(var(--body-color2));
}
input#ignore-auto-tag[type="checkbox"]:hover {
    box-shadow: inset 0 0 0 2px rgb(var(--on-surface)), inset 0 0 0 5rem rgb(var(--body-color2));
}
.tagger-container .collapse.show.card input.form-check-input[type="checkbox"],
input[type="checkbox"]:is(#include-sub-tags, #include-sub-studios).form-check-input {
    box-shadow: inset 0 0 0 2px rgb(var(--on-surface-variant)), inset 0 0 0 5rem rgb(var(--card-color2));
}
.tagger-container .collapse.show.card input.form-check-input[type="checkbox"]:hover,
input[type="checkbox"]:is(#include-sub-tags, #include-sub-studios).form-check-input:hover {
    box-shadow: inset 0 0 0 2px rgb(var(--on-surface)), inset 0 0 0 5rem rgb(var(--card-color2));
}
input#ignore-auto-tag[type="checkbox"]:checked,
.tagger-container .collapse.show.card input.form-check-input[type="checkbox"]:checked,
input[type="checkbox"]:is(#include-sub-tags, #include-sub-studios).form-check-input:checked {
    box-shadow: inset 0 0 0 2px rgb(var(--pry-color)), inset 0 0 0 5rem transparent;
}

/* || Stats Page */
    /* Removes background-image from Stats page */
body:has(.main.container-fluid>div>.stats) {
    background-image: none;
    background-color: rgb(var(--body-color2));
}
.stats .title {
    color: rgb(var(--on-surface));
    text-shadow: var(--light-txt-shadow);
}
p.title {
    margin-bottom: 2rem;
}
.stats .heading {
    color: rgb(var(--on-surface-variant));
    text-shadow: var(--light-txt-shadow);
}
p.heading {
    margin-bottom: 2.3rem;
}
/* || */

.bg-dark {
     background-color: rgb(var(--nav-color2))!important;
}
.form-group .bg-dark {
    background: rgba(10, 20, 25, 0.20)!important;
}
/* --- The space between the Navigation Bar and the rest of the page --- */
.container-fluid {
    margin-top: 73px;
    padding-right: 16px;
    padding-left: 16px;
    width: calc(100% - 88px);
    margin-right: auto;
    margin-left: 88px;
}
.container-fluid:has(*.background-image-container) {
    padding-right: 1px;
    padding-left: 1px;
}
.container, 
.container-xl, 
.container-lg, 
.container-md, 
.container-sm {
    padding-top: 16px;
    padding-right: 16px;
    padding-left: 16px;
}
/*@media (max-width: 575.98px) {
    .container, 
    .container-fluid, 
    .container-xl, 
    .container-lg, 
    .container-md, 
    .container-sm {
        margin-left: auto;
        width: 100%;
        margin-bottom: auto;
    }
}*/
.top-nav {
    padding-left: 16px;
    padding-right: 16px;
    padding-bottom: 0;
    padding-top: 0;
    min-height: 64px;
    width: 100%;
    overflow: hidden;
}

.fixed-bottom, 
.fixed-top {
    top:0 !important;
}
.fixed-top {
    position: fixed !important; 
    box-shadow: var(--elevation-0);
    z-index: 35001;
}

.text-muted {
    color: rgb(var(--muted-text)) !important; 
}
.bg-secondary {
    background: none;
    background-color: unset !important;
}
a.bg-secondary:hover, 
a.bg-secondary:focus, 
button.bg-secondary:hover, 
button.bg-secondary:focus {
    background-color: unset !important;
}
.text-white {
     color: unset !important;
}
.border-secondary {
     border-color: #bec9c5 !important;
}

.order-2 button {
    margin-left: 4px;
}

/* --- Input Boxs --- */
.text-input,  
.text-input[readonly],
input:is(#batch-search-delay, #colorize-color-green, #colorize-color-yellow, #colorize-color-red).query-text-field.bg-secondary.text-white.border-secondary.form-control {
     background-color: rgb(var(--body-color2));
     border: 0;
     border-style: none;
     transition: box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1), border 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
input:is(#batch-search-delay, #colorize-color-green, #colorize-color-yellow, #colorize-color-red).query-text-field.bg-secondary.text-white.border-secondary.form-control {
    border: 1px solid rgb(var(--outline)) !important;
    background-image: linear-gradient(to right, rgba(var(--pry-color),var(--text-field-tint)), rgba(var(--pry-color),var(--text-field-tint))),linear-gradient(to right, rgb(var(--card-color)), rgb(var(--card-color))) !important;
    border-radius: 4px;
    box-shadow: inset 0 0 0 1px transparent;
    margin-left: 30px;
}

.text-input:hover,
input:is(#batch-search-delay, #colorize-color-green, #colorize-color-yellow, #colorize-color-red).query-text-field.bg-secondary.text-white.border-secondary.form-control:hover {
    border: 0;
    border-style: none;
    box-shadow: inset 0 0 0 1px transparent;
    border: 1px solid rgb(var(--on-surface));
}
input:is(#batch-search-delay, #colorize-color-green, #colorize-color-yellow, #colorize-color-red).query-text-field.bg-secondary.text-white.border-secondary.form-control:hover {
    border-color: rgb(var(--on-surface-variant)) !important;
}
.text-input:focus,
.text-input:active,
input:is(#batch-search-delay, #colorize-color-green, #colorize-color-yellow, #colorize-color-red).query-text-field.bg-secondary.text-white.border-secondary.form-control:is(:active, :focus) {
    background-color: rgb(var(--body-color2)) !important; 
    box-shadow: inset 0 0 0 1px rgb(var(--pry-color));
    border: 1px solid rgb(var(--pry-color));
    outline: none;
}
.text-input:not(:focus):focus-visible,
input:is(#batch-search-delay, #colorize-color-green, #colorize-color-yellow, #colorize-color-red).query-text-field.bg-secondary.text-white.border-secondary.form-control:not(:focus):focus-visible {
    color: rgb(var(--focus-ring));
    background-color: rgb(var(--body-color2));
    box-shadow: none;
    border: 1px solid rgb(var(--on-surface));
    outline-color: rgb(var(--focus-ring));
    outline-offset: -1px;
    outline-style: solid;
    outline-width: 0.25rem;
}
.text-input:disabled,
input:is(#batch-search-delay, #colorize-color-green, #colorize-color-yellow, #colorize-color-red).query-text-field.bg-secondary.text-white.border-secondary.form-control:disabled {
    opacity: var(--disabled);
}

.address .text-input:not(:last-child):not(:only-child):first-child:hover,
.address .text-input:not(:last-child):not(:only-child):first-child:focus,
.address .text-input:not(:last-child):not(:only-child):first-child:active {
    margin-right: 4px;
}

.input-group:not(.has-validation)>input.text-input.form-control:not(:first-child):not(:last-child) {
    z-index: 3;
}

.form-control {
    height: 56px;
    padding-left: 16px;
    padding-right: 16px;
    border-radius: 4px;
}
.form-control::placeholder {
    color: rgb(var(--on-surface-variant));
    font-size: 16px;
    font-weight: 400;
    line-height: 24px !important;
    letter-spacing: 0.5px;
}
.form-control:hover::placeholder {
    color: rgb(var(--on-surface-variant));
}
.form-control:focus::placeholder,
.form-control:active::placeholder {
    visibility: hidden;
}

.was-validated .form-control:invalid,
.form-control.is-invalid {
   border: 0;
   background-image: none;
   border-style: none;
   caret-color: rgb(var(--error-container));
   box-shadow: 0 0 0 1px rgb(var(--error-container)), inset 0 0 0 1px transparent;
   transition: box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
}
.was-validated .form-control:invalid:hover,
.form-control.is-invalid:hover {
    border: 0;
    border-style: none;
    box-shadow: 0 0 0 1px rgb(var(--on-error-container)), inset 0 0 0 1px transparent;
}
.was-validated .form-control:invalid:focus,
.form-control.is-invalid:focus,
.form-container .string-list-input.is-invalid > .form-group:focus-within .input-group > input.is-invalid.form-control {
    border: 0;
    border-style: none;
    box-shadow: 0 0 0 1px rgb(var(--error-container)), inset 0 0 0 1px rgb(var(--error-container));
}
.was-validated .form-control:invalid:not(:focus):focus-visible,
.form-control.is-invalid:not(:focus):focus-visible {
    box-shadow: none;
    outline-color: rgb(var(--on-error));
    outline-offset: -1px;
    outline-style: solid;
    outline-width: 0.25rem;
}
.was-validated .form-control:invalid::placeholder, 
.form-control.is-invalid::placeholder {
    color: rgb(var(--error));
}
.was-validated .form-control:invalid:hover::placeholder,
.form-control.is-invalid:hover::placeholder {
    color: rgb(var(--on-error-container));
}

.input-group:not(.has-validation) >input.bg-secondary.text-white.border-secondary.form-control:not(:last-child) {
    border-radius: 4px;
    border: 0;
    border-style: none;
    background-color: transparent !important;
    box-shadow: 0 0 0 1px rgb(var(--outline)), inset 0 0 0 1px transparent;
    margin: 0 0 8px 12px;
    margin-right: -38px;
    padding-right: 42px;
    transition: box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.input-group:not(.has-validation) >input.bg-secondary.text-white.border-secondary.form-control:not(:last-child):hover {
    box-shadow: 0 0 0 1px rgb(var(--on-surface)), inset 0 0 0 1px transparent;
}
.input-group:not(.has-validation) >input.bg-secondary.text-white.border-secondary.form-control:not(:last-child):active,
.input-group:not(.has-validation) >input.bg-secondary.text-white.border-secondary.form-control:not(:last-child):focus {
    box-shadow: 0 0 0 1px rgb(var(--pry-color)), inset 0 0 0 1px rgb(var(--pry-color));
}
.input-group:not(.has-validation) >input.bg-secondary.text-white.border-secondary.form-control:not(:last-child)::placeholder {
    color: rgb(var(--on-surface-variant));
    font-size: 16px;
    line-height: 24px;
    letter-spacing: 0.5px;
    font-weight: 400;
}
.input-group:not(.has-validation) >input.bg-secondary.text-white.border-secondary.form-control:focus:not(:last-child)::placeholder,
.input-group:not(.has-validation) >input.bg-secondary.text-white.border-secondary.form-control:active:not(:last-child)::placeholder {
    visibility: hidden;
}

.modal-body .input-group>input.btn-secondary.form-control {
    background: none !important;
    background-color: transparent !important;
    border: 0;
    box-shadow: 0 0 0 1px rgb(var(--outline)), inset 0 0 0 1px transparent;
    caret-color: rgb(var(--pry-color));
    transition: box-shadow  0.4s ease-in, background-color 0.55s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-body .input-group>input.btn-secondary.form-control:hover {
    border: 0;
    box-shadow: 0 0 0 1px rgb(var(--on-surface)), inset 0 0 0 1px transparent;
}
.modal-body .input-group>input.btn-secondary.form-control:active,
.modal-body .input-group>input.btn-secondary.form-control:focus {
    border: 0;
    box-shadow: 0 0 0 1px rgb(var(--pry-color)), inset 0 0 0 1px rgb(var(--pry-color));
}

.input-group-text {
    border: 0;
    border-style: none;
    color: rgb(var(--on-surface-variant));
    position: relative;
    left: 13px;
    top: -28px;
    font-size: 11px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: 0.5px;
    background-color: rgb(var(--card-color));
    padding-left: 4px;
    padding-right: 4px;
    z-index: 33;
}

.query-text-field-group {
    white-space: nowrap;
    /*overflow: hidden;*/
    height: 64px;
}

input.query-text-field.bg-secondary.text-white.border-secondary.form-control,
input.clearable-text-field.form-control,
input.btn-secondary.search-input.form-control {
    background: none;
    background-color: rgb(var(--body-color2));
    background-image: linear-gradient(to right, rgba(var(--pry-color),var(--text-field-tint)), rgba(var(--pry-color),var(--text-field-tint))),linear-gradient(to right, rgb(var(--body-color2)), rgb(var(--body-color2))) !important;
    border-style: none;
    border: 0;
    border-radius: 5rem;
    padding-right: 46px;
    padding-left: 16px;
    height: 56px;
    margin: 4px 8px;
    font-size: 16px;
    font-weight: 400;
    letter-spacing: 0.5px;
    line-height: 24px;
    box-shadow: none;
    caret-color: rgb(var(--pry-color)); 
    transition: caret-color 0.25s ease-in, background-color 0.55s ease, background 0.55s ease, opacity 0.55s ease, outline 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
input.btn-secondary.search-input.form-control {
    background-color: rgba(227,224,225,0.06)  !important;
}
input.query-text-field.bg-secondary.text-white.border-secondary.form-control:hover,
input.clearable-text-field.form-control:hover,
input.btn-secondary.search-input.form-control:hover {
    background-color: rgb(var(--body-color2)) !important;
    background-image: linear-gradient(to right, rgba(var(--pry-color),var(--btn-hover)), rgba(var(--pry-color),var(--btn-hover))),linear-gradient(to right, rgb(var(--body-color2)), rgb(var(--body-color2))) !important;
    box-shadow: none;
    opacity: 1;
}
input.btn-secondary.search-input.form-control:hover  {
    background-color: rgb(var(--body-color2)) !important;
    background-image: linear-gradient(to right, rgba(var(--pry-color),var(--btn-hover)), rgba(var(--pry-color),var(--btn-hover))),linear-gradient(to right, rgb(var(--body-color2)), rgb(var(--body-color2))) !important;
    opacity: 1;
}
input.query-text-field.bg-secondary.text-white.border-secondary.form-control:focus,
input.query-text-field.bg-secondary.text-white.border-secondary.form-control:active,
input.clearable-text-field.form-control:focus,
input.clearable-text-field.form-control:active,
input.btn-secondary.search-input.form-control:focus,
input.btn-secondary.search-input.form-control:active {
    background-color: rgb(var(--body-color)) !important;
    background-image: linear-gradient(to right, rgba(var(--pry-color),var(--btn-active)), rgba(var(--pry-color),var(--btn-active))),linear-gradient(to right, rgb(var(--body-color2)), rgb(var(--body-color2))) !important;
    box-shadow: 0 0 6px 0 rgb(var(--pry-color));
    opacity: 1;
    outline: none;
    caret-color: rgb(var(--pry-color));
}
input.btn-secondary.search-input.form-control:focus,
input.btn-secondary.search-input.form-control:active {
    background-color: rgb(var(--body-color)) !important;
    background-image: linear-gradient(to right, rgba(var(--pry-color),var(--btn-active)), rgba(var(--pry-color),var(--btn-active))),linear-gradient(to right, rgb(var(--body-color2)), rgb(var(--body-color2))) !important;
    opacity: 1;
}
input.query-text-field.bg-secondary.text-white.border-secondary.form-control:focus-visible:not(:focus),
input.clearable-text-field.form-control:focus-visible:not(:focus),
input.btn-secondary.search-input.form-control:focus-visible:not(:focus) {
    background-color: rgb(var(--body-color)) !important;
    background-image: linear-gradient(to right, rgba(var(--pry-color),var(--btn-hover)), rgba(var(--pry-color),var(--btn-hover))),linear-gradient(to right, rgb(var(--body-color2)), rgb(var(--body-color2))) !important;
    box-shadow: none;
    opacity: 1;
    outline-color: rgb(var(--focus-ring));
    outline-style: solid;
    outline-width: 0.25rem;
    outline-offset: -1px;
}
input.btn-secondary.search-input.form-control:focus-visible:not(:focus) {
    background-color: rgb(var(--body-color)) !important;
    background-image: linear-gradient(to right, rgba(var(--pry-color),var(--btn-hover)), rgba(var(--pry-color),var(--btn-hover))),linear-gradient(to right, rgb(var(--body-color2)), rgb(var(--body-color2))) !important;
    opacity: 1;
}
input.query-text-field.bg-secondary.text-white.border-secondary.form-control::placeholder,
input.clearable-text-field.form-control::placeholder,
input.btn-secondary.search-input.form-control::palceholder {
    color: rgb(var(--on-surface-variant));
    font-size: 16px;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0.5px;
}

.btn-toolbar .query-text-field-group input.query-text-field.bg-secondary.text-white.border-secondary.form-control {
    min-width: 360px;
    max-width: 720px;
}

input#update-stashids.query-text-field.bg-secondary.text-white.border-secondary.form-control {
    padding-right: 16px;
}

.login input[type=text]#username.text-input,
.login input[type=password]#password.text-input {
    background: none !important;
    background-color: transparent !important;
    background-image: none !important;
    border: 1px solid rgb(var(--outline)) !important;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.25px;
    line-height: 20px;
    box-shadow: inset 0 0 0 1px transparent !important;
    caret-color: rgb(var(--pry-color));
    transition: background-color 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease-in;
}
.login input[type=text]#username.text-input:hover,
.login input[type=password]#password.text-input:hover,
.login input[type=text]#username.text-input:focus-visible,
.login input[type=password]#password.text-input:focus-visible {
    background-color: transparent !important;
    background-image: none !important;
    border: 1px solid rgb(var(--on-surface-variant)) !important;
    box-shadow: inset 0 0 0 1px transparent !important;
}
.login input[type=text]#username.text-input:focus,
.login input[type=password]#password.text-input:focus {
    background-color: transparent !important;
    background-image: none !important;
    border: 1px solid rgb(var(--pry-color)) !important;
    box-shadow: inset 0 0 0 1px rgb(var(--pry-color)) !important;
    outline: none;
}

.login input[type=text]#username.text-input:focus-visible:not(:focus),
.login input[type=password]#password.text-input:focus-visible:not(:focus) {
    box-shadow: none !important;
    outline-color: rgb(var(--focus-ring));
    outline-style: solid;
    outline-width: 0.19rem;
    outline-offset: -0.1rem;
}

textarea:autofill::selection, 
input:autofill::selection {
    background-color: rgb(var(--split-comp-container)) !important;
    color: rgb(var(--on-split-comp-container)) !important;
    caret-color: rgb(var(--split-comp-container));
    transition: background-color 0.25s ease, color 0.1s linear;
    -webkit-transition: background-color 0.25s ease, color 0.1s linear;
}
textarea::-webkit-autofill::selection, 
input::-webkit-autofill::selection {
    background-color: rgb(var(--split-comp-container)) !important;
    color: rgb(var(--on-split-comp-container)) !important;
    caret-color: rgb(var(--split-comp-container));
    transition: background-color 0.25s ease, color 0.1s linear;
    -webkit-transition: background-color 0.25s ease, color 0.1s linear;
}

/* Placeholder inside Input Boxes */
input::placeholder {
    color: rgb(var(--on-surface-variant));
    font-size: 16px;
    font-weight: 400;
    line-height: 24px !important;
    letter-spacing: 0.5px;
}
input:-ms-input-placeholder {
    color: rgb(var(--on-surface-variant));
    font-size: 16px;
    font-weight: 400;
    line-height: 24px !important;
    letter-spacing: 0.5px;
}

/* --- Video timeline thumbnails bars --- */
.scrubber-content {
    margin: 0 5px;
    /*height: 103px !important;*/
}
 #scrubber-position-indicator {
     background-color: #fff;
     /*height: 4px;*/
}
.scrubber-tags {
    /*height: 3px;
    margin-bottom: 5px;*/
}
.scrubber-tag {
    background-color: #83cfff;
    z-index: 2;
}
.scrubber-tag:after {
    border-top: 5px solid #83cfff;
}
.scrubber-tags-background {
     background-color: #1c1f1d;
     height: 0;
}
.scrubber-item {
    color: #D7D7d7;
    font-size: 11.5px;
    text-shadow: 1px 1px 1.5px black;
}
#scrubber-current-position {
    background-color: white;
}
#scrubber-forward.scrubber-button.btn.btn-primary {
    border-style: solid;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-width: 0;
    border-right-width: 0;
}
#scrubber-back.scrubber-button.btn.btn-primary{
    border-style: solid;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-width: 0;
    border-left-width: 0;
}
#scrubber-forward.scrubber-button.btn.btn-primary, #scrubber-back.scrubber-button.btn.btn-primary{
    background-color: black;
    margin: 0;
    border-color: black;
    color: #D7D7d7;
    outline: none;
    box-shadow: none;
    text-shadow: none;
    opacity: 0.65;
    font-size: 14px;
}

#scrubber-forward.scrubber-button.btn.btn-primary:hover, #scrubber-back.scrubber-button.btn.btn-primary:hover {
     color: #D7D7d7;
     outline: none;
     box-shadow: none;
     text-shadow: none;
     opacity: 1;
}
#scrubber-forward.scrubber-button.btn.btn-primary.active:hover, #scrubber-forward.scrubber-button.btn.btn-primary:active:hover,
#scrubber-forward.scrubber-button.btn.btn-primary.active:focus, #scrubber-forward.scrubber-button.btn.btn-primary:active:focus,
#scrubber-back.scrubber-button.btn.btn-primary.active:hover, #scrubber-back.scrubber-button.btn.btn-primary:active:hover,
#scrubber-back.scrubber-button.btn.btn-primary.active:focus, #scrubber-back.scrubber-button.btn.btn-primary:active:focus {
     color: #D7D7d7;
     outline: none;
     box-shadow: none;
     text-shadow: none;
     opacity: 1;
}
#scrubber-forward.scrubber-button.btn.btn-primary.active, #scrubber-forward.scrubber-button.btn.btn-primary:active,
#scrubber-back.scrubber-button.btn.btn-primary.active, #scrubber-back.scrubber-button.btn.btn-primary:active {
     color: #D7D7d7;
     outline: none;
     box-shadow: none;
     text-shadow: none;
     opacity: 1;
}

/* --- VideoPlayer Adjustments ---*/
.scene-player-container {
    padding-right: 0;
    margin-top: -0.9%;
}

/* --- Video Overlay Controls --- */
.video-js {
    color: #fff;
    font-family: var(--BodyFont);
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    letter-spacing: 0.15px;
}
.video-js .vjs-slider {
    background-color: #8d8d8d8c;
}
.video-js .vjs-marker {
    background-color: #83cfffcc;
}
.video-js .vjs-volume-vertical {
    background-color: #131513cc;
}
.video-js .vjs-volume-level {
    background-color: #fff;
}
.video-js .vjs-big-play-button:hover, 
.video-js .vjs-big-play-button:focus,
.video-js:hover .vjs-big-play-button {
    /*color: #2FD651;*/
}
.vjs-mouse-display .vjs-volume-tooltip {
    background-color: #131513cc;
}
.vjs-copySave-button {
    justify-content: flex-start;
    column-gap: 12px;
}
.vjs-menu li {
    padding: 8px 12px;
    margin: 0;
    line-height: 20px;
    letter-spacing: 0.1px;
    font-size: 14px;
    font-weight: 500;
}
.vjs-menu-button-popup .vjs-menu .vjs-menu-content {
    background-color: #131513cc;
}
.vjs-playback-rate .vjs-menu {
    width: 6em;
}
.vjs-menu .vjs-menu-content {
    font-family: var(--BodyFont);
    text-align: left;
}
.vjs-menu li > svg {
    font-size: 24px;
}
li#vjs-menu-text:first-of-type {
    border-bottom: 1px solid rgb(var(--surface-variant))
}
.vjs-menu li {
    font-size: 14px;
    padding: 14px 12px;
}
.vjs-menu li.vjs-menu-item {
    min-height: 48px;
    height: 48px;
}

.vjs-menu li.vjs-menu-item:focus, 
.vjs-menu li.vjs-menu-item:hover, 
.js-focus-visible .vjs-menu li.vjs-menu-item:hover {
    background-color: rgb(255,255,255,0.08);
}
.vjs-menu li.vjs-menu-item#vjs-menu-text:focus, 
.vjs-menu li.vjs-menu-item#vjs-menu-text:hover, 
.js-focus-visible .vjs-menu li.vjs-menu-item#vjs-menu-text:hover {
    background-color: transparent;
}
.vjs-menu li.vjs-menu-item.vjs-selected:focus, 
.vjs-menu li.vjs-menu-item.vjs-selected:hover, 
.js-focus-visible .vjs-menu li.vjs-menu-item.vjs-selected:hover {
    background-color: #fff;
}

/* --- Card Section --- */
 .card {
     border-radius: 12px;
     box-shadow: none;
     margin: 4px;
     background-color: rgb(var(--card-color2));
     padding: 16px;
     transition: background-image .55s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s ease-in-out 0s;
}

/* --- Center Titles on Cards --- */
.grid-card a > .card-section-title {
    color: rgb(var(--white-color));
    filter: brightness(98%);
    text-shadow: none;
    text-decoration: none !important;
    min-height: 56px;
    /*line-height: 24px;
    letter-spacing: 0.15px;
    font-size: 16px;
    font-weight: 500;*/
    flex-basis: fit-content;
    align-content: flex-start;
    flex-wrap: wrap;
    transition: color 1.5s ease-in, filter 2s ease-in-out;
}
.performer-card.grid-card a > .card-section-title {
    min-height: 2rem;
    min-height: 2rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}
.grid-card a > .card-section-title:active,
.grid-card a > .card-section-title:active:focus,
.grid-card a > .card-section-title:active:hover,
.grid-card a > .card-section-title:active:hover:focus {
    filter: brightness(116%);
    text-decoration: none !important;
    text-shadow: none;
}
.grid-card a > .card-section-title:focus,
.grid-card a > .card-section-title:hover,
.grid-card a > .card-section-title:hover:focus,
.grid-card a > .card-section-title:focus-visible {
    color: #e0e3e1;
    filter: brightness(110%);
    text-decoration: none !important;
    text-shadow: none;
}
.grid-card a > .card-section-title:focus-visible {
    outline-color: rgb(var(--focus-ring));
    outline-style: solid;
    outline-width: 0.19rem;
    outline-offset: -0.1rem;
}
.scene-card.grid-card:hover,
.scene-card.grid-card:focus,
.scene-card.grid-card:hover:focus,
.studio-card.grid-card:hover,
.studio-card.grid-card:focus,
.studio-card.grid-card:hover:focus,
.performer-card.grid-card:hover,
.performer-card.grid-card:focus,
.performer-card.grid-card:hover:focus,
.gallery-card.grid-card:hover,
.gallery-card.grid-card:focus,
.gallery-card.grid-card:hover:focus,
.image-card.grid-card:hover,
.image-card.grid-card:focus,
.image-card.grid-card:hover:focus {
    background-color: rgb(var(--card-color-sel));
    box-shadow: var(--elevation-1);
    transition: background-color .55s ease, box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0s;
}


.slick-slider {
    border-top: 0;
    margin-bottom: 16px;
}
.slick-list {
    margin: 0;
}

.slick-dots {
    margin-bottom: 24px;
}

.row.justify-content-center {
    margin: 24px;
    background-color: transparent;
    padding-top: 24px;
    padding-bottom: 24px;
    border-radius: 28px;
}
.row.table-list.justify-content-center {
    margin: 24px;
    background-color: #334b46;
    background-color: rgb(var(--tables-even));
    padding-top: 24px;
    padding-bottom: 24px;
    border-radius: 28px;
}

/* --- LOGIN CARD --- */
.login .card:focus-within {
    background-color: rgb(var(--card-color));
    transition: background-color .65s ease;
}

.login-error {
    color: rgb(var(--error));
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0.65px;
    font-weight: 500;
}

/*--- DatePicker ---*/
div.react-datepicker {
    background-color: rgb(var(--popover-color));
    border: 0;
    border-radius: 16px;
    color: rgb(var(--on-surface));
    box-shadow: var(--elevation-3);
    font-family: var(--HeaderFont);
    font-size: 16px;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0.5px;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    align-content: flex-start;
    justify-content: flex-end;
}
div.react-datepicker .react-datepicker__header,
div.react-datepicker .react-datepicker-time__header {
    background-color: rgb(var(--popover-color));
    color: rgb(var(--on-surface));
    border-radius: 16px;
    border-bottom: 0;
}
div.react-datepicker .react-datepicker__header {
    padding: 20px 12px 16px 12px;
    padding-bottom: calc(16px - 0.4rem);
}
div.react-datepicker__month-container {
    padding-bottom: 8px;
}
div.react-datepicker:has(*.react-datepicker__time-container) div.react-datepicker__month-container {
    border-bottom: 1px solid rgb(var(--outline));
}
div.react-datepicker .react-datepicker__month-dropdown-container .react-datepicker__month-read-view, 
div.react-datepicker .react-datepicker__year-dropdown-container .react-datepicker__year-read-view {
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 0.1px;
    color: rgb(var(--on-surface-variant));
    padding-bottom: 30px;
}
div.react-datepicker button.react-datepicker__navigation {
    top: calc(0.4rem + 10px);
}
.react-datepicker__navigation-icon {
    font-size: 32px;
}
.react-datepicker__navigation--next--with-time:not(.react-datepicker__navigation--next--with-today-button) {
    right: 0;
}

.react-datepicker__year-read-view--down-arrow, 
.react-datepicker__month-read-view--down-arrow, 
.react-datepicker__month-year-read-view--down-arrow, 
.react-datepicker__navigation-icon:before {
    border-color: rgb(var(--on-surface-variant));
    border-width: 2px 2px 0 0;
    height: 11px;
    width: 11px;
    top: 8px;
}
.react-datepicker__navigation:hover *:before {
    border-color: rgb(var(--on-surface-variant));
}
div.react-datepicker .react-datepicker__year-dropdown, 
div.react-datepicker .react-datepicker__month-dropdown,
div.react-datepicker .react-datepicker__month-year-dropdown {
    background-color: rgb(var(--popover-color2));
    border: 0;
    color: rgb(var(--on-surface));
    box-shadow: var(--elevation-1);
}
.react-datepicker__day-name, 
.react-datepicker__day, 
.react-datepicker__time-name {
    line-height: 24px;
    margin: 0.446rem;
    width: 24px;
}
/* "Aria-Disabled" ="true" and ="false" within "Not" psuedo-element makes both statements "FALSE!" 
It is neither True nor False, it is "ANYTHING" regardless of the "Aria!" */
div.react-datepicker .react-datepicker__day[aria-disabled="false"],
div.react-datepicker .react-datepicker__day.react-datepicker__day--outside-month[aria-disabled="false"],
div.react-datepicker .react-datepicker__day.react-datepicker__day--disabled,
div.react-datepicker .react-datepicker__day.react-datepicker__day--today,
div.react-datepicker .react-datepicker__day--keyboard-selected, 
div.react-datepicker .react-datepicker__month-text--keyboard-selected, 
div.react-datepicker .react-datepicker__quarter-text--keyboard-selected, 
div.react-datepicker .react-datepicker__year-text--keyboard-selected {
    background-color: rgb(var(--btn-min-primary));
    color: rgb(var(--btn-primary-text));
    border-radius: 5rem;
    font-weight: 400;
    font-size: 16px;
    line-height: 24px;
    letter-spacing: 0.5px;
    padding: 0.446rem;
    margin: unset;
    min-width: calc(0.446rem + 0.446rem + 24px);
    width: calc(0.446rem + 0.446rem + 24px);
    height: calc(0.446rem + 0.446rem + 24px);
}
div.react-datepicker .react-datepicker__day:not([aria-disabled="true"]) {
    color: rgb(var(--on-surface));
    background-color: rgb(var(--popover-color));
}

div.react-datepicker .react-datepicker__day-name {
    color: rgb(var(--on-surface));
    background-color: rgb(var(--popover-color));
    font-size: 16px;
    font-weight: 400;
    letter-spacing: 0.5px;
    line-height: 24px;
}
div.react-datepicker .react-datepicker__day[aria-disabled="false"]:hover, 
div.react-datepicker .react-datepicker__month-text:hover, 
div.react-datepicker .react-datepicker__quarter-text:hover, 
div.react-datepicker .react-datepicker__year-text:hover {
    background-color: rgba(var(--on-surface),var(--btn-hover));
    border-radius: 5rem;
    color: rgb(var(--on-surface));
}
div.react-datepicker .react-datepicker__day.react-datepicker__day--today {
    background-color: rgb(var(--popover-color));
    color: rgb(var(--btn-min-primary));
    box-shadow: inset 0 0 0 1px rgb(var(--btn-min-primary));
}
/* "Aria-Disabled=False" means the "Aria" is ENABLED. */
div.react-datepicker .react-datepicker__day.react-datepicker__day--outside-month[aria-disabled="false"] {
    opacity: 1;
    color: rgb(var(--on-surface-variant));
    background-color: rgb(var(--popover-color));
}
div.react-datepicker .react-datepicker__day.react-datepicker__day--today:hover {
    background-color: rgb(var(--btn-min-primary),var(--btn-hover));
    color: rgb(var(--btn-min-primary));
    box-shadow: inset 0 0 0 1px rgb(var(--btn-min-primary));
}
div.react-datepicker .react-datepicker__day.react-datepicker__day--outside-month[aria-disabled="false"]:hover {
    color: rgb(var(--on-surface-variant));
    background-color: rgb(var(--on-surface-variant),var(--btn-hover));
}
div.react-datepicker .react-datepicker__day.react-datepicker__day--today:focus-visible,
div.react-datepicker .react-datepicker__day.react-datepicker__day--outside-month[aria-disabled="false"]:focus-visible,
div.react-datepicker .react-datepicker__day--keyboard-selected:focus-visible, 
div.react-datepicker .react-datepicker__month-text--keyboard-selected:focus-visible, 
div.react-datepicker .react-datepicker__quarter-text--keyboard-selected:focus-visible, 
div.react-datepicker .react-datepicker__year-text--keyboard-selected:focus-visible {
    color: rgb(var(--on-tertiary-container));
    background-color: rgb(var(--pry-container));
    outline-color: rgb(var(--focus-ring));
    outline-style: solid;
    outline-width: 0.24rem;
    outline-offset: -0.06rem;
}
div.react-datepicker .react-datepicker__day--keyboard-selected:focus-visible, 
div.react-datepicker .react-datepicker__month-text--keyboard-selected:focus-visible, 
div.react-datepicker .react-datepicker__quarter-text--keyboard-selected:focus-visible, 
div.react-datepicker .react-datepicker__year-text--keyboard-selected:focus-visible {
    color: rgb(var(--pry-container));
    background-color: rgb(var(--on-tertiary-container));
}
div.react-datepicker .react-datepicker__day.react-datepicker__day--selected, 
div.react-datepicker .react-datepicker__day--in-selecting-range, 
div.react-datepicker .react-datepicker__day--in-range, 
div.react-datepicker .react-datepicker__month-text--selected, 
div.react-datepicker .react-datepicker__month-text--in-selecting-range, 
div.react-datepicker .react-datepicker__month-text--in-range, 
div.react-datepicker .react-datepicker__quarter-text--selected, 
div.react-datepicker .react-datepicker__quarter-text--in-selecting-range, 
div.react-datepicker .react-datepicker__quarter-text--in-range, 
div.react-datepicker .react-datepicker__year-text--selected, 
div.react-datepicker .react-datepicker__year-text--in-selecting-range, 
div.react-datepicker .react-datepicker__year-text--in-range {
    background-color: rgb(var(--btn-min-primary));
    color: rgb(var(--btn-primary-text));
    border-radius: 5rem;
    font-weight: 400;
    padding: 0.446rem;
    margin: unset;
    min-width: calc(0.446rem + 0.446rem + 24px);
    width: calc(0.446rem + 0.446rem + 24px);
    height: calc(0.446rem + 0.446rem + 24px);
}

div.react-datepicker .react-datepicker__day--selected:hover, 
div.react-datepicker .react-datepicker__day--in-selecting-range:hover, 
div.react-datepicker .react-datepicker__day--in-range:hover, 
div.react-datepicker .react-datepicker__month-text--selected:hover, 
div.react-datepicker .react-datepicker__month-text--in-selecting-range:hover, 
div.react-datepicker .react-datepicker__month-text--in-range:hover, 
div.react-datepicker .react-datepicker__quarter-text--selected:hover, 
div.react-datepicker .react-datepicker__quarter-text--in-selecting-range:hover, 
div.react-datepicker .react-datepicker__quarter-text--in-range:hover, 
div.react-datepicker .react-datepicker__year-text--selected:hover, 
div.react-datepicker .react-datepicker__year-text--in-selecting-range:hover, 
div.react-datepicker .react-datepicker__year-text--in-range:hover,
div.react-datepicker .react-datepicker__day--keyboard-selected:hover, 
div.react-datepicker .react-datepicker__month-text--keyboard-selected:hover, 
div.react-datepicker .react-datepicker__quarter-text--keyboard-selected:hover, 
div.react-datepicker .react-datepicker__year-text--keyboard-selected:hover {
    background-color: rgb(var(--btn-min-primary));
    background-image: var(--btn-hover-highlight);
    color: rgb(var(--btn-primary-text));
}
div.react-datepicker .react-datepicker__day.react-datepicker__day--selected.react-datepicker__day--today {
    color: rgb(var(--btn-primary-text));
    background-color: rgb(var(--btn-min-primary));
    box-shadow: 0 0 0 1px rgb(var(--btn-primary-text));
}
div.react-datepicker .react-datepicker__day.react-datepicker__day--disabled[aria-disabled="true"] {
    color: rgb(var(--on-surface),var(--disabled));
    background-color: rgb(var(--popover-color));
}
/* Time in Calendar */

.react-datepicker__time-container {
    border-left: 0;
    display: flex;
    flex-direction: row-reverse;
    flex-wrap: nowrap;
    justify-content: space-evenly;
    align-items: center;
    width: unset;
    min-width: 120px;
    margin-bottom: 20px;
    margin-top: 20px;
}
div.react-datepicker .react-datepicker__header.react-datepicker__header--time {
    padding: 12px 12px 12px 0;
    line-height: 18px;
}
div.react-datepicker div.react-datepicker__time-container div.react-datepicker__time {
    background-color: rgb(var(--popover-color3));
    color: rgb(var(--on-surface-variant));
    box-shadow: var(--elevation-0-inverse);
    border-radius: 4px;
}
div.react-datepicker .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box {
    width: unset;
    margin-bottom: 0;
    margin-top: 0%;
}
div.react-datepicker .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list {
    height: 65px !important;
}
div.react-datepicker div.react-datepicker__time-container div.react-datepicker__time ul.react-datepicker__time-list li.react-datepicker__time-list-item:hover {
    background-color: rgba(var(--on-surface),var(--btn-hover));
    color: rgb(var(--on-surface));
}
div.react-datepicker div.react-datepicker__time-container div.react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected,
div.react-datepicker div.react-datepicker__time-container div.react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected:hover {
    background-color: rgb(var(--btn-min-primary));
    color: rgb(var(--btn-primary-text));
    font-weight: 500;
}
/* Month/Year Picker */
.react-datepicker__year-option, 
.react-datepicker__month-option, 
.react-datepicker__month-year-option {
    line-height: 32px;
}
.react-datepicker__year-option.react-datepicker__year-option--selected_year,
.react-datepicker__month-option.react-datepicker__month-option--selected_month,
.react-datepicker__month-year-option.react-datepicker__month-year-option--selected_month_year {
    color: rgb(var(--btn-min-primary));
}

.react-datepicker__year-option--selected, 
.react-datepicker__month-option--selected, 
.react-datepicker__month-year-option--selected {
    left: 7px;
}
/* --- Dropdown Menu's --- */
.show > .dropdown-menu.show,
.show.dropdown.btn-group .dropdown-menu.show {
    background: rgb(var(--menu-color)) !important;
    color: rgb(var(--on-surface)) !important;
    padding: 8px 0;
    border: 0;
    border-radius: 4px;
    max-width: 280px;
    min-width: 112px;
    box-shadow: var(--elevation-2);
    will-change: transform, transition;
    overflow: hidden;
    transition: background-color 0.55s ease, outline 0.4s ease-in, box-shadow 0.4s ease-in, transform 0.8s ease;
    z-index: 120001;
}
.btn-toolbar > .show.dropdown.btn-group > .dropdown-menu.show {
    overflow: auto;
}

/* DropDown Menus */
.show > .dropdown-menu.show .dropdown-item {
    font-family: var(--BodyFont);
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 0.1px;
    font-weight: 500;
    display: inline-block;
    justify-content: center;
    vertical-align: middle;
    height: 48px;
    min-height: 48px;
    padding: 0 12px 0 12px;
    contain: paint;
    overflow: hidden;
    transition: background-color 0.55s ease, outline 0.4s ease-in;

}
.show > .dropdown-menu.show .dropdown-item:where(:hover, :focus-visible) {
    background-color: rgba(var(--on-surface),var(--btn-hover)) !important;
    color: rgb(var(--on-surface)) !important;
}
.show > .dropdown-menu.show .dropdown-item:where(:active, :focus, :active:focus),
.show > .dropdown-menu.show .dropdown-item.active, 
.show > .dropdown-menu.show .dropdown-item.active:focus {
    background-color: rgba(var(--sec-container),var(--btn-active)) !important;
    color: rgb(var(--on-surface)) !important;
}
.show > .dropdown-menu.show .dropdown-item:focus-visible {
    outline-color: rgba(var(--secondary),0.95);
    outline-offset: -0.06rem;
    outline-style: solid;
    outline-width: 0.25rem;
    box-shadow: inset 0 0 0 4px rgb(var(--menu-color)), inset 0 0 0 6px rgb(var(--focus-ring));
    color: rgb(var(--focus-ring))  !important;
    text-decoration: none;
    text-decoration-color: transparent;
}
.dropdown.show > .dropdown-menu.show > .dropdown-item > svg {
    font-size: 24px;
    margin: 0 12px 0 0;
    color: rgb(var(--on-surface-variant)) !important;
}
.dropdown.show > .dropdown-menu.show > .dropdown-item > svg.fa-minus.fa-icon {
    padding-right: 1.5px;
    padding-left: 1.5px;
}
:is(.scene-tabs, .btn-toolbar) .dropdown.show .dropdown-menu.show > a.dropdown-item,
.dropdown-menu.show .saved-filter-list > .dropdown-item-container > a.dropdown-item {
    display: flex;
    justify-content: flex-start;
    align-items: center;
}

/* DropDown Filter List Menu */
.saved-filter-list {
    border-bottom: 1px solid rgb(var(--outline-variant));
    padding-bottom: 8px;
    margin-bottom: 8px;
}
.saved-filter-list .dropdown-item-container .dropdown-item {
    color: rgb(var(--on-surface));
}
.saved-filter-list .dropdown-item-container>a.dropdown-item:hover {
    background-color: transparent !important;
}
.saved-filter-list .dropdown-item-container:nth-child(1n+1):hover {
    background-color: rgba(var(--on-surface),var(--btn-hover)) !important;
}

.saved-filter-list .dropdown-item-container .btn-group {
    align-items: center;
}

.show>.saved-filter-list-menu.show .input-group-append > button.btn.btn-secondary > svg.svg-inline--fa.fa-floppy-disk.fa-icon {
    font-size: 24px;
}
.saved-filter-list button.save-button.btn.btn-secondary.btn-sm {
    font-size: 18px;
}
.saved-filter-list button.delete-button.btn.btn-secondary.btn-sm > svg.svg-inline--fa.fa-xmark.fa-icon {
    font-size: 22px;
    min-height: 18px;
}

.show > .saved-filter-list-menu.show .input-group-append button.btn.btn-secondary,
.saved-filter-list button:is(.save-button, .delete-button).btn.btn-secondary.btn-sm {
    background-color: transparent;
    box-shadow: none;
    border: 0;
    color: rgb(var(--on-surface-variant));
    padding: 0;
    border-radius: 5rem;
    width: 40px;
    max-width: 40px;
    height: 40px;
    max-height: 40px;
    margin-right: 12px;
    transition: background-color 0.55s ease, box-shadow 0.4s ease-in;
}
.show>.saved-filter-list-menu.show .input-group-append button.btn.btn-secondary {
    justify-content: center;
    margin-top: auto;
    margin-bottom: auto;
    position: relative;
    left: -4px;
    top: -5%;
    font-size: 18px;
    width: 40px;
    min-width: 40px;
    height: 40px;
    z-index: 12;
}
.saved-filter-list-menu button.set-as-default-button.btn.btn-secondary.btn-sm {
    padding-left: 24px;
    padding-right: 24px;
    margin-left: 12px;
    margin-top: 0;
    border: 0;
    background-color: transparent;
    box-shadow: none;
    color: rgb(var(--on-surface-variant));
    height: 32px;
    max-height: 32px;
    width: auto;
    float: left;
    transition: background-color 0.55s ease, box-shadow 0.4s ease-in;
}
.show > .saved-filter-list-menu.show .input-group-append button.btn.btn-secondary:is(:hover, :focus-visible),
.saved-filter-list button:is(.save-button, .delete-button).btn.btn-secondary.btn-sm:is(:hover, :focus-visible) {
    background-color: rgb(var(--on-surface-variant),var(--btn-hover));
    box-shadow: var(--elevation-0);
}   
.saved-filter-list-menu button.set-as-default-button.btn.btn-secondary.btn-sm:hover {
    background-color: rgb(var(--pry-color),var(--btn-hover));
    box-shadow: var(--elevation-0);
}
.show > .saved-filter-list-menu.show .input-group-append button.btn.btn-secondary:is(:active, :focus:not(:focus-visible), :active:focus),
.saved-filter-list button:is(.save-button, .delete-button).btn.btn-secondary.btn-sm:is(:active, :focus:not(:focus-visible), :active:focus) {
    background-color: rgb(var(--on-surface-variant),var(--btn-active));
    outline: 0;
    box-shadow: var(--elevation-0);
}
.saved-filter-list-menu button.set-as-default-button.btn.btn-secondary.btn-sm:is(.active, :active, :focus:not(:focus-visible), :active:focus) {
    background-color: rgb(var(--pry-color),var(--btn-active));
    outline: 0;
    box-shadow: var(--elevation-0);
}
.show > .saved-filter-list-menu.show .input-group-append button.btn.btn-secondary:focus-visible,
.saved-filter-list button:is(.save-button, .delete-button).btn.btn-secondary.btn-sm:focus-visible,
.saved-filter-list-menu button.set-as-default-button.btn.btn-secondary.btn-sm:focus-visible {
    background-color: rgb(var(--on-tertiary));
    color: rgb(var(--tertiary));
}

.saved-filter-list button:is(.save-button, .delete-button).btn.btn-secondary.btn-sm:is(:disabled, .disabled),
.saved-filter-list-menu button.set-as-default-button.btn.btn-secondary.btn-sm:is(:disabled, .disabled) {
    opacity: var(--disabled);
}
.show>.saved-filter-list-menu.show .input-group-append button.btn.btn-secondary:disabled,
.show>.saved-filter-list-menu.show .input-group-append button.btn.btn-secondary.disabled {
    visibility: hidden;
}
/* */

.badge-info {
    background-color: #87a6bd;
}

a.tag-list-anchor {
    color: #dcf6f0;
}
a.tag-list-anchor:hover {
    color: #c0ebe2;
}
a.tag-list-anchor:focus-visible {
    color: #c0ebe2;
    text-shadow: none;
}
a.tag-list-anchor:active {
    opacity: #c0ebe2;
}

button.tag-list-button.btn.btn-secondary {
    margin-top: 4px;
    margin-bottom: 4px;
}
button.tag-list-button.btn.btn-secondary:not(:has(>.tag-list-anchor)) {
    background-color: transparent;
    border-radius: 8px;
}
button.tag-list-button.btn.btn-secondary:has(>.tag-list-anchor) {
    background-color: #3f4946;
    color: #bec9c5;
    border-radius: 8px;
}
button.tag-list-button.btn.btn-secondary:not(:has(>.tag-list-anchor)):hover:not(:disabled):not(.disabled),
button.tag-list-button.btn.btn-secondary:not(:has(>.tag-list-anchor)):focus:not(:disabled):not(.disabled),
button.tag-list-button.btn.btn-secondary:not(:has(>.tag-list-anchor)):focus-visible:not(:focus):not(:disabled):not(.disabled) {
    background-color: #1c3530;
}
button.tag-list-button.btn.btn-secondary:has(>.tag-list-anchor):hover:not(:disabled):not(.disabled),
button.tag-list-button.btn.btn-secondary:has(>.tag-list-anchor):focus:not(:disabled):not(.disabled),
button.tag-list-button.btn.btn-secondary:has(>.tag-list-anchor):focus-visible:not(:focus):not(:disabled):not(.disabled) {
    background-color: #485450;
}
button.tag-list-button.btn.btn-secondary:not(:has(>.tag-list-anchor)):active:not(:disabled):not(.disabled),
button.tag-list-button.btn.btn-secondary:not(:has(>.tag-list-anchor)):active:hover:not(:disabled):not(.disabled),
button.tag-list-button.btn.btn-secondary:not(:has(>.tag-list-anchor)):active:focus:not(:disabled):not(.disabled),
button.tag-list-button.btn.btn-secondary.active:not(:has(>.tag-list-anchor)):not(:disabled):not(.disabled),
button.tag-list-button.btn.btn-secondary.active:not(:has(>.tag-list-anchor)):hover:not(:disabled):not(.disabled),
button.tag-list-button.btn.btn-secondary.active:not(:has(>.tag-list-anchor)):focus:not(:disabled):not(.disabled) {
    background-color: #334b46;
}
button.tag-list-button.btn.btn-secondary:has(>.tag-list-anchor):active:not(:disabled):not(.disabled),
button.tag-list-button.btn.btn-secondary:has(>.tag-list-anchor):active:hover:not(:disabled):not(.disabled),
button.tag-list-button.btn.btn-secondary:has(>.tag-list-anchor):active:focus:not(:disabled):not(.disabled),
button.tag-list-button.btn.btn-secondary.active:has(>.tag-list-anchor):not(:disabled):not(.disabled),
button.tag-list-button.btn.btn-secondary.active:has(>.tag-list-anchor):hover:not(:disabled):not(.disabled),
button.tag-list-button.btn.btn-secondary.active:has(>.tag-list-anchor):focus:not(:disabled):not(.disabled) {
    background-color: #515e5a;
}
button.tag-list-button.btn.btn-secondary:has(>.tag-list-anchor):focus-visible:not(:focus):not(:disabled):not(.disabled),
button.tag-list-button.btn.btn-secondary:not(:has(>.tag-list-anchor)):focus-visible:not(:focus):not(:disabled):not(.disabled) {
    outline-color: #dffffb;
    outline-style: solid;
    outline-width: 3px;
    outline-offset: 2px;
}
button.tag-list-button.btn.btn-secondary.disabled:has(>.tag-list-anchor),
button.tag-list-button.btn.btn-secondary:has(>.tag-list-anchor):disabled,
button.tag-list-button.btn.btn-secondary.disabled:not(:has(>.tag-list-anchor)),
button.tag-list-button.btn.btn-secondary:not(:has(>.tag-list-anchor)):disabled {
    opacity: 0.4;
}

.tag-list-row.row button.btn.btn-danger {
    margin-top: 4px;
    margin-bottom: 4px;
}
.tag-list-row.row>a:not(:has(>.tag-list-anchor)) {
    font-weight: 500;
    font-size: 16px;
    line-height: 24px;
    letter-spacing: 0.5px;
}

.invalid-feedback {
    color: #ffb4ab;
    margin-top: 4px;
    font-size: 11px;
    padding-left: 16px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: 0.5px;
}

/* Button-Small */
.btn-sm,
.btn-group-sm>.btn {
    font-size: 11px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: 0.5px;
}
/* */
.addresses .btn-sm {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    margin-left: -1px;
}

/* --- Navbar Brand --- */
.navbar-brand > a:focus-visible {
    outline: none;
}
@media (min-width: 577px) {
.top-nav > .navbar-brand > a > button.minimal.brand-link.btn.btn-primary:where(:only-of-type, :hover, :focus, :active, :active:focus, :focus-visible) {
    font-weight: 400;
    color: transparent;
    font-size: 32px;
    font-family: var(--LogoFont);
    /* line-height: 40px; */
    letter-spacing: 0.85px;
    text-indent: 22px;
    position: relative;
    background-color: transparent;
    background-image: var(--StashLogo);
    background-position: 0% 50%;
    background-repeat: no-repeat;
    background-size: 62px 62px;
    /* padding: 0 24px 0 68px; */
    box-shadow: none !important;
    /* text-decoration: underline; */
    /* text-decoration-color: rgb(var(--nav-color2)); */
    /* text-decoration-thickness: from-font; */
    /* text-underline-offset: 0.11em; */
    overflow: visible;
    outline: none;
    will-change: text-decoration, color, animation, transition;
    /* top: 0%; */
    /* margin-left: -19%; */
    /* left: 0%; */
    z-index: 1;
    opacity: 1;
    transition: var(--trans-0);
    }
}
@media (max-width: 576px) {
    .top-nav > .navbar-brand > a > button.minimal.brand-link.btn.btn-primary, 
    .top-nav > .navbar-brand > a > button.minimal.brand-link.btn.btn-primary:is(:hover, :focus, :active, :active:focus, :focus-visible) {
    font-weight: 400;
    font-size: 32px;
    color: transparent;
    position: relative;
    background-color: transparent;
    background-image: var(--StashLogo);
    background-position: 0% 50%;
    background-repeat: no-repeat;
    background-size: 60px 60px;
    box-shadow: none !important;
    overflow: visible;
    outline: 0;
    will-change: background-image, transition;
    z-index: 1;
    opacity: 1;
    transition: var(--trans-0);
    }
}
.top-nav > .navbar-brand > a > button.minimal.brand-link.btn.btn-primary:is(:hover, :focus-visible) {
    color: rgb(var(--btn-min-primary));
}
.top-nav > .navbar-brand > a > button.minimal.brand-link.btn.btn-primary:focus-visible {
    text-decoration-color: rgb(var(--btn-min-primary))!important;
    text-decoration: underline;
    text-decoration-thickness: 0.07em;
    text-underline-offset: 0.15em;
}
.top-nav > .navbar-brand > a > button.minimal.brand-link.btn.btn-primary:is(:active, :focus, :active:focus) {
    color: rgb(var(--pry-color));
    outline: none;
}

@media (min-width: 577px) {
    .top-nav > .navbar-brand,
    .top-nav:not(:has(>.show)) > .navbar-brand {
        color: transparent;
        border-style: none;
        position: relative;
        margin-right: 2%;
        margin-left: 0.15%;
        top: 0px;
        z-index: 19;
    }
}
@media (max-width: 576px) {
    .top-nav > .navbar-brand,
    .top-nav:not(:has(>.show)) > .navbar-brand {
        margin-right: 2%;
        margin-left: 11%;
        color: transparent;
        order-style: none;
        position: relative;
        top: 0px;
        z-index: 19;
        will-change: margin-right, margin-left;
    }
}
.top-nav:has(.navbar-buttons a[href*="/new"]):not(:has(>.show)) > .navbar-brand {
    top: unset;
}
.top-nav:has(>.collapse.show) > .navbar-brand {
    top: 1px;
    justify-content: center;
    align-content: space-between;
    transform: translate(1px);
    transition: transform 0s, top 0s;
    will-change: transition;
    z-index: 1199;
}
/*@media (min-width: 1200px) {
    .navbar-dark .navbar-brand {
    }
}
@media (min-width: 1200px) {
    .navbar-expand-xl .navbar-collapse {
        display: flex !important;
        flex-basis: auto;
        justify-content: flex-start !important;
    }
}*/
@media (max-width: 576px) {
    .top-nav {
         bottom: unset;
         top: auto;
    }
}


/* part of fix for collapsing navbar */
@media (min-width: 576px) {
    .navbar-expand-xl .navbar-collapse {
        display: initial;
        flex-basis: 100%;
    }
}
@media (min-width: 576px) {
    .navbar-expand-xl {
        flex-flow: row wrap;
        justify-content: flex-start;
    }
}
@media (min-width: 576px) {
    .navbar-expand-xl .navbar-toggler {
        display: revert;
    }
}
@media (min-width: 576px) {
    .navbar-expand-xl .navbar-collapse.collapse:not(.show) {
        display: flex;
        overflow-y: auto;
        max-height: 100%;
        max-width: 88px;
        position: fixed;
        z-index: 10;
        padding: 73px 2px 0 2px;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        flex-wrap: wrap;
        align-content: flex-start;
        will-change: transform;
        transition: all 0s;
    }
}
@media (max-width: 576px) {
    .navbar-expand-xl .navbar-collapse.collapse:not(.show) {
        overflow-x: auto;
        max-height: 0;
        height: 88px;
        max-width: 100%;
        display: grid;
        place-items: center;
        top: unset;
        bottom: 0;
        left: 0;
        right: 0;
        margin: auto 0 0 0;
        transform: translate(0%, 0%);
        transition: all 0s;
        will-change: transition;
    }
}
.top-nav .navbar-collapse {
    justify-content: space-evenly;
}
/* *** */

@media (min-width: 576px) {
    .ml-sm-2, 
    .mx-sm-2 {
        margin-left: unset !important;
    }
}

/* ||Detail and Edit Pages */
.detail-body {
    margin-left: 1px;
    margin-right: 1px;
}
.tab-content {
    padding-right: 16px;
    padding-left: 16px;
}

/* ||Primary Button */
button:not([title=Help]).btn-primary,
.login .btn.btn-primary {
     color: rgb(var(--on-tertiary));
     background-image: none;
     background-color: rgb(var(--tertiary));
     font-size: 14px;
     font-weight: 500;
     border: 0;
     border-radius: 5rem;
     gap: 8px;
     display: inline-flex;
     justify-content: center;
     align-items: center;
     height: 40px;
     line-height: 20px;
     letter-spacing: 0.185px;
     padding-left: 24px;
     padding-right: 24px;
     box-shadow: var(--elevation-0);
     outline: 0;
     position: relative;
     overflow: hidden;
     opacity: 1;
     transition: background-color 0.55s cubic-bezier(0.4, 0, 0.2, 1), background-image 0.55s cubic-bezier(0.4, 0, 0.2, 1), outline 0.4s ease-in, box-shadow 0.4s ease-in, opacity 0s linear;
     -webkit-transition: background-color 0.55s cubic-bezier(0.4, 0, 0.2, 1), background-image 0.55s cubic-bezier(0.4, 0, 0.2, 1), outline 0.4s ease-in, box-shadow 0.4s ease-in, opacity 0s linear;
}
@media (min-width: 1200px) {
    .details-divider button {
        color: rgb(var(--on-tertiary));
    }
}
button:not([title=Help]).btn.btn-primary:where(.disabled, :disabled, .disabled:hover, :disabled:hover) {
    color: rgb(var(--on-surface),var(--disabled));
    background-image: linear-gradient(to right, rgb(var(--body-color2)), rgb(var(--body-color2)));
    background-color: rgb(var(--on-surface),var(--btn-background-disabled));
    background-blend-mode: screen;
    box-shadow: var(--elevation-0);
}
button:not([title=Help]).btn-primary:not(:disabled):not(.disabled):hover,
.login .btn.btn-primary:hover {
    color: rgb(var(--on-tertiary));
    background-image: var(--btn-hover-highlight);
    background-color: rgba(var(--tertiary));
    background-blend-mode: screen;
    box-shadow: var(--elevation-1);
}
button:not([title=Help]).btn-primary:not(:disabled):not(.disabled):focus-visible,
.login .btn.btn-primary:focus-visible {
    background-image: none;
    background-color: rgba(var(--split-comp-container));
    color: rgb(var(--on-split-comp-container));
    box-shadow: none;
    outline-color: rgb(var(--focus-ring));
    outline-style: solid;
    outline-width: 0.19rem;
    outline-offset: -0.1rem;
}
button:not([title=Help]).btn-primary:not(:where(:disabled, .disabled)):is(:focus, .active, .active:focus, :active, :active:focus),
.login .btn.btn-primary:is(:focus, .active, .active:focus, :active, :active:focus) {
    color: rgb(var(--on-tertiary));
    background-image: var(--btn-active-highlight);
    background-color: rgba(var(--tertiary));
    background-blend-mode: screen;
    box-shadow: var(--elevation-0);
}
.login .btn.btn-primary { 
    margin: 0;
}
/* * */

/* Shrink Margin between Unmatched and Batch-buttons */
.tagger-container-header > .d-flex > .w-auto + .d-flex .ml-1 {
    margin-left: 0%;
}
.tagger-container .d-flex > .w-auto + .d-flex > button.btn.btn-primary {
    margin-left: 1rem !important;
}

/* Tagger-Container Settings Button */
.tagger-container > .tagger-container-header > div > div.d-flex > div.ml-2 > button.btn.btn-primary {
    padding: 0;
    border-radius: 5rem;
    width: 40px;
    margin-left: 8px;
}

button:is(#batch-result-toggle-off, #batch-result-toggle-mixed, #batch-result-toggle-on).btn.btn-primary {
    border: 0;
    background-color: rgb(var(--sec-container));
    color: rgb(var(--on-sec-container));
    box-shadow: var(--elevation-0);
    outline: none;
}
button:is(#batch-result-toggle-off, #batch-result-toggle-mixed, #batch-result-toggle-on).btn.btn-primary:hover {
    background-image: var(--btn-hover-highlight);
    background-color: rgb(var(--sec-container));
    background-blend-mode: screen;
}
button:is(#batch-result-toggle-off, #batch-result-toggle-mixed, #batch-result-toggle-on).btn.btn-primary:focus-visible {
    background-image: var(--btn-hover-highlight);
    background-color: rgb(var(--sec-container));
    background-blend-mode: screen;
    outline-color: rgb(var(--focus-ring));
    outline-style: solid;
    outline-width: 0.19rem;
    outline-offset: -0.1rem;
}
button:is(#batch-result-toggle-off, #batch-result-toggle-mixed, #batch-result-toggle-on).btn.btn-primary:not(:disabled):not(.disabled):is(:focus:not(:focus-visible), .active, :active, .active:focus, :active:focus) {
    background-image: var(--btn-active-highlight);
    background-color: rgb(var(--sec-container));
    background-blend-mode: screen;
}
button:is(#batch-result-toggle-off, #batch-result-toggle-mixed, #batch-result-toggle-on).btn.btn-primary:is(.disabled, :disabled) {
    background-color: rgb(var(--sec-container),var(--disabled));
    color: rgb(var(--on-sec-container),var(--disabled));
}
button#batch-result-toggle-off.btn {
    padding-left: 16px;
    padding-right: 12px;
}
button#batch-result-toggle-mixed.btn {
    padding-right: 12px;
    padding-left: 12px;
}
button#batch-result-toggle-on.btn {
    padding-left: 12px;
    padding-right: 16px;
}

.tagger-container > .tagger-container-header > .d-flex > .d-flex {
    margin-left: auto;
}

div#crop-btn-container {
    justify-content: flex-start;
    display: flex;
    margin-top: 0.4286rem;
    margin-left: 0.75rem;
    padding-bottom: 0.8571428571428571rem;
}

.tag-item, 
.filter-tags>span.tag-item {
    background-image: linear-gradient(to right, rgb(var(--surface)), rgb(var(--surface)));
    background-color: rgba(var(--pry-color),0.55);
    background-blend-mode: hard-light;
    color: rgb(var(--on-surface-variant));
    border: 1px solid rgb(var(--outline));
    border-radius: 8px;
    text-shadow: none !important;
    letter-spacing: 0.1px;
    line-height: 28px;
    margin: 4px;
    font-size: 14px;
    font-weight: 500;
    font-family: var(--HeaderFont);
    min-height: 32px;
    /*height: 32px;*/
    box-shadow: var(--elevation-0);
    padding: 0 16px 0 16px;
}
.tag-item:is(:hover, :focus-visible),
.filter-tags>span.tag-item:is(:hover, :focus-visible) {
    background-image: linear-gradient(to right, rgba(var(--surface),var(--btn-hover-rev)), rgba(var(--surface),var(--btn-hover-rev)));
    background-color: rgba(var(--pry-color),0.55);
    background-blend-mode: hard-light;
    box-shadow: var(--elevation-1);
}
.tag-item:is(:active, :focus),
.filter-tags>span.tag-item:is(:active, :focus) {
    background-image: linear-gradient(to right, rgba(var(--surface),var(--btn-active-rev)), rgba(var(--surface),var(--btn-active-rev)));
    background-color: rgba(var(--pry-color),0.55);
    background-blend-mode: hard-light;
    box-shadow: var(--elevation-0);
}
.tag-item:focus-visible,
.filter-tags>span.tag-item:focus-visible {
    outline-color: rgb(var(--focus-ring));
    outline-style: solid;
    outline-width: 0.25rem;
    outline-offset: -1px;
    box-shadow: none;
}
.tag-item .btn {
    bottom: 0.07143rem;
    color: #cef1ff;
    margin-left: 0;
    font-size: 1.286rem;
    line-height: 1rem;
    padding: 0 0 0 0.12rem;
    opacity: 1;
}

/* Search-Result Tagger-Container Tag-items with Icons */
:is(.search-result, .collapse.show.card) span.tag-item.badge.badge-secondary {
    display: inline-flex !important;
    justify-content: center;
    align-items: center;
}
:is(.search-result, .collapse.show.card) span.tag-item > button.minimal.btn.btn-primary {
    display: flex;
    color: rgb(var(--on-surface-variant)) !important;
    background-image: none;
    margin-right: -10px;
    padding: 0;
    line-height: 26px;
    margin-top: 2px;
    margin-bottom: auto;
    width: 28px;
    height: 28px;
    min-height: 28px;
    box-shadow: none;
}
:is(.search-result, .collapse.show.card) span.tag-item > button.minimal.btn.btn-primary:is(:hover, :focus-visible) {
    background-color: rgb(var(--surface-variant),var(--btn-hover-rev));
    box-shadow: var(--elevation-0);
}
:is(.search-result, .collapse.show.card) span.tag-item > button.minimal.btn.btn-primary:is(:focus:not(:focus-visible), :active, :active:focus) {
    background-color: rgb(var(--surface-variant),var(--btn-active-rev));
    box-shadow: none;
}
:is(.search-result, .collapse.show.card) span.tag-item > button.minimal.btn.btn-primary:focus-visible {
    outline-color: rgb(var(--focus-ring));
    outline-offset: -2px;
    outline-style: solid;
    outline-width: 0.25rem;
}
/* */

/* Loading Spinner */
.spinner-border {
    color: rgb(var(--pry-color)) !important;
}

/* Search-Button Spinner */
.LoadingIndicator.small .spinner-border {
    color: rgb(var(--on-tertiary)) !important;
}

.tag-item button.btn.btn-secondary > svg.svg-inline--fa.fa-xmark.fa-icon {
    min-height: 18px;
    font-size: 24px;
}
.wrap-tags.filter-tags>span.badge {
    align-items: center;
    display: flex;
    padding: 0 12px 0 12px;
    gap: 8px;
}
.tag-item > button.btn.btn-secondary {
    background-color: transparent;
    color: rgb(var(--on-surface-variant));
    border: 0;
    width: 26px;
    max-width: 26px;
    height: 26px;
    max-height: 26px;
    border-radius: 5rem;
    justify-content: center;
    padding: 0;
    display: flex;
}
.tag-item > button.btn.btn-secondary:hover {
    background-image: none;
    background-color: rgb(var(--on-surface-variant),var(--btn-hover));
}
.tag-item > button.btn.btn-secondary:is(:focus, :active, :active:focus) {
    background-image: none;
    background-color: rgb(var(--on-surface-variant),var(--btn-active));
}

.badge-pill.badge-secondary {
    color: #690005;
    background-color: #ffb4ab;
}
.badge-info {
    color: #690005;
    background-color: #ffb4ab;
}
.badge-pill {
    height: 1.357rem;
    min-width: 1.357rem;
    max-width: 2.5rem;
    justify-content: center;
    display: flex;
    align-items: center;
    padding: 0 0.286rem;
    font-size: 0.786rem; /*11px*/
    font-weight: 500;
    letter-spacing: 0.036rem;
}

.fa-mars {
    color: rgb(var(--mars));
    font-size: 24px;
}
svg.gender-icon {
    display: flex;
    margin-bottom: auto;
}

.text-danger {
    color: rgb(var(--error))!important;
    text-shadow: var(--light-txt-shadow);
    font-size: 22px;
    line-height: 28px;
    letter-spacing: 0.35px;
}

.scene-video-filter > .row > span > h5 {
    color: rgb(var(--outline));
}
.scene-details, 
.original-scene-details {
    padding-bottom: 12px;
}
.scene-details h5 {
    color: rgb(var(--on-surface-variant));
}
.scene-tabs .row.justify-content-center.scene-performers {
    margin-top: 0;
    padding-top: 0;
}
.scene-tabs p.pre {
    color: rgb(var(--description-color));
    margin-bottom: 16px;
}
.scene-tabs span.tag-item.badge.badge-secondary:last-of-type {
    margin-bottom: 16px;
}

.scene-file-info.details-list dt {
    color: rgb(var(--on-surface));
}
.scene-file-info.details-list dd {
    color: rgb(var(--on-surface-variant));
}

/* Queue-Viewer */
div#queue-content {
    background-color: transparent;
    margin-top: 8px;
    padding-top: 8px;
}
#queue-viewer .queue-controls {
    background-color: transparent;
    padding-left: 16px;
    padding-right: 16px;
    padding-top: 16px;
}
#queue-viewer > .queue-controls > div + div {
    display: flex;
}
#queue-viewer > .queue-controls button.minimal.btn.btn-secondary {
    font-size: 18px;
    width: 40px;
}
#queue-viewer .queue-controls + div#queue-content {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    align-content: flex-start;
    justify-content: center;
}
#queue-viewer #queue-content > .d-flex > .btn.btn-primary:is(:only-of-type, :hover, :active, :focus, :active:focus) {
    background-color: transparent;
    background-image: none;
    font-size: 27.45px;
    color: rgb(var(--on-surface-variant));
    font-weight: 900;
    box-shadow: none;
    padding: 0 0 16px 0;
}
#queue-viewer a {
    color: rgb(var(--on-surface-variant));
    font-size: 16px;
    line-height: 24px;
    letter-spacing: 0.25px;
    font-weight: 400;
    text-shadow: var(--light-txt-shadow);
    transition: background-color 0.55s ease, color 0.15s ease-in-out;
}
#queue-viewer li.my-2 a:hover {
    color: rgb(var(--on-surface));
}
#queue-content li.my-2:hover {
    background-color: rgb(255,255,255,0.15);
}
li.my-2::marker {
    font-weight: 700;
    text-shadow: var(--light-txt-shadow);
}
li.my-2:hover::marker {
    color: rgb(var(--on-surface));
}
li.my-2.current::marker {
    color: rgb(var(--on-surface-variant));
    font-weight: 900;
    text-shadow: var(--light-txt-shadow);
}
#queue-content li.my-2.current {
    background-color: rgb(255,255,255,0.05);
}
#queue-content li.my-2.current a {
    font-weight: 500;
    text-shadow: var(--light-txt-shadow);
}
#queue-viewer>#queue-content li.my-2 {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
}
#queue-viewer .ml-1 {
    margin-left: 0 !important;
}
#queue-viewer .thumbnail-container {
    height: 72px;
    margin-bottom: 12px;
    margin-right: 16px;
    margin-top: 12px;
    min-width: 126px;
    width: auto;
}
/* * */

.input-group>.input-group-append>.react-datepicker-wrapper button.btn.btn-secondary:not(:first-child):last-child {
    border-left: 2px solid #899390;
}
.scrape-url-button:not(:disabled) {
    margin-left: 1px;
}

/* --- Cuts the name of Performers, Movies and Tags short if they go longer than the length of the field --- */
div.react-select__control .react-select__multi-value {
  max-width: 285px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* --- Background when searching for a scene in Tagger view --- */
.search-result {    
    background: rgba(0,0,0,0.22);
}
.selected-result {  
    background: rgba(125, 199, 120,0.28);
}
.search-result:hover { 
    background: rgba(138,205,134,0.35);
}

.tagger-container .form-group>label.form-label:not(.col-form-label) {
    margin-bottom: 0;
    font-size: 11px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: 0.5px;
    position: relative;
    left: 16px;
    top: -4px;
}

.input-control.form-control,
.input-control.form-control:disabled:hover {
    background-color: transparent;
    border: 0;
    border-radius: 4px;
    color: rgb(var(--on-pry-container));
    height: 56px;
    margin-right: 26px; /* This margin is the space between the text and arrow. */
    font-size: 16px;
    line-height: 24px;
    letter-spacing: 0.5px;
    font-weight: 500;
    text-shadow: var(--really-light-txt-shadow);
    padding-left: 16px;
    padding-right: 16px;
    box-shadow: 0 0 0 1px rgb(var(--outline)), inset 0 0 0 1px transparent;
    background-image: url("data:image/svg+xml;utf8,<svg fill='%23c1c7ce' height='24' viewBox='0 0 20 22' width='32' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
    background-repeat: no-repeat;
    background-position: calc( 100% - 8px ) center;
    background-size: 50px;
    transition: color 0.2s ease-in-out, border-radius 0.2s ease-in-out, box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.55s ease;
    min-width: 160px;
}
.input-control:disabled,
.input-control.form-control:disabled {
    opacity: var(--disabled);
}
.input-control.form-control:hover {
    background-color: rgb(var(--pry-container));
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    box-shadow: 0 1px 0 0 rgb(var(--on-surface)), inset 0 -1px 0 0 transparent;
}
.input-control.form-control:where(:focus, :focus:hover, :active) {
    background-color: rgb(var(--on-pry));
    color: rgb(var(--pry-color));
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    box-shadow: 0 1px 0 0 rgb(var(--pry-color)), inset 0 -2px 0 0 rgb(var(--pry-color));
}
.input-control.form-control:focus-visible {
    background-color: rgba(var( --pry-container));
    color: rgb(var(--on-tertiary-container));
    box-shadow: 0 1px 0 0 rgb(var(--on-surface)), inset 0 -1px 0 0 rgb(var(--on-surface));
    outline: none;
}

#update-stashids-endpoint.input-control.form-control {
    margin-top: 8px;
}
#performer-page .image-container .performer {
     background-color: rgba(0, 0, 0, 0.45);
     box-shadow: 0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12);
}

/* React Select Combo-Box's */
.input-group .react-select .react-select__control {
    border-radius: 4px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}

div.react-select__control {
     background-color: rgb(var(--body-color2));
     color: rgb(var(--interactive-input));
     border-width: 0;
     border-style: none;
     border-radius: 4px;
     box-shadow: 0 0 0 1px rgb(var(--outline)), inset 0 0 0 1px transparent;
     transition: box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.35s ease-in, background-color .55s ease, outline 0.4s ease-in;
}
div.react-select__control:not(:focus):focus-visible {
    background-color: rgba(255,255,255,0.06);
    background-image: var(--btn-hover-highlight),linear-gradient(to right, rgb(var(--body-color2)), rgb(var(--body-color2)));
    outline-color: rgb(var(--focus-ring));
    outline-offset: -1px;
    outline-style: solid;
    outline-width: 0.25rem;
}
.row.form-group:has(.invalid-feedback)>div>div>div.react-select__control {
    border: 0;
    border-style: none;
    box-shadow: 0 0 0 1px rgb(var(--error-container)), inset 0 0 0 1px transparent;
    transition: box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
div.react-select__value-container {
    min-height: 56px;
    padding: 2px 12px;
}
.CountrySelect>.react-select__control:hover,
div.react-select__control:hover {
    background-color: rgba(255,255,255,var(--btn-hover));
    background-image: var(--btn-hover-highlight),linear-gradient(to right, rgb(var(--body-color2)), rgb(var(--body-color2)));
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    box-shadow: 0 1px 0 0 rgb(var(--on-surface)), inset 0 -1px 0 0 transparent;
    transition: box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.35s ease-in, background-color .55s ease;
}
.row.form-group:has(.invalid-feedback)>div>div>div.react-select__control:hover {
    background-color: rgba(255,255,255,var(--btn-hover));
    background-image: var(--btn-hover-highlight),linear-gradient(to right, rgb(var(--body-color2)), rgb(var(--body-color2)));
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    box-shadow: 0 1px 0 0 rgb(var(--on-error-container)), inset 0 -1px 0 0 transparent;
    transition: box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
div.react-select__control.react-select__control--is-focused {
    background-color: rgba(255,255,255,var(--btn-active));
    background-image: var(--btn-active-highlight),linear-gradient(to right, rgb(var(--body-color2)), rgb(var(--body-color2)));
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    box-shadow: 0 1px 0 0 rgb(var(--pry-color)), inset 0 -1px 0 0 rgb(var(--pry-color));
    transition: box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.35s ease-in, background-color .55s ease;
}
.row.form-group:has(.invalid-feedback)>div>div>div.react-select__control--is-focused {
    background-color: rgba(255,255,255,var(--btn-active));
    background-image: var(--btn-active-highlight),linear-gradient(to right, rgb(var(--body-color2)), rgb(var(--body-color2)));
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    box-shadow: 0 1px 0 0 rgb(var(--error-container)), inset 0 -1px 0 0 rgb(var(--error-container));
    transition: box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color: 0.55s ease;
}
div.react-select__control.react-select__control--is-focused:hover {
    background-color: rgba(255,255,255,var(--btn-hover));
    background-image: var(--btn-active-highlight),linear-gradient(to right, rgb(var(--body-color2)), rgb(var(--body-color2)));
}
.row.form-group:has(.invalid-feedback)>div>div>div.react-select__control--is-focused:hover {
    background-color: rgba(255,255,255,var(--btn-active));
    background-image: var(--btn-active-highlight),linear-gradient(to right, rgb(var(--body-color2)), rgb(var(--body-color2)));
}

div.react-select__control .react-select__single-value, 
div.react-select__control .react-select__input-container {
    color: rgb(var(--interactive-input));
    font-size: 14px;
    font-weight: 400;
    letter-spacing: 0.15px;
    line-height: 20px;
}
.react-select__placeholder,
.css-1wa3eu0-placeholder {
    color: rgb(var(--on-surface-variant));
    font-size: 16px;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0.5px;
    text-shadow: none;
}
.row.form-group:has(.invalid-feedback)>div>div>div.react-select__control .react-select__placeholder {
    color: rgb(var(--error));
}
div.react-select__control.react-select__control--is-focused .react-select__placeholder {
    position: relative;
    top: -30%;
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: 1.0px;
    transform: scale(1);
    will-change: transition;
    transition: transform 0.115s cubic-bezier(0.47, 0, 0.75, 0.72);
}
/* Tags in Comboboxes */
div.react-select__control .react-select__multi-value {
    background-color: rgb(var(--secondary));
    border: 0;
    border-radius: 8px;
    align-content: center;
    flex-flow: wrap;
    font-weight: 500;
    margin: 4px 4px;
    padding: 0 8px 0 12px;
    height: 32px;
    box-shadow: var(--elevation-0);
    outline: none;
}
div.react-select__control .react-select__multi-value:hover {
    background-image: var(--btn-hover-highlight), linear-gradient(to right, rgba(var(--pry-color),var(--btn-hover)), rgba(var(--pry-color),var(--btn-hover)));
    background-color: rgba(var(--secondary));
    background-blend-mode: screen;
    box-shadow: var(--elevation-1);
}
div.react-select__control .react-select__multi-value:active,
div.react-select__control .react-select__multi-value:focus,
div.react-select__control .react-select__multi-value:focus:active {
    background-image: var(--btn-active-highlight), linear-gradient(to right, rgba(var(--pry-color),var(--btn-active)), rgba(var(--pry-color),var(--btn-active)));
    background-color: rgba(var(--secondary));
    background-blend-mode: screen;
    box-shadow: var(--elevation-0);
}
/* Button Indicators in Combobox */
div.react-select__indicator {
    color: rgb(var(--surface-variant));
    opacity: 1;
}
div.react-select__control:hover div.react-select__indicator:hover {
    color: rgb(var(--surface-variant));
    opacity: 1;
}
div.react-select__control.react-select__control--is-focused div.react-select__indicator:focus,
div.react-select__control.react-select__control--is-focused div.react-select__indicator:active,
div.react-select__control.react-select__control--is-focused div.react-select__indicator.react-select__dropdown-indicator:focus,
div.react-select__control.react-select__control--is-focused div.react-select__indicator.react-select__dropdown-indicator:active,
div.react-select__control.react-select__control--is-focused div.react-select__indicator.react-select__clear-indicator:focus,
div.react-select__control.react-select__control--is-focused div.react-select__indicator.react-select__clear-indicator:active {
    color: rgb(var(--on-surface-variant));
    background-color: rgb(var(--on-surface-variant),var(--btn-active));
    border-radius: 5rem;
    opacity: 1;
}
div.react-select__dropdown-indicator,
div.react-select__clear-indicator {
    color: rgb(var(--on-surface-variant));
    padding: 0;
    position: relative;
    margin-right: 12px;
    opacity: 1;
}
div.react-select__indicator.react-select__dropdown-indicator:hover,
div.react-select__indicator.react-select__clear-indicator:hover {
    color: rgb(var(--on-surface-variant));
    background-color: rgb(var(--on-surface-variant),var(--btn-hover));
    border-radius: 5rem;
    opacity: 1;
}

div.react-select__menu, 
div.dropdown-menu {
    background-color: rgb(var(--menu-color));
    color: rgb(var(--on-surface));
    box-shadow: var(--elevation-2);
    border-radius: 0 4px 4px 0;
    padding: 8px 0;
}
div.react-select__menu .react-select__option,
div.react-select__menu .dropdown-item,
div.dropdown-menu .react-select__option {
    color: rgb(var(--on-surface));
    padding-left: 12px;
    padding-right: 12px;
    height: 48px;
    max-height: 48px;
    padding-top: 15px;
} 
div.react-select.performer-select div.react-select__menu .react-select__option,
div.react-select.performer-select div.react-select__menu .dropdown-item,
div.react-select.performer-select div.dropdown-menu .react-select__option {
    color: rgb(var(--on-surface));
    padding-left: 12px;
    padding-right: 12px;
    height: 66px;
    max-height: 66px;
    padding-top: 8px;
}    
div.react-select__menu .react-select__option--is-focused,
div.react-select__menu .dropdown-item:focus,
div.react-select__menu .dropdown-item:hover,
div.dropdown-menu .react-select__option--is-focused,
div.dropdown-menu .dropdown-item:focus,
div.dropdown-menu .dropdown-item:hover {
    background-color: rgb(var(--on-surface),var(--btn-hover));
    color: rgb(var(--on-surface));
}

/* Scraper Tags Selected */
.react-select__multi-value__label {
    background-color: transparent;
    color: rgb(var(--on-sec));
    text-shadow: none !important;
    vertical-align: middle;
    letter-spacing: 0.1px;
    line-height: 20px;
    font-weight: 500;
    font-size: 14px;
    padding-right: 8px;
    position: relative;
    top: 2px;
}
/* ...close button */
.react-select__multi-value__remove {
    background-color: transparent;
    border-radius: 5rem;
    border: 0;
    color: rgb(var(--on-surface-variant));
    box-shadow: none;
    outline: none;
    min-width: 30px;
    width: 30px;
    height: 30px;
}
.react-select__multi-value__remove:hover {
    background-color: rgba(var(--on-surface-variant),var(--btn-hover));
    box-shadow: var(--elevation-0);
    color: rgb(var(--on-surface-variant));
}
.react-select__multi-value__remove:active,
.react-select__multi-value__remove.active {
    background-color: rgba(var(--on-surface-variant),var(--btn-active));
    color: rgb(var(--on-surface-variant));
    box-shadow: none;
    outline: none;
}

/* React dropdown SVG Icon size */
svg.css-8mmkcg {
    height: 40px!important;
    width: 40px!important;
}
#scene-edit-details .form-container .form-group:nth-last-of-type(-n +6) div.react-select__indicators svg.css-8mmkcg {
    stroke: rgb(var(--body-color2));
    stroke-width: 0.55;
}
#scene-edit-details .form-container .form-group:nth-last-of-type(-n + 6) div.react-select__control.react-select__control--is-focused div.react-select__indicators svg.css-8mmkcg,
#scene-edit-details .form-container .form-group:nth-last-of-type(-n + 6) div.react-select__control.react-select__control--is-focused:hover div.react-select__indicators svg.css-8mmkcg,
#scene-edit-details .form-container .form-group:nth-last-of-type(-n + 6) div.react-select__control.react-select__control--is-focused div.react-select__indicators:hover svg.css-8mmkcg {
    stroke: #404345;
}

.text-success {
    color: #7DC778 !important;
}

/* Not Sure about this! */
.input-group>.input-group-prepend:first-child:not(:last-child)>.btn:only-child {
    border-radius: 0.23rem;
}

.scene-wall-item-text-container {
     background: radial-gradient(farthest-corner at 50% 50%, rgba(50, 50, 50, .5) 50%, #323232 100%);
     color: #fff;
     text-shadow: none;
}

.btn-toolbar {
    margin-left: auto;
    margin-right: auto;
    align-content: center;
    align-items: center;
}
.filter-container, 
.operation-container {
     background-color: rgb(var(--pry-container));
     box-shadow: none;
     margin-top: 6px; 
     border-radius: 5rem;
     margin-left: 24px;
     margin-right: 24px;
     margin-bottom: 12px;
}
span.filter-container.text-muted.paginationIndex.center-text {
    background-color: transparent;
    /*margin-top: 24px;*/
    margin-bottom: 0;
}
span.filter-container.text-muted.paginationIndex.center-text:last-of-type {
    margin-bottom: 6px;
}
.filter-container.pagination.btn-group:last-of-type {
    margin-bottom: 24px;
}

/* Link-Button */
.btn-link:not(:has(>*.performer)) {
    color: rgb(var(--link-color));
    text-decoration: none;
    text-decoration-color: transparent;
    display: inline-block;
    padding-left: 12px;
    padding-right: 12px;
    min-height: 32px;
    height: 32px;
    font-size: 14px;
    letter-spacing: 0.025em;
    line-height: 20px;
    font-weight: 500;
    background-image: var(--btn-dummy-highlight);
    background-color: rgb(var(--link-icon));
    background-blend-mode: normal;
    border: 0;
    outline: 0;
    box-shadow: var(--elevation-0);
    border-radius: 5rem;
    transition: var(--trans-0);
    -webkit-transition: text-decoaration-color 0.25s ease-in-out, var(--trans-0);
}
.btn-link:not(:has(>*.performer)):is(:hover, :focus-visible) {
    color: rgb(var(--link-color));
    text-decoration: underline;
    text-decoration-color: currentColor;
    text-decoration-thickness: from-font;
    text-underline-offset: 0.17em;
    box-shadow: var(--elevation-1);
    background-image: var(--btn-hover-highlight);
    background-color: rgb(var(--link-icon));
    background-blend-mode: screen;
}
.btn-link:not(:has(>*.performer)):not(:disabled):not(.disabled):is(.active, .active:focus, :focus, :active, :active:focus) {
    color: rgb(var(--link-color))
    text-decoration: underline;
    text-decoration-color: currentColor;
    text-decoration-thickness: from-font;
    text-underline-offset: 0.17em;
    outline: 0;
    box-shadow: var(--elevation-0);
    background-image: var(--btn-active-highlight);
    background-color: rgb(var(--link-icon));
    background-blend-mode: screen;
}
.btn-link:not(:has(>*.performer)):focus-visible {
    text-decoration: underline;
    text-decoration-color: currentColor;
    text-decoration-thickness: from-font;
    text-underline-offset: 0.17em;
    outline-color: rgb(var(--focus-ring));
    outline-width: 0.25rem;
    outline-style: solid;
    outline-offset: -1px;
    box-shadow: none;
}
.btn-link:not(:has(>*.performer)):disabled,
.btn-link.disabled:not(:has(>*.performer)) {
    text-decoration: none;
    text-decoration-color: transparent;
    box-shadow: none;
    outline: 0;
    opacity: var(--disabled);
}

button.minimal.brand-link.d-none.d-md-inline-block.btn.btn-primary {
     text-transform: uppercase;
     font-weight: bold;
     text-shadow: none;
}

.folder-list .btn-link {
     color: #dcf6f0;
}
.folder-list-parent.folder-list-item {
    font-weight: 700;
    color: #dcf6f0;
}

#performer-scraper-popover {
     z-index: 10;
}

.stats .heading {
    color: rgba(224,227,225,0.87);
    text-shadow: none;
}

.search-item {
     background-color: rgb(var(--card-color2));
}
.selected-result {
     background-color: rgb(var(--card-color2));
}
.selected-result:hover {
     background-color: rgb(var(--card-color2));
}

/* Search Result Card from Scraper -- perhaps the above .selected-result has incorrect color?? */
li.search-result.selected-result.active {
    background-color: transparent;
}

.search-item > ul:has(>.search-result.selected-result.active) {
    border-top: 1px solid rgb(var(--card-fold));
}

/* Popovers */
.popover {
    font-family: var(--HeaderFont);
    font-weight: 400;
    font-size: 1rem;
    line-height: 20px;
    letter-spacing: 0.25px;
    padding: 12px 16px 8px 16px;
    color: rgb(var(--on-surface-variant)) !important;
    background-color: transparent; 
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 12px;
    box-shadow: var(--elevation-2) !important;
}
.popover:not(.popover ~ .popover):not(.popover + .popover) {
    background-color: rgb(var(--popover-color)) !important;
}

.popover ~ .popover,
.popover + .popover {
    background-color: rgb(var(--popover-color2)) !important;
}

.popover-body, 
.popover-body .btn, 
.modal {
    color: currentColor;
}
.popover-body .image-input.form-label>button.btn.btn-secondary {
    color: rgb(var(--on-pry-container));
}
.popover-body button.minimal.btn.btn-primary {
    color: rgb(var(--on-pry-container));
    padding: 0 24px;
}
.popover-header {
    background-color: rgb(var(--popover-color));
    border-bottom: 1px solid rgb(var(--on-surface-variant));
    margin: -12px -12px 12px -12px;
    padding-bottom: 4px;
    line-height: 20px;
    font-size: 1rem;
    font-weight: 500;
    letter-spacing: 0.1px;
    color: rgb(var(--on-surface-variant)) !important;
}
.popover .text-muted {
    color: #e0e3e1 !important;
}
.popover-body {
    background-color: transparent;
    padding: 0;
    margin: 0;
}
.popover-body:has(>div .image-input):has(>div .minimal.btn) {
    justify-content: center;
    display: flex;
    gap: 8px;
}
.image-input {
    margin-bottom: 8px;
    color: inherit;
}
.bs-popover-top:not(.bs-popover-top ~ .bs-popover-top):not(.bs-popover-top + .bs-popover-top):not(.bs-popover-bottom ~ .bs-popover-top):not(.bs-popover-bottom + .bs-popover-top):not(.bs-popover-right ~ .bs-popover-top):not(.bs-popover-right + .bs-popover-top):not(.bs-popover-left ~ .bs-popover-top):not(.bs-popover-left + .bs-popover-top) > .arrow:after, 
.bs-popover-auto[x-placement^=top]:not(.bs-popover-auto[x-placement^=top] ~ .bs-popover-auto[x-placement^=top]):not(.bs-popover-auto[x-placement^=top] + .bs-popover-auto[x-placement^=top]):not(.bs-popover-auto[x-placement^=bottom] ~ .bs-popover-auto[x-placement^=top]):not(.bs-popover-auto[x-placement^=bottom] + .bs-popover-auto[x-placement^=top]):not(.bs-popover-auto[x-placement^=right] ~ .bs-popover-auto[x-placement^=top]):not(.bs-popover-auto[x-placement^=right] + .bs-popover-auto[x-placement^=top]):not(.bs-popover-auto[x-placement^=left] ~ .bs-popover-auto[x-placement^=top]):not(.bs-popover-auto[x-placement^=left] + .bs-popover-auto[x-placement^=top]) > .arrow:after {
    border-top-color: rgb(var(--popover-color)) !important;
}
.bs-popover-top ~ .bs-popover-top > .arrow:after, 
.bs-popover-top + .bs-popover-top > .arrow:after,
.bs-popover-auto[x-placement^=top] ~ .bs-popover-auto[x-placement^=top] > .arrow:after,
.bs-popover-auto[x-placement^=top] + .bs-popover-auto[x-placement^=top] > .arrow:after,
.bs-popover-bottom ~ .bs-popover-top > .arrow:after, 
.bs-popover-bottom + .bs-popover-top > .arrow:after,
.bs-popover-auto[x-placement^=bottom] ~ .bs-popover-auto[x-placement^=top] > .arrow:after,
.bs-popover-auto[x-placement^=bottom] + .bs-popover-auto[x-placement^=top] > .arrow:after,
.bs-popover-right ~ .bs-popover-top > .arrow:after, 
.bs-popover-right + .bs-popover-top > .arrow:after,
.bs-popover-auto[x-placement^=right] ~ .bs-popover-auto[x-placement^=top] > .arrow:after,
.bs-popover-auto[x-placement^=right] + .bs-popover-auto[x-placement^=top] > .arrow:after,
.bs-popover-left ~ .bs-popover-top > .arrow:after, 
.bs-popover-left + .bs-popover-top > .arrow:after,
.bs-popover-auto[x-placement^=left] ~ .bs-popover-auto[x-placement^=top] > .arrow:after,
.bs-popover-auto[x-placement^=left] + .bs-popover-auto[x-placement^=top] > .arrow:after {
    border-top-color: rgb(var(--popover-color2)) !important;
}
.bs-popover-top > .arrow:before, 
.bs-popover-auto[x-placement^=top] > .arrow:before {
    border-top-color: rgba(255,255,255,0.15);
}
.bs-popover-bottom:not(.bs-popover-bottom ~ .bs-popover-bottom):not(.bs-popover-bottom + .bs-popover-bottom):not(.bs-popover-top ~ .bs-popover-bottom):not(.bs-popover-top + .bs-popover-bottom):not(.bs-popover-right ~ .bs-popover-bottom):not(.bs-popover-right + .bs-popover-bottom):not(.bs-popover-left ~ .bs-popover-bottom):not(.bs-popover-left + .bs-popover-bottom) > .arrow:after, 
.bs-popover-auto[x-placement^=bottom]:not(.bs-popover-auto[x-placement^=bottom] ~ .bs-popover-auto[x-placement^=bottom]):not(.bs-popover-auto[x-placement^=bottom] + .bs-popover-auto[x-placement^=bottom]):not(.bs-popover-auto[x-placement^=top] ~ .bs-popover-auto[x-placement^=bottom]):not(.bs-popover-auto[x-placement^=top] + .bs-popover-auto[x-placement^=bottom]):not(.bs-popover-auto[x-placement^=right] ~ .bs-popover-auto[x-placement^=bottom]):not(.bs-popover-auto[x-placement^=right] + .bs-popover-auto[x-placement^=bottom]):not(.bs-popover-auto[x-placement^=left] ~ .bs-popover-auto[x-placement^=bottom]):not(.bs-popover-auto[x-placement^=left] + .bs-popover-auto[x-placement^=bottom]) > .arrow:after {
    border-bottom-color: rgb(var(--popover-color)) !important;
}
.bs-popover-bottom ~ .bs-popover-bottom > .arrow:after, 
.bs-popover-bottom + .bs-popover-bottom > .arrow:after,
.bs-popover-auto[x-placement^=bottom] ~ .bs-popover-auto[x-placement^=bottom] > .arrow:after,
.bs-popover-auto[x-placement^=bottom] + .bs-popover-auto[x-placement^=bottom] > .arrow:after,
.bs-popover-top ~ .bs-popover-bottom > .arrow:after, 
.bs-popover-top + .bs-popover-bottom > .arrow:after,
.bs-popover-auto[x-placement^=top] ~ .bs-popover-auto[x-placement^=bottom] > .arrow:after,
.bs-popover-auto[x-placement^=top] + .bs-popover-auto[x-placement^=bottom] > .arrow:after,
.bs-popover-right ~ .bs-popover-bottom > .arrow:after, 
.bs-popover-right + .bs-popover-bottom > .arrow:after,
.bs-popover-auto[x-placement^=right] ~ .bs-popover-auto[x-placement^=bottom] > .arrow:after,
.bs-popover-auto[x-placement^=right] + .bs-popover-auto[x-placement^=bottom] > .arrow:after,
.bs-popover-left ~ .bs-popover-bottom > .arrow:after, 
.bs-popover-left + .bs-popover-bottom > .arrow:after,
.bs-popover-auto[x-placement^=left] ~ .bs-popover-auto[x-placement^=bottom] > .arrow:after,
.bs-popover-auto[x-placement^=left] + .bs-popover-auto[x-placement^=bottom] > .arrow:after {
    border-bottom-color: rgb(var(--popover-color2)) !important;
}
.bs-popover-bottom > .arrow:before, 
.bs-popover-auto[x-placement^=bottom] > .arrow:before {
    border-bottom-color: rgba(255,255,255,0.15);
}
.bs-popover-right:not(.bs-popover-top ~ .bs-popover-right):not(.bs-popover-top + .bs-popover-right):not(.bs-popover-bottom ~ .bs-popover-right):not(.bs-popover-bottom + .bs-popover-right):not(.bs-popover-right ~ .bs-popover-right):not(.bs-popover-right + .bs-popover-right):not(.bs-popover-left ~ .bs-popover-right):not(.bs-popover-left + .bs-popover-right) > .arrow:after, 
.bs-popover-auto[x-placement^=right]:not(.bs-popover-auto[x-placement^=top] ~ .bs-popover-auto[x-placement^=right]):not(.bs-popover-auto[x-placement^=top] + .bs-popover-auto[x-placement^=right]):not(.bs-popover-auto[x-placement^=bottom] ~ .bs-popover-auto[x-placement^=right]):not(.bs-popover-auto[x-placement^=bottom] + .bs-popover-auto[x-placement^=right]):not(.bs-popover-auto[x-placement^=right] ~ .bs-popover-auto[x-placement^=right]):not(.bs-popover-auto[x-placement^=right] + .bs-popover-auto[x-placement^=right]):not(.bs-popover-auto[x-placement^=left] ~ .bs-popover-auto[x-placement^=right]):not(.bs-popover-auto[x-placement^=left] + .bs-popover-auto[x-placement^=right]) > .arrow:after {
    border-right-color: rgb(var(--popover-color)) !important;
}
.bs-popover-right ~ .bs-popover-right > .arrow:after,
.bs-popover-right + .bs-popover-right > .arrow:after,
.bs-popover-auto[x-placement^=right] ~ .bs-popover-auto[x-placement^=right] > .arrow:after,
.bs-popover-auto[x-placement^=right] + .bs-popover-auto[x-placement^=right] > .arrow:after,
.bs-popover-top ~ .bs-popover-right > .arrow:after,
.bs-popover-top + .bs-popover-right > .arrow:after,
.bs-popover-auto[x-placement^=top] ~ .bs-popover-auto[x-placement^=right] > .arrow:after,
.bs-popover-auto[x-placement^=top] + .bs-popover-auto[x-placement^=right] > .arrow:after,
.bs-popover-bottom ~ .bs-popover-right > .arrow:after,
.bs-popover-bottom + .bs-popover-right > .arrow:after,
.bs-popover-auto[x-placement^=bottom] ~ .bs-popover-auto[x-placement^=right] > .arrow:after,
.bs-popover-auto[x-placement^=bottom] + .bs-popover-auto[x-placement^=right] > .arrow:after,
.bs-popover-left ~ .bs-popover-right > .arrow:after,
.bs-popover-left + .bs-popover-right > .arrow:after,
.bs-popover-auto[x-placement^=left] ~ .bs-popover-auto[x-placement^=right] > .arrow:after,
.bs-popover-auto[x-placement^=left] + .bs-popover-auto[x-placement^=right] > .arrow:after {
    border-right-color: rgb(var(--popover-color2)) !important;
}
.bs-popover-right > .arrow:before, 
.bs-popover-auto[x-placement^=right] > .arrow:before {
    border-right-color: rgba(255,255,255,0.15);
}
.bs-popover-left:not(.bs-popover-left ~ .bs-popover-left):not(.bs-popover-left + .bs-popover-left):not(.bs-popover-top ~ .bs-popover-left):not(.bs-popover-top + .bs-popover-left):not(.bs-popover-bottom ~ .bs-popover-left):not(.bs-popover-bottom + .bs-popover-left):not(.bs-popover-right ~ .bs-popover-left):not(.bs-popover-right + .bs-popover-left) > .arrow:after, 
.bs-popover-auto[x-placement^=left]:not(.bs-popover-auto[x-placement^=left] ~ .bs-popover-auto[x-placement^=left]):not(.bs-popover-auto[x-placement^=left] + .bs-popover-auto[x-placement^=left]):not(.bs-popover-auto[x-placement^=top] ~ .bs-popover-auto[x-placement^=left]):not(.bs-popover-auto[x-placement^=top] + .bs-popover-auto[x-placement^=left]):not(.bs-popover-auto[x-placement^=bottom] ~ .bs-popover-auto[x-placement^=left]):not(.bs-popover-auto[x-placement^=bottom] + .bs-popover-auto[x-placement^=left]):not(.bs-popover-auto[x-placement^=right] ~ .bs-popover-auto[x-placement^=left]):not(.bs-popover-auto[x-placement^=right] + .bs-popover-auto[x-placement^=left]) > .arrow:after {
    border-left-color: rgb(var(--popover-color)) !important;
}
.bs-popover-left ~ .bs-popover-left > .arrow:after,
.bs-popover-left + .bs-popover-left > .arrow:after,
.bs-popover-auto[x-placement^=left] ~ .bs-popover-auto[x-placement^=left] > .arrow:after,
.bs-popover-auto[x-placement^=left] + .bs-popover-auto[x-placement^=left] > .arrow:after,
.bs-popover-top ~ .bs-popover-left > .arrow:after,
.bs-popover-top + .bs-popover-left > .arrow:after,
.bs-popover-auto[x-placement^=top] ~ .bs-popover-auto[x-placement^=left] > .arrow:after,
.bs-popover-auto[x-placement^=top] + .bs-popover-auto[x-placement^=left] > .arrow:after,
.bs-popover-bottom ~ .bs-popover-left > .arrow:after,
.bs-popover-bottom + .bs-popover-left > .arrow:after,
.bs-popover-auto[x-placement^=bottom] ~ .bs-popover-auto[x-placement^=left] > .arrow:after,
.bs-popover-auto[x-placement^=bottom] + .bs-popover-auto[x-placement^=left] > .arrow:after,
.bs-popover-right ~ .bs-popover-left > .arrow:after,
.bs-popover-right + .bs-popover-left > .arrow:after,
.bs-popover-auto[x-placement^=right] ~ .bs-popover-auto[x-placement^=left] > .arrow:after,
.bs-popover-auto[x-placement^=right] + .bs-popover-auto[x-placement^=left] > .arrow:after {
    border-left-color: rgb(var(--popover-color2)) !important;
}
.bs-popover-left > .arrow:before, 
.bs-popover-auto[x-placement^=left] > .arrow:before {
    border-left-color: rgba(255,255,255,0.15);
}
.popover.show {
    transition: all 0s ease-in 0.4s;
    will-change: transition;
}
.popover:not(.show) {
    transition: all 0s ease 0s;
    will-change: transition;
}
/* Tooltip */

.tooltip {
    font-family: var(--HeaderFont);
    font-weight: 400 !important;
    font-size: 12px !important;
    line-height: 16px !important;
    letter-spacing: 0.4px !important;
    min-height: 24px !important;
}
.tooltip-inner {
    padding: 8px;
    color: rgb(var(--tooltip-color)) !important;
    background-color: rgb(var(--on-surface)) !important;
    border-radius: 4px;
    box-shadow: var(--elevation-0) !important;
}
#TruncatedText .tooltip-inner {
    width:365px; 
    max-width:365px
}  

.bs-tooltip-top .arrow:before,
.bs-tooltip-auto[x-placement^=top] .arrow:before {
    border-top-color: rgb(var(--on-surface)) !important;
}

.bs-tooltip-bottom .arrow:before,
.bs-tooltip-auto[x-placement^=bottom] .arrow:before {
    border-bottom-color: rgb(var(--on-surface)) !important;
}

.bs-tooltip-right .arrow:before,
.bs-tooltip-auto[x-placement^=right] .arrow:before {
    border-right-color: rgb(var(--on-surface)) !important;
}

.bs-tooltip-left .arrow:before,
.bs-tooltip-auto[x-placement^=left] .arrow:before {
    border-left-color: rgb(var(--on-surface)) !important;
}

/* Modal Close Button */
.modal-header .close {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 5rem;
    color: rgb(var(--on-surface-variant));
    height: 40px;
    max-height: 40px;
    min-width: 40px;
    width: 40px;
    margin-top: 0%;
    margin-left: auto;
    margin-right: -1%;
    overflow: hidden;
    box-shadow: none;
    transition: var(--trans-0);
}
.modal-header .close:where(:hover, :focus-visible) {
    background-color: rgb(var(--on-surface),var(--btn-hover));
    box-shadow: var(--elevation-0);
    opacity: 1;
}
.modal-header .close:where(:active, :focus, :active:focus) {
    background-color: rgb(var(--on-surface),var(--btn-active));
    box-shadow: none;
    opacity: 1;
}

 #scene-edit-details .edit-buttons-container {
    margin: 0;
    background-color: rgb(var(--body-color2));
    background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjMWEyMDI1Ij48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDVMNSAwWk02IDRMNCA2Wk0tMSAxTDEgLTFaIiBzdHJva2U9IiMxMDE0MTciIHN0cm9rZS13aWR0aD0iMSI+PC9wYXRoPgo8L3N2Zz4=");
    padding: 16px 0 !important;
    align-items: center;
    border: 0;
    z-index: 20901;
}
@media (max-width: 575.98px) {
    #scene-edit-details .edit-buttons-container {
        background-image: none;
        background-color: rgb(var(--body-color2));
    }
}
.form-container.edit-buttons-container.px-3.pt-3.row {
    border-bottom: 1px solid rgb(var(--outline-variant)) !important;
}

img.performer-card-image {
    scale: 100%;
}
.performer-card-image, 
.performer-card, .card-image {  
    min-width: 180px;
    width: 15.26vw;
    max-width: 236px;
    max-height: 746px;
}

.image-section { 
    display: cover;
}

.gallery-card.card {
    padding-bottom: 0;
}

.tag-card-image {
    height: auto;
    min-height: 60px;
}

.card-section { 
    margin-bottom: 0 !important;
    padding: 8px 16px 12px;
    min-height: 160px;
    height: auto;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
}
.image-card .card-section,
.gallery-card .card-section {
    min-height: 60px;
    height: auto;
}
.tag-card .card-section {
    min-height: 170px;
    height: auto;
}
.performer-card .card-section {
    min-height: 116px;
    display: block;
    padding-top: 12px;
    padding-bottom: 0.01px;
}
.card-section span {
    padding-bottom: 4px;
    font-size:11px;
    line-height: 16px;
    letter-spacing: 0.5px;
    color: rgb(var(--date-color));
    font-weight: 500;
    font-family: var(--BodyFont);
}

.alert-danger {
    color: rgb(var(--on-error-container));
    background-color: rgb(var(--error-container));
    border-color: transparent;
}
.delete-dialog .form-check {
    padding-top: 0.75rem;
}

.recommendations-container {
    padding-top: 10px;
    padding-right: 0;
    padding-left: 0;
}
.recommendation-row-head h2 {
    font-size: 45px;
    font-weight: 200;
    line-height: 52px;
    letter-spacing: 0;
    color: #d3dae0;
    text-transform: none;
}
.recommendation-row-head a {
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    letter-spacing: 0.1px;
}
.recommendations-container .recommendations-footer {
    margin-bottom: 35px;
    margin-top: 12px;
}

.scene-card__description,
.gallery-card__description {
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 0.25px;
    color: rgb(var(--description-color));
}

.performer-card__age {
    color: rgb(var(--date-color));
}
.performer-card .card-section span.performer-name {
    color: rgb(var(--white-color));
    font-size: 16px;
    line-height: 24px;
    letter-spacing: 0.5px;
    font-weight: 400;
    font-family: var(--HeaderFont);
    overflow-wrap: normal;
    word-break: normal;
}
h5.card-section-title, .scene-tabs .scene-header {  
    font-family: var(--HeaderFont);
    text-shadow: none;
}

.scene-tabs .scene-header { 
    margin-bottom: 12px;
    margin-top: 8px;
    color: rgb(var(--white-color));
    text-shadow: var(--really-light-txt-shadow);
}
.scene-tabs .studio-logo {  
    margin-top: 0;
}

.scene-studio-overlay {
    top: 0.5rem;
}
.extra-scene-info {
    display: none;
    padding-left: 12px;
}

/* --- The Resolution and the Time/Length of the video --- */
.scene-specs-overlay, 
.scene-interactive-speed-overlay {
    font-family: FiraCode, Verdana,'DejaVu Sans', Arimo, NotoSans, Arial, "Segoe UI", sans-serif, system-ui, serif, math;
    color: rgb(var(--body-color2));
    border-style: none;
    font-weight: 600;
    bottom: 8.9%;
    letter-spacing: 0.03rem;
    font-variant-numeric: slashed-zero tabular-nums;
    background-color: rgba(var(--white-color),0.35);
    border-radius: 5rem 0 0 5rem;
    margin-right: -12px;
    padding: 2px 12px 2px 0;
    backdrop-filter: blur(6px);
    opacity: 0.9;
    text-shadow: none;
}
.scene-interactive-speed-overlay {
    bottom: 28%;
    font-weight: 500;
    visibility: collapse;
}
.overlay-resolution {
    color: #21323f;
    border-style: none;
    margin-right: 0.5rem;
    background-color: rgba(var(--white-color),0.24);
    border-radius: 5rem 0 0 5rem;
    padding: 4px 8px 4px 12px;
}

.slick-slide .card {
    height: 96%;
}

.scene-details h6 {
    color: rgb(var(--date-color));
    text-shadow: var(--light-txt-shadow);
    padding-bottom: 0;
}

.show>.buttons-container.row .btn.btn.primary { 
    margin: 0; 
}

.card hr {
    margin-top: 8px;
    margin-right: 16px;
    margin-left: 16px;
    margin-bottom: 12px;
    background-color: rgb(var(--card-fold));
    height: 1px;
}

.card.performer-card {
    padding: 0.01px;
    max-height: 800px;
}
.card-popovers .btn {
    padding: 8px 12px;
    margin-right: 8px;
}
.scene-popovers .fa-icon {
    margin-right: 2px;
}
.scene-popovers, 
.card-popovers { 
    max-height: 56px;
    height: 56px;
    margin-bottom: 0;
    display: flex;
    justify-content: space-between;
    padding-bottom: 16px;
    padding-top: 4px;
    padding-right: 16px;
    padding-left: 16px;
    flex-wrap: wrap;
    align-items: flex-end;
    align-content: flex-end;
}
.gallery-card .card-popovers {
    margin-bottom: 16px;
}
.scene-card__details, 
.gallery-card__details {
    margin-bottom: unset;
}

.scene-card a, 
.gallery-card a {
    color: rgb(var(--white-color));
    display: flex;
    outline: 0;
}

.zoom-1 .gallery-card-image, .zoom-1 .tag-card-image {
    max-height: 220px;
    max-width: 100%;
    margin: auto;
    object-fit: contain;
}
.tag-card {
    padding: 0;
}

/* --- Thumbnail images slightly darkened and brightened --- */
.scene-card-preview-image {
    filter: brightness(92%) contrast(1.2) saturate(0.93);
}
.scene-card-preview-image:hover {
    filter: brightness(100%);
    transition: filter 0.25s ease-in-out 0.35s;
}


.scene-card-preview, /* ||Thumbnail Card Preview Images */
.gallery-card-image, 
.tag-card-image, 
.image-card-preview { 
    margin-top: -1%;
    margin-bottom: -1%;
}



/*scenes List View */
.table {
    color: rgb(var(--description-color));;
    border-style: solid;
    border: 2px solid #899390;
    margin-bottom: 16px;
    margin-top: 16px;
}
td:first-child {
    display: inline;
}
.table td {
    border: 1px solid #373d3b;
}
.table th,
.table td {
    padding: 12px 8px 12px 8px;
}
.table th:last-child {
    padding-right: 16px;
}
table.table.table-striped.table-bordered, 
table.table.table-striped.table-bordered th, 
table.table.table-striped.table-bordered td,
table.table.table-striped.table-bordered tr {
    border: 2px solid var(--body-color2);
    border-right: 0;
    border-left: 0;
    border-top: 0;
    transition: background 220ms cubic-bezier(0.4, 0, 0.2, 1), border-right 120ms ease;
}
table.table.table-striped.table-bordered>tbody>tr>td {
    border-right: 1px solid rgb(var(--card-color2-hover));
    transition: background 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}
table.table.table-striped.table-bordered>tbody>tr:hover>td,
table.table.table-striped.table-bordered>tbody>tr:nth-child(odd):hover>td {
    border-right: 1px solid #3f4946;
}
table.table.table-striped.table-bordered>tbody>tr>td:last-of-type {
    border-right: 0;
}
table.table.table-striped.table-bordered>tbody>tr>td:first-of-type:has(>label>*.form-control) {
    border-right: 0;
}
table.table.table-striped.table-bordered>thead {
    background: rgb(var(--card-color2-hover));
}
.table-striped tr:nth-child(odd) td,
.table-striped tbody tr:nth-of-type(odd) {
    /*background: #2e3c46;*/
    background: rgb(var(--tables-odd));
}
.table-striped tbody tr:hover,
.table-striped tbody tr:nth-child(odd):hover td {
    background: rgb(var(--tables-hover));; /*#00695e*/
}
.table-striped tbody tr:hover a, 
.table-striped tbody tr:hover td, 
.table-striped tbody tr:nth-child(odd):hover a, 
.table-striped tbody tr:nth-child(odd):hover td {
    color: rgb(var(--on-surface));
}

.table tbody td.d-none.d-sm-block {
    background: #3a756a;
}
.table tbody tr td {
    text-align: left;
}
.table tbody tr td label:first-of-type  {
    padding-left: 16px;
    padding-right: 16px;
    display: flex;
    align-content: center;
    flex-wrap: wrap;
}
.table-list a {
    color: rgb(var(--on-background));
}
.table-list tr:nth-child(odd) a {
    color: rgb(var(--on-surface));
}
.table-list td, 
.table-list th {
    border-left: 0 solid #4c5452;
    font-size: 14px;
    font-weight: 400;
    line-height: 16px;
    letter-spacing: 0.5px;
}
.table-list td h6 {
    font-weight: 400;
    line-height: 16px;
    letter-spacing: 0.5px;
}
.table thead th {
    color: #cfdbe2;
    font-size: 14px;
    font-weight: 600;
    line-height: 16px;
    letter-spacing: 0.8px;
    border-bottom: 2px solid #899390;
}
.table thead th,
.table thead th:nth-child(6), 
.table thead th:nth-child(7),
.table thead th:nth-child(8),
.table thead th:nth-child(9),
.table thead th:nth-child(10) {
    text-align: left;
}

table.table.table-striped.table-bordered>tbody>tr>td:has(>a>.image-thumbnail) {
    border: 0 !important;
}

.row.scene-table.table-list.justify-content-center>table.table.table-striped.table-bordered {
    flex: 1 1 auto;
}
/* Scraper Table */
.scraper-table>thead th{
    /*background-color: #20413b;*/
    background-color: #133348;
    color: #accae5;
}
.scraper-table>tbody {
    border: 1px solid #0a1211;
}
.scraper-table tr {
    color: #aab5be;
}
.scraper-table>tbody>tr:nth-child(even),
.scraper-table>tbody>tr:nth-child(even) td {
    /*background-color: #414846;*/
    background-color: #26323a;
}
.scraper-table>tbody>tr:nth-child(odd),
.scraper-table>tbody>tr:nth-child(odd) td {
    /*background-color: #373d3b;*/
    background-color: #2e3c46;
}
.scraper-table th, .scraper-table td {
    background-color: #2d3130;
    border: 1px solid #0a1211;
} 
.scraper-table tr>td:first-child {
    background-color: transparent;
    color: #cae6ff;
    border: 0;
    position: relative;
    top: 5px;
}
/* Duplicate Table */
#scene-duplicate-checker.card>.duplicate-checker>.table-responsive>table.duplicate-checker-table.table.table-striped {
    background-color: #26323a;
}
#scene-duplicate-checker.card>.duplicate-checker>.table-responsive>table.duplicate-checker-table.table.table-striped>tbody>tr:nth-child(odd),
#scene-duplicate-checker.card>.duplicate-checker>.table-responsive>table.duplicate-checker-table.table.table-striped>tbody>tr:nth-child(odd) td,
#scene-duplicate-checker.card>.duplicate-checker>.table-responsive>table.duplicate-checker-table.table.table-striped>tbody>tr:nth-child(even),
#scene-duplicate-checker.card>.duplicate-checker>.table-responsive>table.duplicate-checker-table.table.table-striped>tbody>tr:nth-child(even) td {
    background: #26323a;
    background-color: #26323a;
}
#scene-duplicate-checker.card>.duplicate-checker>.table-responsive>table.duplicate-checker-table.table.table-striped>tbody>tr.separator:nth-child(odd):not(.duplicate-group),
#scene-duplicate-checker.card>.duplicate-checker>.table-responsive>table.duplicate-checker-table.table.table-striped>tbody>tr.separator:nth-child(even):not(.duplicate-group) {
    background: #414846;
    background-color: #414846;
}
#scene-duplicate-checker.card>.duplicate-checker>.table-responsive>table.duplicate-checker-table.table.table-striped>thead th {
    background-color: #1e282e;
}
#scene-duplicate-checker.card>.duplicate-checker>.table-responsive>table.duplicate-checker-table.table.table-striped tbody tr td:first-child {
    display: revert;
}
/* Gallery List Table */
div:has(>*.filter-tags)>table:not(.table-striped):not(.table-bordered).table>thead th {
    background-color: #2b5a52;
}
div:has(>*.filter-tags)>table:not(.table-striped):not(.table-bordered).table>tbody>tr>td:not(.d-none.d-sm-block):has(>a) {
    border-color: transparent;
}
div:has(>*.filter-tags)>table:not(.table-striped):not(.table-bordered).table>tbody>tr>td>a>img.w-100.w-sm-auto {
    position: relative;
    left: -9px;
}
div:has(>*.filter-tags)>table:not(.table-striped):not(.table-bordered).table>tbody>tr>td.d-none.d-sm-block:has(>a) {
    border: 0;
    border-bottom: 2px solid #899390;
}
div:has(>*.filter-tags)>table:not(.table-striped):not(.table-bordered).table>tbody>tr:last-of-type>td.d-none.d-sm-block:has(>a) {
    border-bottom: 0;
}

/* --- Wall View --- */
.wall-item-container {
    width: 100%; 
    background-color: rgba(0, 0, 0, .10); 
    overflow:hidden;
}
.wall-item-media { 
    height:100%; 
    background-color: rgb(0, 0, 0);
    overflow:hidden;
}
.wall-item-anchor { 
    width: 102%; 
    overflow:hidden;
}
.wall-item-text {
    margin-bottom:0px; 
    color: #111; 
    text-shadow: 1px 1px 1px #ffffff61;
    background: linear-gradient(rgba(255,255,255,0.15), rgba(255,255,255,0.5));
    backdrop-filter: blur(2px);
    font-weight: 500;
    font-size: 16px;
}

/* --- Changes the font in the File Info section --- */
div.scene-file-info .TruncatedText, div.scene-file-info .text-truncate {
    margin-left:-1.5%; 
    margin-top: -1px; 
    width: 120%; 
    font-family: var(--HeaderFont);
    font-size: 110%; 
    line-height:120%; 
    font-weight:bold; 
    text-shadow: none;
}

#scene-edit-details .pl-0 {
    padding-left: 10px!important;
}

/* ||FIXME -- make the below happen correctly */
/* --- Shrink the Player Height just a little bit to avoid the scroll bar --- */
#jwplayer-container {    
    height: calc(99.5vh - 4rem);
}
.scene-tabs {   
    max-height: calc(99vh - 4rem); 
    padding-left: 0;
}

div.tagger-container .btn-link {    
    font-family: var(--UnicodeFont); 
    color: rgb(var(--on-surface-variant)); 
    background-color: rgb(var(--surface-variant));
    padding: 0 8px;
    margin: 16px; 
    box-shadow: var(--elevation-0);
    z-index: 5;
    filter: none;
    min-height: 40px;
    height: 40px;
    top: -1%;
}

.scene-tabs h1.text-center {
    margin-bottom: 32px;
}
.studio-stashid-icon svg.svg-inline--fa.fa-circle-check.fa-icon.undefined {
    color: #309e27 !important;
}

.modal-backdrop {
    background-color: black;
}
.modal-backdrop.show { 
    opacity: 0.6;
}

.show {
    transition: all 0.5s cubic-bezier(0.2, 0.0, 0, 1.0);
}
.fade {
    transition: all 0.3s cubic-bezier(0.3, 0.0, 0.8, 0.15);
}
.modal.fade .modal-dialog {
    transform: translateY(1.5%);
    margin-top: 0;
}
.modal.show div#settings-dialog.modal-dialog {
    transition: all 0.8s ease-in;
    transition-delay: 0.4s;
}
.modal.fade div#settings-dialog.modal-dialog {
    transition: all 0.8s ease-in-out;
    transition-delay: 0.4s;
}
.modal-content, .modal-lg, .modal-xl {
    max-width: 1400px;
    width: 100%;
    box-shadow: var(--elevation-3);
    max-height: 900px !important;
    height: 100%;
}
.modal-footer {
    border: 0;
    border-radius: 0 0 28px 28px;
}
.modal-footer>* {
    margin: 0.75rem;
}
.modal-body, .modal-footer, .modal-header {
    background-color: rgba(var(--modal-color));
    color: rgb(var(--on-surface));
    border: 0;
    border-color: transparent;
    font-size: 16px;
    letter-spacing: 0.031em;
    line-height: 24px;
    font-weight: 400;
    padding: 16px 24px 24px;
}
.modal-body input.text-input.form-control {
    background-color: rgba(var(--modal-color)) !important;
}
.modal-header {
    border: 0;
    border-radius: 28px 28px 0 0;
    color: #cae9e3;
    font-weight: 200;
    font-size: 57px;
    line-height: 64px;
    letter-spacing: -0.016em;
    font-family: var(--HeaderFont);
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
    padding: 16px 24px;
}
.dialog-content .criterion-list.accordion {
    margin-right: -2%;
    margin-left: auto;
}
.dialog-content .criterion-list.accordion .card {
    background-color: rgb(var(--card-color));
}
.dialog-content .criterion-list.accordion .card:nth-of-type(1) {
    padding-top: 12px;
}
.dialog-content .criterion-list.accordion .card:last-of-type {
    padding-bottom: 12px;
}
.dialog-content .criterion-list.accordion .card >.filter-item-header {
    padding-top: 13.5px;
    padding-bottom: 13.5px;
    height: 72px;
    max-height: 72px;
    border-radius: 0;
    align-items: center;
    font-weight: 400;
    font-size: 22px;
    line-height: 28px;
    letter-spacing: 0;
}
.dialog-content .criterion-list.accordion .card >.filter-item-header:has(+ .collapse:not(.show)):hover {
    background-color: rgb(var(--card-color-hover));
    border-radius: 0;
}
.dialog-content .criterion-list.accordion .card > .filter-item-header:focus-visible {
    color: rgb(var(--on-tertiary-container));
    font-weight: bold;
    text-decoration: underline;
    text-decoration-color: rgb(var(--on-tertiary-container));
    text-underline-offset: 0.3em;
    text-decoration-thickness: from-font;
}

.edit-filter-dialog .filter-tags {
    border-top: 0;
    padding: 1rem 1rem 0;
}

button.remove-criterion-button.btn.btn-minimal > svg.svg-inline--fa.fa-xmark.fa-icon {
    min-height: 18px;
    font-size: 25px;
}
.edit-filter-dialog .criterion-list .pin-criterion-button {
    font-size: 24px;
}
.edit-filter-dialog .criterion-list :is(.pin-criterion-button, .remove-criterion-button) {
    color: rgb(var(--on-surface-variant));
    border-radius: 5rem;
    width: 40px;
    max-width: 40px;
    height: 40px;
}
.edit-filter-dialog .criterion-list .filter-item-header .btn:hover {
    background-color: rgb(var(--on-surface-variant),var(--btn-hover));
    box-shadow: var(--elevation-0);
    filter: none;
}
.edit-filter-dialog .criterion-list .filter-item-header .btn:focus-visible {
    background-color: rgba(var( --pry-container));
    color: rgb(var(--on-tertiary-container));
    outline-color: rgb(var(--focus-ring));
    outline-offset: -0.06rem;
    outline-style: solid;
    outline-width: 0.24rem;
    box-shadow: none;
    filter: none;
}
/*.modal-body,
.edit-filter-dialog .modal-body {
    margin-top: -14px;
    margin-bottom: -14px;
    padding-right: 1rem;
    padding-left: 1rem;
}*/
.modal-title h4 {
    font-weight: 200;
}

/* For Modal -- Relaease Notes */
.modal-body > .m-n3 > .m-3:has(>.markdown) > h3 {
    color: rgb(var(--outline));
}

#settings-dailog .modal-content .sub-heading {
    background-color: rgba(0,0,0,0.12);
    padding: 0.5rem;
}
#setting-dialog .sub-heading {
    font-size: 11px;
    line-height: 16px;
    letter-spacing: 0.031em;
    font-weight: 500;
}

.performer-create-modal {
    max-width:1300px;
}

.modal-body .col-form-label, 
.modal-body .col-6, 
.modal-footer, 
.modal-header .col-form-label {
    text-shadow: none;
}

.modal-body .col-6 strong {
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 0.016em;
}
.modal-body .no-gutters {
    margin-bottom: 8px;
}

.modal-body .dialog-container .col-lg-3 {
    flex: 0 0 12%;
    max-width: 12%;
}

.modal-body .dialog-container .offset-lg-3{
    margin-left: 12%;
} 
.modal-body .dialog-container .col-lg-9{
    flex: 0 0 88%; 
    max-width: 88%;
}
textarea.text-input.code.form-control {
    font-family: var(--MonoFont);
    font-size: 12px;
    font-weight: 200;
    line-height: 16px;
    letter-spacing: 0.028em;
}
.modal-body textarea.text-input.code.form-control,
.modal-body textarea.text-input.code.form-control:hover,
.modal-body textarea.text-input.code.form-control:focus,
.modal-body textarea.text-input.code.form-control:active {
    background-image: linear-gradient(to right, rgba(var(--pry-color),var(--text-field-tint)), rgba(var(--pry-color),var(--text-field-tint))) !important;
    background-color: rgba(var(--modal-color)) !important;
    background-blend-mode: screen;
    border: 0;
    box-shadow: var(--elevation-0-inverse);
}

.edit-filter-dialog .modal-header {
    padding: 12px 16px;
}

@media (min-width: 576px) {
    #setting-dialog .modal-content .modal-body textarea {
        min-height:350px; 
        height:65vh !important
    }
    .modal-dialog .modal-content .form-group .multi-set {
        width:82%;
        margin-top:12px; 
        flex: 0 0 82%; 
        max-width:82%;
    }
    .modal-dialog .modal-content .form-group .col-9 {
        flex: 0 0 82%;
        max-width: 82%;
    }
    .modal-dialog .modal-content .col-3 {    
        flex: 0 0 18%; 
        max-width: 18%;
    }
    .modal-dialog .modal-content .form-group > .form-label {
        margin-top: 0px;
        flex: 0 0 18%;    
        max-width: 18%;
        text-shadow: none;
    }
    /* FIXME - use this skeleton for all form labels in modal */
    .modal-dialog .modal-content .form-group > .form-label[for~="url"] {
        transition: all 0.2s ease-in-out;
        left: 58px;
        font-size: 11px;
        font-weight: 500;
        line-height: 16px;
        letter-spacing: 0.5px;
        top: -10px;
        background-color: #254e46;
        padding-left: 4px;
        padding-right: 4px;
        padding-top: 2px;
        padding-bottom: 2px;
        height: 20px;
        max-width: 30px;
        z-index: 33390;
        visibility: hidden;
    }
    .modal-dialog .modal-content .form-group:focus-within > .form-label[for~="url"] {
        color: #00dfc6;
        visibility: visible;
    }
    .modal-dialog .modal-content .form-group {
        display: flex; 
        flex-wrap: wrap;
    }
    .modal-dialog .modal-content .btn-group>.btn:not(:first-child), .btn-group>.btn-group:not(:first-child) {
        margin-left: 1px;
    }
    .modal-dialog .modal-content .form-label[for~="movies"],
    .modal-dialog .modal-content .form-label[for~="tags"],
    .modal-dialog .modal-content .form-label[for~="performers"] {
        margin-top:48px;
    }
    .modal-dialog .modal-content .button-group-above {
        margin-left:9px;
        margin-bottom: 6px;
    }
    .modal-dialog .scraper-sources.form-group h5 {
        margin-top:20px;
    }
    .modal-dialog .modal-content .field-options-table {
        width:98%;
    }

    .modal-dialog.modal-lg .modal-content .form-group {
        display: inline;
    }
}
@media (max-width: 575.98px) {
    .performer-card {
        height: 25.5rem;
    }
}
@media (max-width: 575.98px) and (orientation: portrait) {
     .scene-card-preview-image {
         height: calc(100vw * (9 / 16));
    }
     .gallery-tabs .mr-auto.nav.nav-tabs {
         display: grid;
         grid-auto-flow: column;
         text-align: center;
         left: 0;
         right: 0;
         position: fixed;
    }
     .VideoPlayer.portrait .video-js {
         height: 56.25vw;
    }
     .gallery-container .tab-content {
         top: 3rem;
         position: fixed;
         height: calc(100vh - 6.5rem);
    }
     .gallery-tabs {
         display: none;
    }
     .btn-toolbar {
         padding-top: 1.3rem;
    }
     body {
         padding: 0rem 0 5rem;
    }
     .scene-tabs .mr-auto.nav.nav-tabs {
         background-color: var(--card-color2);
         display: grid;
         grid-auto-flow: column;
         height: 3rem;
         left: 0;
         margin: 0;
         margin-bottom: 0;
         max-height: 3rem;
         padding-bottom: 2.2rem;
         padding-top: 0.1rem;
         position: fixed;
         right: 0;
         text-align: center;
         top: calc(100vw * (9 / 16));
         white-space: nowrap;
         z-index: 20;
    }
     .scene-tabs.order-xl-first.order-last {
         height: calc(100vh - (100vw * (9 / 16) + 8.5rem));
         top: calc((100vw * (9 / 16)) + 5rem);
         position: fixed;
    }
     .tab-content {
         overflow-y: auto;
         overflow-x: hidden;
    }
     .studio-card {
         width: 100%;
         height: 294px;
    }
     .movie-card {
         width: 45%;
    }
     .performer-card-image {
         height: 19rem;
    }
     .performer-card {
         /*width: 14rem;*/
         height: 27.5rem;
    }
     .scene-performers .performer-card-image {
         height: 19rem;
    }
     .scene-performers .performer-card {
         width: 14rem;
         height: 27.5rem;
    }
     .movie-card .TruncatedText {
         display: none;
    }
     .nav-tabs .nav-link.active:hover {
         outline: none;
         border-bottom: 2px solid;
    }
     #performer-details-tab-edit{
         display: none;
    }
     #performer-details-tab-operations{
         display: none;
    }
     .scene-tabs .ml-auto.btn-group {
         position: fixed;
         right: 1rem;
         top: calc((100vw * (9 / 16)) + 2.7rem);
    }
     .stats-element {
         flex-grow: 1;
         margin: auto 0rem;
    }
     .stats {
         margin-left: 0px;
    }
     div[data-rb-event-key="/images"] {
         display: none;
    }
     div[data-rb-event-key="/scenes/markers"] {
         display: none;
    }
     .row.justify-content-center.scene-performers {
         max-height: 450px;
         display: flex;
         flex-direction: column;
         overflow: auto;
         border-top: solid 2px #0a1211;
         border-bottom: solid 2px #0a1211;
         padding-top: .5rem;
         padding-bottom: .5rem;
    }
     .scene-tabs {
         max-height: 100%;
    }
}

.markdown h1 {
    color: #99b8cf;
}
.markdown h2 {
    color: #87a6bd;
}
.markdown h3 {
    color: #85a3bf; /*variant of the secondary color */
}
.markdown h4 {
    color: #6589a1;
}
.markdown table>td,
.markdown table>th {
    background-color: transparent;
    border: 1px solid transparent;
}
.markdown code {
    background-color: #222f37;
    color: #eaf0f4;
    border-radius: 3px;
    text-decoration: none !important;
    text-decoration-color: white !important;
}
.markdown blockquote code,
.markdown pre code {
    font-size: 1.3rem;
}
.markdown blockquote strong {
    color: #D0D662;
    font-family: Verdana, system-ui, ui-sans-serif;
}
.markdown a {
    text-decoration: solid underline;
    text-decoration-color: currentColor;
}
.markdown a > code {
    background-color: rgba(255,255,255,0.12);
    color: #fff;
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-shadow: none;
    text-decoration: none !important;
    text-decoration-color: transparent !important;
}
.markdown table thead tr th {
    background-color: #1b3530;
    border: 1px solid #0a1211;
}
.markdown table tbody tr {
    border: 1px solid #0a1211;
}
.markdown blockquote, .markdown pre {
    background-color: #334e4c;
}

.markdown table tr:nth-child(odd) {
    background-color: #414846;
}
.markdown table tr:nth-child(even) {
    background-color: #373d3b;
}
.markdown table tbody tr>td:first-child {
    border-color: transparent;
}
.markdown table tbody tr>td:first-child>code {
    background-color: transparent;
}

/* Studios */
.studio-card {  
    padding: 0;
}

.studio-details input.form-control-plaintext {  
    background-color: rgba(16,22,26,.0); 
}
.studio-details .react-select__control--is-disabled  {  
    background: none; 
    border:0;
}
.studio-details .form-group, .studio-details td { 
    padding: 8px; 
}
.studio-details table td:nth-child(1) {
    color:#FFF;
}

.studio-card-image {
    max-height: 175px; 
    height:175px;
    padding: 16px 12px 0 12px;
}
.studio-card-image {
    min-width: 260px; 
    width: calc(244px + 19vw / 3.8); 
    max-width: 360px; 
    margin: 0 1px;
}
.studio-card .card-section {    
    margin-top: 22px;
    min-height: 90px;
    height: auto;
}

@media (min-width: 1200px) {
.pl-xl-5, .px-xl-5 {
    padding-left: 1rem!important; 
    padding-right: 1rem!important;
    } 
}
.no-gutters .TruncatedText, 
.tag-card .TruncatedText, 
div.card.studio-card .TruncatedText, 
.tagger-container .col > .scene-link > .TruncatedText  {
    font-family: var(--HeaderFont);
    font-size: 22px;
    line-height: 28px;
    letter-spacing: 0.3px;
    font-weight: 700;
    text-shadow: none;
}
.no-gutters .TruncatedText, 
.tag-card .TruncatedText,
div.card.studio-card .TruncatedText {
    font-weight: 400;
}
.tag-card .TruncatedText.tag-description > p {
    font-size: 14px;
    font-weight: 500;
    font-family: var(--BodyFont);
    line-height: 20px;
    letter-spacing: 0.25px;
}


.tagger-container .col > .scene-link > .TruncatedText {
    height: 68px;
    padding: 1px 16px 1px 16px;
    text-shadow: var(--light-txt-shadow);
    display: flex;
    align-items: center;
    font-size: 17.5px;
    line-height: 26px;
    font-weight: 700;
    color: rgb(var(--nav-white));
    transform: translate(0%,0%);
    text-decoration: none;
    text-decoration-color: transparent;
    transition: text-shadow 0.2s ease-in, color 0.25s ease-in, all 0s;
    border-radius: 0 0 12px 0;
    width: 39.25vw;
    max-width: 59.78vh;
}

/* doesn't except variables??? --white-color used for background. And darkened text shadow. */
.tagger-container .col > .scene-link > .TruncatedText:is(:active, :focus, :hover, :visited) {
    background-color: transparent;
    text-shadow: var(--really-light-txt-shadow);
    text-decoration: none;
    text-decoration-color: transparent;
}

.no-gutters .TruncatedText {
    font-size: 16px;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0.5px;
}
input.form-control-plaintext { 
    background:none;
}

.studio-details table { 
    margin-top: 20px; 
    background-color: rgba(0,26,24,0.20); 
    border-radius: 10px; 
    margin-bottom:20px;
}
.studio-details .form-group,
.tag-details form#tag-edit {
    margin:0;
}

.details-edit {
    align-items: center;
    margin-top: 16px;
    margin-bottom: 32px;
}
.input-group-append {
    position: relative;
}
.input-control, .text-input {
    color: rgb(var(--interactive-input));
    box-shadow: inset 0 0 0 1px transparent;
    border: 1px solid rgb(var(--outline));
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    letter-spacing: 0.15px;
    caret-color: rgb(var(--pry-color));
}
.studio-details table div.react-select__control {
    background: none; 
    border: 0px;
    margin:0;
}
.studio-details table .css-1hwfws3 { 
    padding:0px; 
}

.studio-details .form-group, .movie-details td { 
    padding: 8px; 
}
.studio-details .form-group td:nth-child(1),
.studio-details table tbody tr td:nth-child(1), td:first-child {
    width: 130px;
}
.studio-details table tr:nth-child(odd) { 
    background-color: rgba(16,22,26,0.1); 
}

.studio-details .form-group, 
.studio-details table td:nth-child(1) {
    color:#Fff; 
    text-shadow: 0 1px 2px rgba(0,0,0,0.40);
}
.movie-details .form-group td:nth-child(1), 
.movie-details table tbody tr td:nth-child(1), 
td:first-child {
    width: 120px;
}

#studio-edit .form-group.row:nth-last-child(1) .form-group {
    background-color: transparent;
}

div.studio-details dl.details-list {
    grid-column-gap:0
}
.studio-details dt, .studio-details dd {
    padding: 6px 0 8px 8px
}
.svg-inline--fa.fa-w-18 {
    width: 1.4em;
}

.slick-prev::before, 
.slick-next::before {
    font-size: 32px;
    color: rgb(var(--btn-primary));
    border-radius: 12px;
    /*background: radial-gradient(ellipse at center, #e2f6ff 0, #e2f6ff 50%, transparent 65%);*/
    background-color: rgb(var(--body-color2));
    box-shadow: inset 0 0 0 15px rgb(var(--btn-primary)), var(--elevation-3);
    opacity: 1;
    padding: 9px 8px;
}
.slick-next {
    margin-right: 48px;
}
.slick-prev {
    margin-left: 16px;
    z-index: 300;
}
.slick-prev:hover::before, 
.slick-next:hover::before {
    opacity: 1;
    color: #6aadda;
    box-shadow: inset 0 0 0 15px #6aadda, var(--elevation-4);
}
.slick-prev:active::before, 
.slick-prev:active:hover::before, 
.slick-next:active:hover::before,
.slick-next:active::before {
    opacity: 1;
    color: #72b6e4;
    box-shadow: inset 0 0 0 15px #72b6e4 , var(--elevation-3);
}
.slick-next:focus-visible::before,
.slick-prev:focus-visible::before {
    border-radius: 12px;
    color: #6aadda;
    box-shadow: inset 0 0 0 15px #6aadda, var(--elevation-4);
    outline-color: rgb(var(--focus-ring));
    outline-style: solid;
    outline-width: 0.25rem;
    outline-offset: -1px;
    opacity: 1;
}
@media (max-width: 575px) {
    .slick-next,
    .slick-prev {
        margin: 0;
        pointer-events: none;
    }
    .slick-prev::before, 
    .slick-next::before {
        font-size: 0;
        color: transparent;
        background-color: transparent;
        border-radius: 0;
        box-shadow: none;
        padding: 0;
        outline: none;
    }
}


.slick-dots li button::before {
    color: rgb(var(--card-color2));
    content: "⬤";
    font-size: 12px;
    margin-top: 8px;
    opacity: 1;
}
.slick-dots li button:hover::before {
    color: #3b4d5c;
}
.slick-dots li.slick-active button::before {
    color: rgb(var(--pry-color));
    opacity: 1;
    content: "⬤";
    font-size: 12px;
    margin-top: 8px;
}

.recommendation-container {
    margin-top: 24px;
}
.recommendations-container-edit .recommendation-row:not(.scene-recommendations):not(.studio-recommendations):not(.performer-recommendations):not(.gallery-recommendations):not(.images-recommendations) {
    background-color: rgb(var(--body-color));
    margin-bottom: 1px;
}
.recommendation-row:not(.scene-recommendations):not(.studio-recommendations):not(.performer-recommendations):not(.gallery-recommendations):not(.images-recommendations)>.recommendation-row-head {
    background-color: rgb(var(--surface));
    border-radius: 0;
    padding-left: 16px;
    min-height: 56px;
    height: 56px;
}
.recommendation-row:not(.recommendation-row-add):not(.scene-recommendations):not(.studio-recommendations):not(.performer-recommendations):not(.gallery-recommendations):not(.images-recommendations)>.recommendation-row-head:hover {
    background-color: rgba(var(--surface-sel),var(--btn-hover-rev));
    box-shadow: var(--elevation-3);
}
.recommendation-row .recommendation-row-head>button.btn.btn-danger {
    margin-right: 48px;
}
div[draggable="true"] .recommendation-row:not(.scene-recommendations):not(.studio-recommendations):not(.performer-recommendations):not(.gallery-recommendations):not(.images-recommendations)>.recommendation-row-head::before {
    content: " ";
    display: inline-block;
    width: 2em;
    height: 1em;
    position: absolute;
    right: 0px;
    z-index: 100;
    margin: -0.5em 30px -0.5em -0.5em;
    background-color: transparent;
    background-size: 0.5em 0.5em;
    background-position: 0 0, 0.25em 0.25em;
    background-image: linear-gradient(45deg, rgb(var(--on-surface-variant)) 2px, transparent 2.5px), linear-gradient(225deg, rgb(var(--on-surface-variant)) 2px, transparent 2.5px);
}
.recommendation-row:not(.scene-recommendations):not(.studio-recommendations):not(.performer-recommendations):not(.gallery-recommendations):not(.images-recommendations)>.recommendation-row-head h2 {
    color: rgb(var(--on-surface));
    text-transform: uppercase;
    font-size: 16px;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0.5px;
}
.scene-recommendations>.recommendation-row-head,
.studio-recommendations>.recommendation-row-head,
.performer-recommendations>.recommendation-row-head,
.gallery-recommendations>.recommendation-row-head,
.images-recommendations>.recommendation-row-head {
    /*background: #212e37;*/
    /*border: 1px solid #899390;*/
    border-bottom: 0;
    border-top-left-radius: 28px;
    padding: 24px;
}
.recommendation-row-head a {
    background-color: rgb(var(--body-color2));
    border-radius: 5rem;
    border: 1px solid rgb(var(--outline));
    max-height: 40px;
    height: 40px;
    overflow-wrap: normal;
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-wrap: nowrap;
    text-shadow: none;
    text-decoration: none;
    overflow: hidden;
    padding: 8px 24px;
    color: rgb(var(--btn-primary));
    box-shadow: var(--elevation-0);
    transition: background-color 0.55s ease, background-image 0.5s ease, outline 0.4s ease-in, box-shadow 0.4s ease-in;
}
@media (max-width: 575.98px) and (orientation: portrait) {
    .recommendation-row-head a {
        padding: 8px 48px 8px 24px;
        white-space: nowrap;
    }
    .performer-recommendations .recommendation-row-head a {
        padding: 8px 72px 8px 24px;
        white-space: nowrap;
    }
}
.recommendation-row-head a:is(:hover, :focus-visible) {
    background-image: linear-gradient(to right, rgba(var(--btn-primary),var(--btn-hover)), rgba(var(--btn-primary),var(--btn-hover)));
}
.recommendation-row-head a:focus-visible {
    box-shadow: none;
    outline-color: rgb(var(--focus-color));
    outline-style: solid;
    outline-width: 0.25rem;
    outline-offset: -1px;
}
.recommendation-row-head a:is(:active, :focus, :focus:active) {
    background-image: linear-gradient(to right, rgba(var(--btn-primary),var(--btn-active)), rgba(var(--btn-primary),var(--btn-active)));
}

.btn-secondary.filter-item.col-1.d-none.d-sm-inline.form-control {
     background-color: rgba(0, 0, 0, .15);
}

/* Pagination Toolbar Buttons */
.pagination button.btn {
    flex-grow: 0;
}
.pagination button.btn.btn-secondary {
    background-color: transparent;
    border: 0;
    border-style: none;
    border-color: transparent;
    border-radius: 5rem !important;
    color: rgb(var(--on-pry-container));
    height: 40px;
    font-weight: 700;
    line-height: 20px;
    letter-spacing: 0.25px;
    box-shadow: none;
    text-shadow: none;
    transition: color .05s ease-in-out,background-color .4s ease 0.1s, border-color .05s ease-in-out,box-shadow .35s ease 0.05s,text-shadow .05s ease-in-out;
    /*background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cline x1='0' y1='80' x2='0' y2='20' stroke='rgba(0,0,0,0.85)' stroke-width='2' vector-effect='non-scaling-stroke'%3E%3C/line%3E%3C/svg%3E");
    background-repeat: repeat-y;
    background-position: left center;*/
    padding-left: 24px;
    padding-right: 24px;
    position: relative;
    overflow: hidden;
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: auto;
}             
/*.pagination .btn-secondary:first-child,
.pagination .btn-secondary:first-child:not(.disabled):not(:disabled) {
    background-image: none;
}*/
/* First two and Last two pagination buttons add text padding */
.pagination button.btn.btn-secondary:nth-of-type(-n+2),
.pagination button.btn.btn-secondary:nth-last-of-type(-n+2) {
    padding-left: 24px;
    padding-right: 24px;
}
.pagination button.btn.btn-secondary:not(:disabled):not(.disabled):hover {
    background-color: rgba(var(--pry-color),0.5);
    border-color: transparent;
    color: rgb(var(--on-pry));
    box-shadow: var(--elevation-1);
    outline: none;
    text-shadow: var(--really-light-txt-shadow);
    padding-left: 24px;
    padding-right: 24px;
}
.pagination button.btn.btn-secondary:not(:disabled):not(.disabled):focus-visible {
    outline-color: rgb(var(--focus-ring));
    outline-style: solid;
    outline-width: 0.19rem;
    outline-offset: -0.1rem;
    border-color: transparent;
    box-shadow: none;
    z-index: 2;
}
.pagination button.btn.btn-secondary:is(.disabled, :disabled, .disabled:hover, :disabled:hover) {
    background-color: transparent;
    background-image: none;
    border-color: transparent;
    box-shadow: none;
    text-shadow: none;
    outline: none;
    color: rgb(var(--on-pry-container));
    opacity: var(--disabled);
}
.pagination button.btn.btn-secondary:not(:disabled):not(.disabled).active,
.pagination button.btn.btn-secondary:not(:disabled):not(.disabled).active:is(:hover, :focus) {
    color: rgb(var(--on-pry));
    background-color: rgb(var(--pry-color));
    border-color: transparent;
    box-shadow: var(--elevation-0);
    text-shadow: none;
    outline: none;
    padding-left: 24px;
    padding-right: 24px;
}
.pagination button.btn.btn-secondary:not(:disabled):not(.disabled).active:focus-visible {
    outline-color: rgb(var(--focus-ring-active));
    outline-offset: -0.10rem;
    outline-style: solid;
    outline-width: 0.19rem;
    box-shadow: none;
    z-index: 2;
}
/*.pagination button.btn.btn-secondary:not(:disabled):not(.disabled):active:hover,
.pagination button.btn.btn-secondary:not(:disabled):not(.disabled).active:hover,
.pagination button.btn.btn-secondary:not(:disabled):not(.disabled):active:hover:focus,
.pagination button.btn.btn-secondary:not(:disabled):not(.disabled).active:hover:focus {
    background-color: #00f3d7;
    color: #001e1a;
    padding-left: 24px;
    padding-right: 24px;
    border-color: transparent;
    box-shadow: none;
    text-shadow: none;
    outline: none;
}*/
div.mb-2 .btn-secondary.form-control option,
div.mb-2 select.btn-secondary.form-control option:hover,
div.mb-2 select.btn-secondary.form-control option:focus,
div.mb-2 select.btn-secondary.form-control option.focus,
div.mb-2 select.btn-secondary.form-control:hover option,
div.mb-2 select.btn-secondary.form-control:focus option,
div.mb-2 select.btn-secondary.form-control.focus option {
    background-color: var(--card-color2);
    border-width: 0;
    border-style: none;
    appearance: none;
}

@media (min-width: 1200px) {
    .scene-divider:has(+.scene-player-container) > button.btn.btn-primary {
        color: rgb(var(--secondary));
        border: 0;
        background-color: rgb(var(--on-sec));
        font-size: 24px;
        font-weight: 900;
        box-shadow: var(--elevation-1);
        z-index: 2;
        height: 48px;
        width: 48px;
        max-width: 48px;
        padding: 0;
        margin-left: -16px;
        border-radius: 13px;
        opacity: 1;
        margin-top: 12px;
        transition: background-color 0.55s ease, color 0.2s ease-in, box-shadow 0.4s ease-in-out, margin-left 0.35s ease;
        -webkit-transition: background-color 0.55s ease, color 0.2s ease-in, box-shadow 0.4s ease-in-out, margin-left 0.35s ease;
        -moz-transition: background-color 0.55s ease, color 0.2s ease-in, box-shadow 0.4s ease-in-out, margin-left 0.35s ease;
    }
    .scene-divider:has(+.scene-player-container.expanded) > button.btn.btn-primary {
        margin-left: -4px;
    }
    .scene-divider:has(+.scene-player-container) > button.btn.btn-primary:hover {
        color: rgb(var(--secondary));
        background-image: linear-gradient(45deg, rgb(255,255,255,0.08), rgb(255,255,255,0.08));
        background-color: rgb(var(--on-sec));
        background-blend-mode: screen;
        box-shadow: var(--elevation-2);
    }
    .scene-divider:has(+.scene-player-container) > button.btn.btn-primary:active {
        color: rgb(var(--secondary));
        background-image: linear-gradient(45deg, rgb(255,255,255,0.12), rgb(255,255,255,0.12));
        background-color: rgb(var(--on-sec));
        background-blend-mode: screen;
        box-shadow: var(--elevation-1);
    }
    .scene-divider:has(+.scene-player-container) > button.btn.btn-primary:focus {
        color: rgb(var(--secondary));
        background-image: linear-gradient(45deg, rgb(255,255,255,0.12), rgb(255,255,255,0.12));
        background-color: rgb(var(--on-sec));
        background-blend-mode: screen;
        box-shadow: var(--elevation-1);
    }
}

.scrubber-wrapper {
    background-color: black;
    border-style: none;
    border-color: transparent;
    margin: 0px 0 5px 0;
    overflow: initial;
    display: inline-flex;
    flex-shrink: inherit;
    flex-wrap: wrap;
    align-content: center;
    justify-content: space-evenly;
    align-items: center;
    padding-top: 3px;
}

/* ||Favorite / Not-Favorite Buttons */
.performer-card button.minimal.btn.favorite-button.not-favorite.btn.btn-primary > svg.svg-inline--fa.fa-heart.fa-icon {
    color: unset;
    padding: 0;
    margin: 0;
    font-size: 22px;
    z-index: 5;
    transition: font-size 0.25 ease-in-out;
}
.performer-card button.minimal.btn.favorite-button.favorite.btn.btn-primary > svg.svg-inline--fa.fa-heart.fa-icon {
    color: unset;
    padding: 0;
    margin: 0;
    font-size: 28px;
    z-index: 5;
    transition: font-size 0.2 ease-in-out;
}
#performer-page .performer-head .name-icons button.favorite > svg.svg-inline--fa.fa-heart.fa-icon {
    color: unset;
    z-index: 5;
}
.performer-card button.btn.favorite-button.not-favorite {
    color: rgb(var(--on-split-comp-container),0.7) !important;
    filter: drop-shadow(0 0 0.2rem rgba(0,0,0,.65));
}
.performer-card button.btn.favorite-button.favorite {
    color: rgb(var(--on-split-comp-container)) !important;
    filter: drop-shadow(0 0 0.22rem rgba(0,0,0,.82));
}
#performer-page .performer-head .name-icons button.not-favorite {
    color: rgb(var(--outline));
    filter: none;
}
#performer-page .performer-head .name-icons button.favorite {
    color: rgb(var(--on-split-comp-container)) !important;
    filter: drop-shadow(0 0 0.2rem rgba(0,0,0,.45));
}
#performer-page .performer-head .name-icons button.not-favorite:hover {
    color: rgb(var(--on-split-comp-container),var(--btn-hover-rev));
    z-index: 10;
}
button:is(.favorite, .not-favorite).minimal.favorite-button.btn.btn-primary {
    padding: 0;
    width: 40px;
    min-width: 40px;
    border: 0;
    right: 5px;
    top: 5px;
    background-image: none;
    background-color: transparent;
    box-shadow: none;
    transition: box-shadow 0.35s ease-in, filter 0.25s, var(--trans-0);
}
#performer-page .performer-head .name-icons button:is(.favorite, .not-favorite).btn-primary {
    padding: 0;
    gap: unset;
    width: 36px;
    min-width: 36px;
    max-width: 36px;
    height: 36px;
    min-height: 36px;
    max-height: 36px;
    border: 0;
    background-image: none;
    background-color: transparent;
    box-shadow: none;
    transition: box-shadow 0.35s ease-in, filter 0.25s, var(--trans-0);
}
#performer-page .performer-head .name-icons button:is(.favorite, .not-favorite).btn-primary:hover,
button:is(.favorite, .not-favorite).minimal.favorite-button.btn.btn-primary:hover {
    filter: none;
    opacity: 1;
}
#performer-page .performer-head .name-icons button.favorite.btn-primary:is(:focus, :active, :active:focus),
button:is(.favorite, .not-favorite).minimal.favorite-button.btn.btn-primary:is(:focus, :active, :focus:active) {
    background-image: var(--btn-active-highlight);
    background-color: rgb(var(--split-comp-container));
    background-blend-mode: screen;
    box-shadow: var(--elevation-0);
    filter: none;
    opacity: 1;
}
#performer-page .performer-head .name-icons button.not-favorite.btn-primary:is(:focus, :active, :active:focus) {
    background-image: var(--btn-active-highlight);
    background-color: rgb(var(--split-comp-container));
    background-blend-mode: screen;
    box-shadow: var(--elevation-0);
    filter: none;
    opacity: 1;
}

/* Twitter Icon */
#performer-page .performer-head .name-icons .icon-link.btn-primary a.twitter {
    z-index: 10;
    color: rgb(var(--twitter-blue));
}
#performer-page .performer-head .name-icons button.icon-link:has(>a.twitter) {
    color: rgb(var(--twitter-blue));
    filter: drop-shadow(0 0 0.2rem rgba(0,0,0,.45));
}
#performer-page .performer-head .name-icons button.icon-link.btn-primary:has(>a.twitter) {
    width: 36px;
    min-width: 36px;
    height: 36px;
    min-height: 36px;
    max-height: 36px;
    border: 0;
    background-image: none;
    background-color: transparent;
    box-shadow: none;
    transition: box-shadow 0.35s ease-in, filter 0.25s, var(--trans-0);
}
#performer-page .performer-head .name-icons button.icon-link.btn-primary:has(>a.twitter):hover {
    filter: none;
    opacity: 1;
}
#performer-page .performer-head .name-icons button.icon-link.btn-primary:has(>a.twitter):is(:focus, :active, :active:focus) {
    background-image: var(--btn-active-highlight);
    background-color: rgb(var(--twitter-secondary)); /* Twitter Secondary Black Color */
    background-blend-mode: screen;
    box-shadow: var(--elevation-0);
    filter: none;
    opacity: 1;
}

/* Link Icon */
.detail-header .name-icons button.minimal.icon-link.btn.btn-primary > a.link:has(>svg.fa-link) {
    z-index: 10;
    color: rgb(var(--link-icon));
}
.detail-header .name-icons button.minimal.icon-link.btn.btn-primary:has(>a.link>svg.fa-link) {
    color: rgb(var(--link-icon));
    filter: drop-shadow(0 0 0.2rem rgba(0,0,0,.45));
}
.detail-header .name-icons button.minimal.icon-link.btn.btn-primary:has(>a.link>svg.fa-link) {
    width: 36px;
    min-width: 36px;
    height: 36px;
    min-height: 36px;
    max-height: 36px;
    border: 0;
    background-image: none;
    background-color: transparent;
    box-shadow: none;
    transition: box-shadow 0.35s ease-in, filter 0.25s, var(--trans-0);
}
.detail-header .name-icons button.minimal.icon-link.btn.btn-primary:has(>a.link>svg.fa-link):hover {
    filter: none;
    opacity: 1;
}
.detail-header .name-icons button.minimal.icon-link.btn.btn-primary:has(>a.link>svg.fa-link):is(:focus, :active, :active:focus) {
    background-image: var(--btn-active-highlight);
    background-color: rgb(var(--link-icon)); 
    background-blend-mode: screen;
    box-shadow: var(--elevation-0);
    filter: none;
    opacity: 1;
}

/* Page Headers Detail-Items */
.detail-item-title {
    color: rgb(var(--outline-variant-lighter));
    font-weight: 700;
    font-size: 16px;
    line-height: 24px;
    letter-spacing: 0.031em;
}


/* Dropdown #Operation-Menu Button */
.dropdown.show > button#operation-menu.minimal.dropdown-toggle.btn-secondary:is(:hover, :focus-visible) {
    background-image: var(--btn-hover-highlight);
    background-color: rgb(var(--pry-color));
    background-blend-mode: screen;
    color: rgb(var(--on-pry));
    box-shadow: var(--elevation-1);
    border-width: 0;
    outline: 0;
}
.dropdown.show > button#operation-menu.minimal.dropdown-toggle.btn-secondary:is(:focus:not(:focus-visible), :active, :active:focus) {
    background-image: var(--btn-active-highlight);
    background-color: rgb(var(--pry-color));
    background-blend-mode: screen;
    color: rgb(var(--on-pry));
    box-shadow: var(--elevation-0);
    outline: 0;
}
.dropdown.show > button#operation-menu.minimal.dropdown-toggle.btn-secondary {
    background-image: none;
    background-color: rgb(var(--pry-color));
    color: rgb(var(--on-pry));
    box-shadow: var(--elevation-0);
}

/* Minimal Button */

a:not([href="/scenes"], [href="/images"], [href="/movies"], [href="/scenes/markers"], [href="/galleries"], [href="/performers"], [href="/studios"], [href="/tags"]).minimal:not(.logout-button):where(:hover, :focus-visible),
button:not([title=Statistics], [title=Settings]).minimal:not(.nav-utility, .brand-link, .donate, .dropdown-toggle):is(:hover, :focus-visible),
.dropdown:not(.show) > button#operation-menu.minimal.dropdown-toggle.btn-secondary:is(:hover, :focus-visible) {
    background: none;
    background-image: linear-gradient(to right, rgba(var(--pry-color),var(--btn-hover)), rgba(var(--pry-color),var(--btn-hover)));
    background-color: rgb(var(--body-color2));
    background-blend-mode: normal;
    color: rgb(var(--pry-color));
    box-shadow: var(--elevation-1);
    border-width: 0;
    outline: 0;
}

.card-popovers>.organized button.minimal.btn.btn-primary:hover,
.card-popovers:has(>.organized):has(>.tag-count):has(>.performer-count) button.minimal.btn.btn-primary:not(:disabled):not(.disabled):focus {
    background: none !important;
    box-shadow: none !important;
}

a:not([href="/scenes"], [href="/images"], [href="/movies"], [href="/scenes/markers"], [href="/galleries"], [href="/performers"], [href="/studios"], [href="/tags"]).minimal:not(.logout-button):not(:disabled):not(.disabled):where(:active, :focus:not(:focus-visible), :active:focus),
button:not([title=Statistics], [title=Settings]).minimal:not(.nav-utility, .brand-link, .donate, .dropdown-toggle):not(:disabled):not(.disabled):is(:active, :focus:not(:focus-visible), :active:focus),
.dropdown:not(.show) > button#operation-menu.minimal.dropdown-toggle.btn-secondary:not(:disabled):not(.disabled):is(:active, :focus:not(:focus-visible), :active:focus) {
    color: rgb(var(--pry-color));
    box-shadow: var(--elevation-0);
    text-shadow: none;
    border-color: transparent;
    background-image: linear-gradient(to right, rgba(var(--pry-color),var(--btn-active)), rgba(var(--pry-color),var(--btn-active)));
    background-color: rgb(var(--body-color2));
    background-blend-mode: normal;
    outline: none;
}

.card-popovers:has(>.organized):has(>.tag-count):has(>.performer-count) button.minimal.btn-primary:not(:disabled):not(.disabled):is(:active, :active:focus) {
    background: none !important;
    box-shadow: none !important;
}

a.minimal:not(.logout-button):focus-visible, 
button:not([title=Statistics], [title=Settings]).minimal:not(.nav-utility, .brand-link, .donate, .dropdown-toggle):focus-visible,
.dropdown > button#operation-menu.minimal.dropdown-toggle.btn-secondary:focus-visible {
    box-shadow: none;
    outline-color: rgb(var(--focus-ring));
    outline-style: solid;
    outline-width: 0.25rem;
    outline-offset: -1px;
}

.card-popovers:has(>.organized) button.minimal.btn-primary:focus-visible {
    background: none !important;
    outline: none !important;
    box-shadow: none !important;
}

.card-popovers .fa-icon {
    margin-right: 0;
    font-size: 18px;
}

:is(.scene-card, .image-card, .tag-card, .performer-card, .gallery-card, .movie-card, .studio-card) > .card-popovers > :is(:not(.scene-card > .card-popovers > :where(.o-counter, .o-count)):not(.performer-card > .card-popovers > :where(.o-counter, .o-count)):not(.movie-card > .card-popovers > :where(.o-counter, .o-count)):not(.organized), .scene-count, .movie-count, .tag-count, .performer-count, .gallery-count, .image-count, .marker-count) > button.minimal.btn.btn-primary:is(:hover, :focus-visible) {
    background-image: none !important;
    background-color: rgba(var(--btn-min-primary),var(--btn-hover)) !important;
    box-shadow: var(--elevation-0) !important;
}
:is(.scene-card,.movie-card,.performer-card) > .card-popovers > :is(.o-counter, .o-count, .organized) > button.minimal.btn.btn-primary:is(:hover, :focus-visible) {
    background-image: none !important;
    background-color: transparent !important;
    box-shadow: none !important;
}
:is(:not(.scene-card, .image-card, .movie-card)) > .card-popovers > :not(:is(.o-counter, .o-count)):not(.organized) > button.minimal.btn.btn-primary:is(:focus:not(:focus-visible), :active, :focus:active) {
    background-image: none !important;
    background-color: rgba(var(--btn-min-primary),var(--btn-active)) !important;
    box-shadow: none !important;
}
:is(.scene-card, .image-card, .movie-card) > .card-popovers button.minimal.btn.btn-primary:is(:focus:not(:focus-visible), :active, :focus:active),
:is(.scene-card, .image-card, .tag-card, .performer-card, .gallery-card, .movie-card, .studio-card) > .card-popovers > :is(.o-counter, .o-count, .organized) > button.minimal.btn.btn-primary:is(:focus:not(:focus-visible), :active, :focus:active) {
    background-image: none !important;
    background-color: transparent !important;
    box-shadow: none !important;
}

:where(.o-count, .o-counter) > button.minimal.btn-primary > span.fa-icon > span > svg {
    color: lch(63.951% 35.172 253.332) !important;
}

a.minimal:not(.logout-button), 
button:not([title=Statistics], [title=Settings]).minimal:not(.nav-utility, .brand-link, .donate, .dropdown-toggle), 
.dropdown > button#operation-menu.minimal.dropdown-toggle.btn-secondary {
     color: rgb(var(--pry-color));
     background-image: none;
     background-color: transparent;
     gap: 8px;
     display: flex;
     justify-content: center;
     align-items: center;
     border-radius: 5rem;
     border-width: 0;
     padding: 0 12px 0 12px;
     height: 40px;
     max-height: 40px;
     width: auto;
     contain: content;
     overflow: hidden;
     box-shadow: none;
     outline: 0;
     transition: var(--trans-0);
     -webkit-transition: var(--trans-0);
}

.card-popovers button.minimal.btn.btn-primary {
    color: rgb(var(--btn-min-primary)) !important;
}

.card-popovers>.organized button.minimal.btn.btn-primary {
    color: lch(68.921% 45.12 186.214) !important;
    background-image: none;
    background-color: transparent;
    border: 0;
    box-shadow: none;
}

/* Lightbox */
.Lightbox-footer .o-counter > button[title="O-Counter"].minimal.btn.btn-secondary,
.Lightbox-footer .o-counter > button[title="O-Counter"].minimal.btn.btn-secondary:active,
.Lightbox-footer .o-counter > button[title="O-Counter"].minimal.btn.btn-secondary:active:hover,
.Lightbox-footer .o-counter > button[title="O-Counter"].minimal.btn.btn-secondary:active:focus,
.Lightbox-footer .o-counter > button[title="O-Counter"].minimal.btn.btn-secondary:active:hover:focus {
    color: white;
    opacity: 0.9;
}
.Lightbox-footer .o-counter > button[title="O-Counter"].minimal.btn.btn-secondary:hover,
.Lightbox-footer .o-counter > button[title="O-Counter"].minimal.btn.btn-secondary:focus,
.Lightbox-footer .o-counter > button[title="O-Counter"].minimal.btn.btn-secondary:hover:focus {
    color: white;
    opacity: 1;
}
.Lightbox-footer .o-counter > button[title="O-Counter"].minimal.btn.btn-secondary:not(:focus):focus-visible {
    color: white;
    opacity: 1;
    outline-color: rgb(var(--focus-ring));
    outline-style: solid;
    outline-width: 0.24rem;
    outline-offset: -0.06rem;
}

/* Exclude Button */
.selectable-filter ul :is(.selected-object, .excluded-object, .unselected-object) button.minimal.exclude-button.btn.btn-primary {
    background-color: transparent;
    box-shadow: none;
    border-style: none;
    padding: 0 12px;
    height: 32px;
    min-height: 32px;
    max-height: 32px;
    contain: content;
    overflow: hidden;
    border-radius: 0;
    transition: background-color 0.55s ease, color 0.2s ease-in-out;
}
.selectable-filter ul :is(.selected-object, .excluded-object, .unselected-object) button.minimal.exclude-button.btn.btn-primary:hover {
    background-color: rgba(0,0,0,0.06);
}
.selectable-filter ul :is(.selected-object, .excluded-object, .unselected-object) button.minimal.exclude-button.btn.btn-primary:is(:active, :focus, :active:focus) {
    background-color: rgba(0,0,0,0.11);
}

.selectable-filter ul :is(.selected-object, .excluded-object, .unselected-object) .exclude-icon {
    color: rgb(var(--error));
}
.selectable-filter ul :is(.selected-object, .excluded-object, .unselected-object) .exclude-button .exclude-button-text {
    color: rgb(var(--error));
}

.selectable-filter ul :is(.selected-object, .excluded-object, .unselected-object) .include-button {
    color: rgb(var(--green));
}

.tag-item .btn, 
.tag-item .btn:active,
.tag-item .btn:active:hover, 
.tag-item .btn:hover,
.tag-item .btn:hover:focus, 
.tag-item .btn:focus {
    box-shadow: none;
    background-color: transparent;
    outline: none;
}
.tag-item .btn:focus {
    outline-color: #002e29;
    outline-style: dashed;
    outline-width: 1px;
    outline-offset: -5px;
}

/* || Settings Pages left Menu */
#settings-menu-container {
    margin-right: 12px;
    padding: 0px;
    max-width: 10%;
}

/* Setting-Section / Interface / Editing ... "Disable dropdown create" */
.setting-section:nth-last-of-type(5) h3:has(+.sub-heading):has(:not(>a[type="/help/Tasks.md"])):has(:not(*button#optimiseDatabase)) {
    margin-top: 1rem !important;
}
/* Setting-Section / Interface "Show AB loop plugin control" */
.setting#max-loop-duration + .setting > div > h3 {
    margin-bottom: 1rem;
}

.stash-row.align-items-center.row .dropdown>button.minimal.dropdown-toggle.btn.btn-minimal {
    padding: 0;
    width: 40px;
    height: 40px;
    max-height: 40px;
    font-size: 20px;
    border-radius: 5rem;
    color: rgb(var(--on-surface-variant));
}
.stash-row.align-items-center.row .dropdown>button.minimal.dropdown-toggle.btn.btn-minimal:hover {
    background-color: rgb(var(--on-surface-variant),var(--btn-hover));
    box-shadow: var(--elevation-0);
}
.stash-row.align-items-center.row .dropdown>button.minimal.dropdown-toggle.btn.btn-minimal:is(:active, :focus, :active:focus) {
    background-color: rgb(var(--on-surface-variant),var(--btn-active));
    outline: 0;
    box-shadow: none;
}

#stash-table .d-none.d-md-flex.row {
    border-bottom: 1px solid rgb(var(--card-fold));
    margin-bottom: 12px;
}

.nav-pills .nav-link {
    color: rgb(var(--on-surface));
    text-shadow: var(--light-txt-shadow);
    background-color: transparent;
    border: 0;
    border-radius: 0 5rem 5rem 0;
    font-weight: 500;
    font-size: 16px;
    line-height: 24px;
    letter-spacing: 0.5px;
    padding-inline-start: 24px;
    padding-block-start: 10px;
    padding-block-end: 10px;
    outline: none;
    box-shadow: none;
    text-decoration: none;
    text-decoration-color: transparent;
    vertical-align: middle;
    margin-left: -16px;
    min-height: 40px;
    transition: var(--trans-0), text-decoration-color 0.2s ease-in, text-indent 0.15s ease-in-out;
}
.nav-pills .nav-link:hover,  
.nav-pills .nav-link:focus {
    color: rgb(var(--on-surface));
    text-shadow: none;
    background-image: var(--btn-hover-highlight);
    background-color: rgb(var(--body-color2));
    background-blend-mode: screen;
}
.nav-pills .nav-link:focus-visible,
.nav-pills .nav-link.active:focus-visible {
    color: rgb(var(--focus-ring));
    font-weight: 700;
    text-decoration: underline;
    text-decoration-color: currentColor;
    text-decoration-thickness: 16%;
    text-underline-offset: 0.25em;
    text-underline-position: from-font;
    text-indent: 8px;
    outline: 0;
}
.nav-pills .nav-link.active:focus-visible {
    text-indent: unset;
}
.nav-pills .nav-link.active,
.nav-pills .nav-link.active:is(:focus, :hover, :focus:hover) {
    background-image: none;
    background-color: rgb(var(--pry-color));
    color: rgb(var(--on-pry));
    text-shadow: none;
    box-shadow: var(--elevation-0);
}
/* --- */

.manual-container.container .nav-pills .nav-link {
    margin-left: -13px;
    padding-left: 10px;
}

/* Tabs on Pages */
nav.nav.nav-tabs {
    background-color: rgba(0,0,0,0.50);
    padding: 0 0;
}
.nav-tabs {
    /*margin-left: 0.2rem;*/
    justify-content: space-evenly;
    padding-bottom: 16px;
    margin-bottom: 0;
}
.nav.nav-tabs:has(> .nav-item:nth-of-type(2) > a.active) {
    border-bottom: 1px solid rgb(255,255,255,0.13);
}
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter)),
.nav.nav-tabs>.nav-item.nav-link {
    background-color: rgba(var(--surface));
    min-height: 48px;
    height: 48px;
    max-height: 48px;
    border-bottom: 1px solid rgb(var(--surface-variant));
    padding-bottom: 1px;
    overflow: hidden;
    contain: content;
}
/*.nav-tabs>.nav-item:first-child {
    padding-left: 6px;
}
.nav-tabs>.nav-item:nth-child(6) {
    padding-right: 6px;
}*/

.nav-tabs .nav-item.nav-link,
.nav-tabs .nav-link {
    background-color: transparent;
    border: 0;
    border-color: transparent;
    border-style: solid;
    border-bottom: 1px solid rgb(var(--surface-variant));
    padding-bottom: 10px;
    border-radius: 0;
    color: rgb(var(--on-surface-variant));
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 0.1px;
    text-decoration: none;
    outline-color: rgb(var(--focus-ring));
    box-shadow: var(--elevation-0);
    transition: background-color .55s ease, border-color .4s ease-in-out, color .25s ease-in-out, outline .4s ease-in;
}
.nav.nav-tabs>.nav-item.nav-link {
    display: flex;
    flex: 1 1 calc((1/7)*90%);
    justify-content: space-evenly;
    align-items: center;
    padding: 0;
    margin: 0;
    height: 40px; /*added jun 12 for firefox*/
}
.gallery-container .mr-auto.nav.nav-tabs .nav-item {
    display: flex;
    flex: 1 1 calc((1/2)*90%);
    max-width: 90%;
    justify-content: space-evenly;
    /* justify-items: center; */
    /*align-content: initial;*/
    align-items: center;
    flex-wrap: wrap;
    padding: 0;
    margin: 0;
}
.image-tabs .mr-auto.nav.nav-tabs>.nav-item:has(>*:not(.btn-group):not(.organized-button):not(.dropdown)) {
    display: flex;
    flex: 1 1 calc((1/3)*90%);
    max-width: 90%;
    justify-content: space-evenly;
    align-items: center;
    flex-wrap: wrap;
    padding: 0;
    margin: 0;
}
.scene-tabs .mr-auto.nav.nav-tabs>.nav-item:has(>*:not(.btn-group)) {
    display: flex;
    flex: 1 1 calc((1/6)*90%);
    max-width: 90%;
    justify-content: space-evenly;
    align-items: center;
    flex-wrap: wrap;
    padding: 0;
    margin: 0;
}
.gallery-tabs>div>.mr-auto.nav.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown)) {
    display: flex;
    flex: 1 1 calc((1/4)*90%);
    max-width: 90%;
    justify-content: space-evenly;
    align-items: center;
    flex-wrap: wrap;
    padding: 0;
    margin: 0;
}
.image-tabs .mr-auto.nav.nav-tabs>.nav-item>.nav-link,
.scene-tabs .mr-auto.nav.nav-tabs>.nav-item>.nav-link,
.gallery-tabs>div>.mr-auto.nav.nav-tabs>.nav-item>.nav-link,
.gallery-container .mr-auto.nav.nav-tabs .nav-item .nav-link {
    display: flex;
    flex: 1 1 100%;
    max-width: 100%;
    justify-content: space-evenly;
    align-items: center;
    min-height: 48px;
    height: 48px;
    max-height: 48px;
}
.scene-tabs .mr-auto.nav.nav-tabs>.ml-auto.btn-group {
    display: flex;
    flex: 1 1 60%;
    max-width: 60%;
    justify-content: flex-end;
    align-items: center;
    padding-top: 12px;
}
.image-tabs .mr-auto.nav.nav-tabs>.nav-item:has(>*:not(.nav-link)),
.gallery-tabs>div>.mr-auto.nav.nav-tabs>.nav-item:has(>*:not(.nav-link)) {
    display: flex;
    flex: 1 1 15%;
    max-width: 15%;
    justify-content: flex-end;
    align-items: center;
    padding-top: 6px;
}
.scene-tabs .mr-auto.nav.nav-tabs>.ml-auto.btn-group>.nav-item {
    display: flex;
    flex: 1 1 60%;
    max-width: 60%;
    justify-content: space-evenly;
}

.nav-item > .dropdown > button[title="Operations"]#operation-menu.minimal.dropdown-toggle.btn.btn-secondary,
.nav-item > button[title="Organized"].minimal.organized-button.not-organized.btn.btn-secondary,
.nav-item > button[title="Organized"].minimal.organized-button.organized.btn.btn-secondary {
    min-width: 40px;
    border-radius: 50%;
}
.nav-item > .dropdown > button[title="Operations"]#operation-menu.minimal.dropdown-toggle.btn.btn-secondary > svg {
    font-size: 24px;
}

.nav-item > button[title="Organized"].minimal.organized-button.not-organized.btn.btn-secondary:is(:only-of-type, :hover, :focus) {
    color: rgb(var(--pry-color)) !important;
}
.nav-item > button[title="Organized"].minimal.organized-button.not-organized.btn.btn-secondary:is(:hover, :focus) {
    color: rgb(var(--pry-color)) !important;
    background-image: linear-gradient(to right, rgba(var(--pry-color),var(--btn-hover)), rgba(var(--pry-color),var(--btn-hover))),linear-gradient(to right, rgb(var(--body-color2)), rgb(var(--body-color2))) !important;
}
.nav-item > button[title="Organized"].minimal.organized-button.organized.btn.btn-secondary:is(:only-of-type, :hover, :focus) {
    color: lch(63.921% 32.12 186.214) !important;
    background-color: transparent;
}
.nav-item > button[title="Organized"].minimal.organized-button.organized.btn.btn-secondary:is(:hover, :focus) {
    color: lch(63.921% 32.12 186.214) !important;
    background-color: rgb(var(--body-color2));
    background-image: linear-gradient(to right, lch(63.921% 32.12 186.214 / var(--btn-hover)), lch(63.921% 32.12 186.214 / var(--btn-hover))),linear-gradient(to right, rgb(var(--body-color2)), rgb(var(--body-color2))) !important;
}

.o-counter.btn-group > button[title="O-Counter"].minimal.btn.btn-secondary > span > svg,
.nav-item > button[title="Organized"].minimal.organized-button.not-organized.btn.btn-secondary > svg,
.nav-item > button[title="Organized"].minimal.organized-button.organized.btn.btn-secondary > svg {
    font-size: 20px;
}
.o-counter.btn-group > button[title="O-Counter"].minimal.btn.btn-secondary {
    min-width: 40px;
    padding-left: 16px;
    padding-right: 16px !important;
}
.o-counter.btn-group > button[title="O-Counter"].minimal.btn.btn-secondary > span.ml-2 {
    text-align: center;
    margin: 0 !important;
}


/* Nav-Tabs */
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter)):hover,
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter)):focus-visible,
.nav-tabs .nav-item.nav-link:hover,  
.nav-tabs .nav-item.nav-link:focus-visible {
    border: 0;
    border-style: none;
    border-color: transparent;
    border-bottom: 1px solid rgb(var(--outline));
}
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter)):focus,
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter)):hover:focus,
.nav-tabs .nav-item.nav-link:focus,
.nav-tabs .nav-item.nav-link:hover:focus {
    border: 0;
    border-style: none;
    border-color: transparent;
    border-bottom: 1px solid rgb(var(--on-surface-variant));
}
/*}
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter)).active:hover,
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter)):active:hover,
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter)).active:focus:hover,
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter)):active:focus:hover,
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter)).active:focus-visible,
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter)):active:focus-visible,
.nav-tabs .nav-item.nav-link.active:hover, 
.nav-tabs .nav-item.nav-link:active:hover,
.nav-tabs .nav-item.nav-link.active:focus:hover,
.nav-tabs .nav-item.nav-link:active:focus:hover,
.nav-tabs .nav-item.nav-link.active:focus-visible,
.nav-tabs .nav-item.nav-link:active:focus-visible {
    border-bottom: 2px solid transparent;
    color: rgb(var(--pry-color));
}
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter)).active,
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter)):active,
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter)).active:focus,
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter)):active:focus,
.nav-tabs .nav-item.nav-link.active, 
.nav-tabs .nav-item.nav-link:active,
.nav-tabs .nav-item.nav-link.active:focus,
.nav-tabs .nav-item.nav-link:active:focus {
    color: rgb(var(--pry-color));
    border-bottom: 2px solid transparent;
}*/
.nav-tabs .nav-link:hover,
.nav-tabs .nav-link:focus, 
.nav-tabs .nav-link:hover:focus, 
.nav-tabs .nav-link:focus-visible {
    color: rgb(var(--on-surface));
    background-color: rgb(var(--surface));
    background-image: linear-gradient(to right, rgba(var(--on-surface),var(--btn-hover)), rgba(var(--on-surface),var(--btn-hover))),linear-gradient(to right, rgb(var(--surface)), rgb(var(--surface)));
    border: 0;
    border-style: none;
    border-color: transparent;
    border-bottom: 1px solid rgb(var(--outline));
    outline-color: rgb(var(--focus-ring));
    padding-bottom: 10px;
}
.nav-tabs .nav-link:focus, 
.nav-tabs .nav-link:hover:focus {
    background-image: linear-gradient(to right, rgba(var(--on-surface),var(--btn-active)), rgba(var(--on-surface),var(--btn-active))),linear-gradient(to right, rgb(var(--surface)), rgb(var(--surface)));
    border-bottom: 1px solid rgb(var(--on-surface-variant));
} 
.nav-tabs .nav-link:hover:focus {
    background-image: linear-gradient(to right, rgba(var(--pry-color),var(--btn-active)), rgba(var(--pry-color),var(--btn-active))),linear-gradient(to right, rgb(var(--surface)), rgb(var(--surface)));
}

.nav-tabs .nav-link.active, 
.nav-tabs .nav-link:active,
.nav-tabs .nav-link.active:focus,
.nav-tabs .nav-link:active:focus {
    color: rgb(var(--pry-color));
    background-color: rgba(var(--surface));
    border: 0;
    border-style: none;
    border-color: transparent;
    border-bottom: 3px solid rgb(var(--pry-color));
    outline-color: rgb(var(--focus-ring));
    min-height: 48px;
    height: 48px;
    max-height: 48px;
    padding-bottom: 8px;
}
.nav-tabs .nav-link.active:focus,
.nav-tabs .nav-link:active:focus {
    background-image: linear-gradient(to right, rgba(var(--pry-color),var(--btn-active)), rgba(var(--pry-color),var(--btn-active))),linear-gradient(to right, rgb(var(--surface)), rgb(var(--surface)));
}

.nav.nav-tabs>.nav-item.nav-link.active,
.nav.nav-tabs>.nav-item.nav-link:active,
.nav.nav-tabs>.nav-item.nav-link.active:focus,
.nav.nav-tabs>.nav-item.nav-link:active:focus {
    padding-bottom: 0;
}
.nav-tabs .nav-link.active:hover, 
.nav-tabs .nav-link:active:hover,
.nav-tabs .nav-link.active:focus:hover,
.nav-tabs .nav-link:active:focus:hover,
.nav-tabs .nav-link.active:focus-visible,
.nav-tabs .nav-link:active:focus-visible {
    background-image: linear-gradient(to right, rgba(var(--pry-color),var(--btn-hover)), rgba(var(--pry-color),var(--btn-hover))),linear-gradient(to right, rgb(var(--surface)), rgb(var(--surface)));
    color: rgb(var(--pry-color));
    border-bottom: 3px solid rgb(var(--pry-color));
    outline-color: rgb(var(--focus-ring));
    padding-bottom: 8px;
}


.nav-tabs .nav-link:focus-visible {
    box-shadow: none;
    padding-bottom: 10px; /*this evens the height with the border width */
    outline-style: solid;
    outline-offset: -8px;
    outline-width: 0.25rem;
}
.nav-tabs .nav-link.active:focus-visible,
.nav-tabs .nav-link:active:focus-visible {
    outline-style: solid;
    outline-offset: -8px;
    outline-width: 0.25rem;
}

/*** Main Top Navigation Bar Links/Buttons ***/

/* Increase SVG icon size in nav-bar */
.svg-inline--fa.fa-icon.nav-menu-icon.d-block.mb-2 {
    height: 24px;
    margin-top: 4px !important;
    margin-bottom: 4px !important;
    /*height: 1.15em;
    margin-top: 0.1rem !important;
    margin-bottom: -0.1rem !important; tabs*/
}
.fa-icon {
    /*margin: 0 0.6rem 0 0.3; gives extra space between icon and text */
    margin: 0 auto 0 auto;
}
@media (min-width: 1200px) {
    .p-xl-2 {
        padding: 0.5rem 1.3rem 0.5rem 1.3rem !important;
    }
}
@media (min-width: 1200px) {
    .mb-xl-0, .my-xl-0 {
        margin-bottom: 0.03rem !important;
    }
}
@media (min-width: 1200px) {
    .d-xl-inline-block {
        display: inline-flex !important;
    }
}
.top-nav .navbar-buttons {
    margin: auto -4px;

}
.navbar-dark .navbar-nav .nav-link {
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: calc((1/8)*100%);
    justify-content: space-evenly;
    display: flex;
}
@media (max-width: 576px) {
    .navbar-dark .navbar-nav .nav-link {
        flex-grow: 0;
        flex-shrink: 0;
        flex-basis: calc((1/3)*100%);
        display: flex;
        justify-content: flex-start;
    }
}
@media (max-width: 576px) {
    .navbar-dark .navbar-nav:not(:nth-of-type(2)):nth-of-type(1) .nav-link:not(*.donate) {
        flex-grow: 0;
        flex-shrink: 1;
        flex-basis: 100%;
        display: flex;
        justify-items: flex-start;
        left: 0;
        position: relative;
        min-width: 336px;
        width: 336px;
        justify-content: space-between;
        align-content: space-around;
        flex-flow: column wrap;
        align-items: flex-start;
    }
}

.top-nav .navbar-collapse .navbar-nav {
    flex-direction: column;
    width: 80px;
    align-items: center;
}
@media (max-width: 576px) {
    .top-nav .navbar-collapse .navbar-nav:not(:nth-of-type(2)):nth-of-type(1) {
        display: flex;
        position: relative;
        left: 0%;
        top: 0;align-items: stretch;
        justify-content: space-around;
        align-content: space-around;
        width: 100%;
        min-width: 342px;
        flex-wrap: wrap;
        flex-direction: row;
        margin-left: 16px;
    /* padding-left: 16px; */
        margin-right: 12px;
    }
}
@media (min-width: 1200px) {
    .navbar-expand-xl .navbar-nav .nav-link {
        padding-left: 0;
        padding-right: 0;
    }
}

@media (max-width: 576px) {
    a.nav-utility button.btn-primary {
        padding-left: 12px;
        padding-right: 12px;
        width: auto;
        border-radius: 0;
        background-color: transparent;
    }
}

/* Hide second navbar-nav bar from showing*/
nav.top-nav.navbar .navbar-collapse.collapse:not(.show) > .navbar-nav:last-child,
nav.top-nav.navbar .navbar-collapse.collapse.show > .navbar-nav:last-child {
    display: none;
}
@media (max-width: 576px) {
    nav.top-nav.navbar .navbar-collapse.collapse.show > .navbar-nav:last-child {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        flex-direction: row;
    }
}

/* For short underline of active button */
/*.col-4.col-sm-3.col-md-2.col-lg-auto.nav-link.active::before,
.col-4.col-sm-3.col-md-2.col-lg-auto.nav-link.active:hover::before,
.col-4.col-sm-3.col-md-2.col-lg-auto.nav-link.active:focus::before,
.col-4.col-sm-3.col-md-2.col-lg-auto.nav-link.active:hover:focus::before*/
.navbar-dark .navbar-nav .nav-link.active a.btn-primary.active::before {
    content: " ";
    /*display: block;
    margin-left: calc((7/8)* 35%);
    margin-right: calc((7/8)* 35%); tabs*/
    border-bottom-width: 0;
    border-bottom-style: solid;
    border-radius: 5rem;
    /*border-bottom-width: 3px;
    border-bottom-style: solid;
    border-bottom-color: rgb(var(--tab-active-color)); tabs*/
    min-width: 64px;
    width: 64px;
    max-height: 32px;
    min-height: 32px;
    height: 32px;
    background-color: rgba(var(--tab-active-color),var(--btn-hover));
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin-top: 12px;
    margin-bottom: 4px;
    margin-left: auto;
    margin-right: auto;
    transition: background-color 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
/*.col-4.col-sm-3.col-md-2.col-lg-auto.nav-link.active:hover::before*/
.navbar-dark .navbar-nav .nav-link.active a.btn-primary.active:hover::before {
    background-color: rgba(var(--on-surface),var(--btn-active));
}

.navbar-dark .navbar-nav .nav-link a.btn.btn-primary span,
.navbar-dark .navbar-nav .nav-link a.btn.btn-primary:hover span,
.navbar-dark .navbar-nav .nav-link a.btn.btn-primary span:focus-visible {
    /*letter-spacing: 0.335px; tabs*/
    font-weight: 500;
    padding-left: 2px;
    padding-right: 2px;
}
.navbar-dark .navbar-nav .nav-link.active a.btn-primary.active span, 
.navbar-dark .navbar-nav .nav-link.active a.btn-primary.active:hover span, 
.navbar-dark .navbar-nav .nav-link.active a.btn-primary.active:focus-visible span,
.navbar-dark .navbar-nav .nav-link.active a.btn-primary:active:hover span, 
.navbar-dark .navbar-nav .nav-link.active a.btn-primary:active span,
.navbar-dark .navbar-nav .nav-link.active a.btn-primary:active:focus-visible span {
    letter-spacing: 0.5px;
    font-weight: 700;
}

/*.col-4.col-sm-3.col-md-2.col-lg-auto.nav-link::before,
.col-4.col-sm-3.col-md-2.col-lg-auto.nav-link:hover::before,
.col-4.col-sm-3.col-md-2.col-lg-auto.nav-link:focus::before,
.col-4.col-sm-3.col-md-2.col-lg-auto.nav-link:hover:focus::before*/
.navbar-dark .navbar-nav .nav-link a.btn-primary::before {
    content: " ";
    border-radius: 5rem;
    width: 32px;
    max-height: 32px;
    min-height: 32px;
    height: 32px;
    background-color: transparent;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin-top: 12px;
    margin-bottom: 4px;
    margin-left: auto;
    margin-right: auto;
    transition: width 0.25s cubic-bezier(0.45, 0.05, 0.55, 0.95) 0.15s;
}
@media (max-width: 575.98px) {
    .navbar-dark .navbar-nav .nav-link a.btn-primary::before {
        content: " ";
        border-radius: 16px 24px 24px 16px;
        width: 336px;
        min-width: 336px;
        min-height: 56px;
        height: 56px;
        background-color: transparent;
        position: absolute;
        top: 0px;
        left: 0px;
        right: 0;
        bottom: 0;
        margin-top: 0;
        margin-bottom: 0;
        margin-left: 12px;
        margin-right: 12px;
        transition: width 0.25s cubic-bezier(0.45, 0.05, 0.55, 0.95) 0.15s;
    }
}
/*.col-4.col-sm-3.col-md-2.col-lg-auto.nav-link:hover::before,
.col-4.col-sm-3.col-md-2.col-lg-auto.nav-link:hover:focus::before*/
.navbar-dark .navbar-nav .nav-link a.btn-primary:hover::before {
    background-color: rgba(var(--on-surface),var(--btn-hover));
    width: 64px;
}
/*.col-4.col-sm-3.col-md-2.col-lg-auto.nav-link:focus::before*/
.navbar-dark .navbar-nav .nav-link a.btn-primary:focus::before {
    background-color: rgba(var(--on-surface),var(--btn-active));
    width: 64px;
}

.navbar-dark .navbar-nav .nav-link.active a.btn-primary:hover,
.navbar-dark .navbar-nav .nav-link.active a.btn-primary:focus,
.navbar-dark .navbar-nav .nav-link.active a.btn-primary:hover:focus, 
.navbar-dark .navbar-nav .show>.nav-link .btn-primary:hover,
.navbar-dark .navbar-nav .show>.nav-link .btn-primary:hover:focus,
.navbar-dark .navbar-nav .nav-link a.btn-primary:hover,
.navbar-dark .navbar-nav .nav-link a.btn-primary:focus,
.navbar-dark .navbar-nav .nav-link a.btn-primary:hover:focus {
     color: rgb(var(--on-surface));
     background-color: transparent;
     border-style: solid;
     border-width: 0;
     border-color: transparent;
     border-radius: 0.05rem;
     box-shadow: none;
     text-shadow: none;
}
.navbar-dark .navbar-nav .nav-link.active a.btn-primary.active,
/*.navbar-dark .navbar-nav .nav-link a.btn-primary:not(:disabled):not(.disabled):active,
.navbar-dark .navbar-nav .nav-link.active.focus a.btn-primary:not(:disabled):not(.disabled),
.navbar-dark .navbar-nav .nav-link.active a.btn-primary:not(:disabled):not(.disabled):focus,*/
.navbar-dark .navbar-nav .nav-link.active a.btn-primary.active:focus,
.navbar-nav .nav-link.active>.btn.btn-primary.active,
/*.navbar-nav .nav-link>.btn.btn-primary:not(:disabled):not(.disabled):active,
.navbar-nav .nav-link.active>.btn.btn-primary:not(:disabled):not(.disabled):focus,*/
.navbar-nav .nav-link.active>.btn.btn-primary.active:focus {
     background-color: transparent;
     border-color: transparent;
     border-style: solid;
     border-width: 0;
     border-radius: 0.05rem;
     color: rgb(var(--tab-active-color));
     text-shadow: none;
     filter: none;
     box-shadow: none;
}
.navbar-dark .navbar-nav .nav-link.active:hover,
.navbar-dark .navbar-nav .nav-link.active:focus,
.navbar-dark .navbar-nav .nav-link.active:focus:hover {
    color: rgb(var(--tab-active-color));
    background-color: transparent;
    filter: none;
    box-shadow: none;
    text-shadow: none;
    outline: none;
}
.navbar-dark .navbar-nav .nav-link a.btn-primary {
     color: rgb(var(--on-surface-variant));
     background: none;
     border-style: solid;
     border-width: 0;
     border-color: transparent;
     border-radius: 0.05rem;
     height: 80px;
     min-height: 80px;
     max-height: 80px;
     min-width: 64px;
     /*max-height: 64px;
     height: 64px;
     min-height: 64px; tabs*/
     /*font-size: 14px; tabs*/
     font-size: 12px;
     font-weight: 500;
     line-height: 16px;
     letter-spacing: 0.5px;
     row-gap: 4px;
     column-gap: 8px;
     /*line-height: 20px;
     letter-spacing: 0.10000000149011612px; tabs*/
     font-family: 'Roboto Flex', Roboto, 'Open Sans', Verdana, Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif, ui-sans-serif, system-ui, serif, ui-serif;
     filter: none;
     box-shadow: none;
     text-shadow: none;
     transition: background-color .55s ease, border-color .2s ease-in-out, color .25s ease-in-out, outline .15s ease;
}
@media (max-width: 575.98px) {
    .navbar-dark .navbar-nav .nav-link a.btn-primary {
        color: rgb(var(--on-surface-variant));
        background: none;
        border-style: none;
        border-width: 0;
        border-color: transparent;
        /* border-radius: 0.05rem; */
        height: 56px;
        min-height: 56px;
        /* max-height: 56px; */
        max-width: 100%;
        /* min-width: 336px; */
        width: 100%;
        /* font-size: 14px; */
        font-weight: 500;
        /* line-height: 16px; */
        /* letter-spacing: 0.5px; */
        /* row-gap: 12px; */
        /* column-gap: 12px; */
        font-family: 'Roboto Flex', Roboto, 'Open Sans', Verdana, Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif, ui-sans-serif, system-ui, serif, ui-serif;
        /* filter: none; */
        display: flex!important;
        box-shadow: none;
        position: relative;
        left: -50%;
        right: 0%;
        bottom: 0;
        top: 0;
        flex-direction: column;
        flex-flow: column wrap !important;
        align-items: flex-start !important;
        justify-content: center !important;
        padding: 0 !important;
        margin: 12px 0px auto 16px !important;
        text-shadow: none;
        transition: background-color .55s ease, border-color .2s ease-in-out, color .25s ease-in-out, outline .15s ease;
        align-content: flex-start;
    }
}
/* Padding for NavBar Tabs */
.p-4 {
    padding: 12px 0 16px 0 !important;
    /*padding: 0.75rem !important; tabs*/
    margin-bottom: 0 !important;
    /*margin-bottom: -3px!important; tabs*/
}
.navbar-dark .navbar-nav .nav-link:not(.active) a.btn-primary:focus-visible,
.top-nav .navbar-collapse .navbar-nav .nav-link:not(.active):focus-visible {
    color: rgb(var(--tertiary));
    outline-color: rgb(var(--focus-ring));
    border-radius: 4px;
    outline-offset: 3px;
    outline-style: solid;
    outline-width: 0.25rem;
    box-shadow: none;
    text-underline-offset: 0.15em;
    text-decoration-thickness: from-font;
    text-shadow: var(--light-txt-shadow);
}
.navbar-dark .navbar-nav .nav-link.active a.btn-primary:focus-visible,
.top-nav .navbar-collapse .navbar-nav .nav-link.active:focus-visible {
    border-radius: 4px;
    outline-color: rgb(var(--tertiary));
    outline-offset: 3px;
    outline-style: solid;
    outline-width: 0.25rem;
    text-underline-offset: 0.15em;
    text-decoration-thickness: from-font;
    box-shadow: none;
    text-shadow: var(--light-txt-shadow);
}
nav.top-nav.navbar .navbar-collapse.collapse:not(.show)>.navbar-nav {
    width: 100%;
}
nav.top-nav.navbar .navbar-collapse.collapse.show>.navbar-nav {
    padding-bottom: 0;
}
.top-nav .navbar-collapse.show {
    /*transform: translate(-100%);
    transition: transform 0.35s;*/
    will-change: transform;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    max-height: unset;
    /* width: calc(100vw / 84 - 10vh * 88); */
    max-width: 88px;
    /* height: calc(100vw - 10vh - 88px); */
    position: fixed;
    /* z-index: 102500; */
    /* margin: auto; */
    padding: 0 2px 0 2px;
    margin-left: -2px;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}
@media (max-width: 576px) {
    .top-nav .navbar-collapse.show {
        will-change: transform, transition, margin, bottom;
        display: flex;
        overflow-y: auto;
        transform: translate(0%, 0%);
        overflow-x: scroll;
        max-height: 100%;
        max-width: 360px;
        width: 100%;
        position: fixed;
        margin: 0 auto 0 0;
        padding: 0 2px 0 2px;
        top: 0;
        left: 0;
        /* right: 0; */
        /* bottom: 0; */
        /* justify-self: flex-start; */
        transition: transform 0s linear 0s, margin 0s linear 0s, bottom 0s linear 0s;
        justify-content: flex-start;
        align-items: stretch;
        flex-direction: row;
        flex-wrap: wrap;
        align-content: flex-start;
    }
}
/* Collapsable Navbar Margin so buttons dont overlap */
nav.top-nav.navbar .navbar-collapse.collapse.show .navbar-nav .nav-link a.minimal.p-4.btn.btn-primary {
    margin: 0;
    /*transition: margin 0s;*/
}
.top-nav .navbar-collapse .navbar-nav .nav-link:hover,
.top-nav .navbar-collapse .navbar-nav .nav-link:focus,
.top-nav .navbar-collapse .navbar-nav .nav-link:hover:focus {
    color: #00dfc6;
    outline: none;
    filter: none;
    text-shadow: none;
    box-shadow: none;
}

/* NavBar Toggle Menu */
.navbar-dark .navbar-toggler:not(.collapsed), 
.navbar-dark:not(:has(>.show)) .navbar-toggler.collapsed {
    left: 0;
    position: absolute;
    padding: 0;
    margin-left: 4px !important;
    display: grid;
    place-items: center;
    transition: place-items 0.2s ease;
    will-change: transition;
}
.navbar-dark:has(>.show) .navbar-toggler:not(.collapsed), 
.navbar-dark:has(>.show) .navbar-toggler.collapsed {
    transition: place-items 0.2s ease;
    will-change: transition;
}
.navbar-dark .navbar-toggler {
    color: rgb(var(--btn-toggler-color));
    border-color: transparent !important;
    border-radius: 50%;
    outline: none;
    box-shadow: none;
    text-shadow: none;
}
.navbar-dark .navbar-toggler.collapsed {
    color: rgb(var(--btn-toggler-color));
}
.navbar-dark .navbar-toggler:not(.collapsed) {
    color: rgb(var(--pry-color));
}
.navbar-dark .navbar-toggler.collapsed:hover:focus,
.navbar-dark .navbar-toggler.collapsed:hover,
.navbar-dark .navbar-toggler.collapsed:focus-visible {
    color: rgba(var(--btn-toggler-color));
    outline: none;
    box-shadow: none;
    text-shadow: none;
}
.navbar-dark .navbar-toggler.collapsed:focus-visible,
.navbar-dark .navbar-toggler:not(.collapsed):focus-visible {
    border-radius: 50%;
    background-color: rgba(var(--pry-color),var(--btn-hover));
    background: radial-gradient(circle at center, rgba(var(--pry-color),var(--btn-hover)) 0%, rgba(var(--pry-color),var(--btn-hover)) 100%);
    outline-color: rgb(var(--focus-ring));
    outline-offset: -1px;
    outline-style: solid;
    outline-width: 0.25rem;
    box-shadow: none;
}
.navbar-dark .navbar-toggler:not(.collapsed):hover,
.navbar-dark .navbar-toggler:not(.collapsed):hover:focus {
    color: rgb(var(--pry-color));
    outline: none;
    box-shadow: none;
    text-shadow: none;
}
/*.navbar-dark .navbar-toggler:not(.collapsed):hover,
.navbar-dark .navbar-toggler:not(.collapsed):hover:focus {
    color: rgb(var(--pry-color));
    background-color: rgba(var(--pry-color),var(--btn-hover));
    border-radius: 50%;
    outline: none;
    box-shadow: none;
    text-shadow: none;
    transform: scale(2.1);
    transition: transform 0.5s ease, background-color .35s ease;
}*/
.navbar-dark .navbar-toggler.collapsed:active,
.navbar-dark .navbar-toggler.collapsed:active:hover,
.navbar-dark .navbar-toggler.collapsed:active:focus-visible,
.navbar-dark .navbar-toggler.collapsed:active:hover:focus-visible {
    color: rgba(var(--btn-toggler-color));
    background: radial-gradient(circle at center, rgba(var(--btn-toggler-color),var(--btn-active)) 0%, rgba(var(--btn-toggler-color),var(--btn-active)) 100%);
    width: 48px;
    height: 48px;
    outline: none;
    text-shadow: none;
    box-shadow: none; 
    left: 2px;        
}
.navbar-dark .navbar-toggler:not(.collapsed):active,
.navbar-dark .navbar-toggler:not(.collapsed):active:hover,
.navbar-dark .navbar-toggler:not(.collapsed):active:focus-visible,
.navbar-dark .navbar-toggler:not(.collapsed):active:hover:focus-visible {
    color: rgb(var(--pry-color));
    background: radial-gradient(circle at center, rgba(var(--pry-color),var(--btn-active)) 0%, rgba(var(--pry-color),var(--btn-active)) 100%);
    width: 48px;
    height: 48px;
    outline: none;
    text-shadow: none;
    box-shadow: none; 
    left: 2px;          
}
.navbar-dark .navbar-toggler.collapsed:active:hover:focus-visible,
.navbar-dark .navbar-toggler:active:hover:focus-visible {
    border-radius: 50%;
    background: radial-gradient(circle at center, rgba(var(--btn-toggler-color),var(--btn-active)) 0%, rgba(var(--btn-toggler-color),var(--btn-active)) 100%);
    box-shadow: none;
    left: 2px;
    outline-color: rgb(var(--focus-ring));
    outline-offset: -1px;
    outline-style: solid;
    outline-width: 0.25rem;
}
.navbar-dark .navbar-toggler:not(.collapsed):active:focus-visible,
.navbar-dark .navbar-toggler.collapsed:active:focus-visible {
    outline-color: rgb(var(--focus-ring));
    outline-offset: -1px;
    outline-style: solid;
    outline-width: 0.25rem;
}


nav.top-nav.navbar >.navbar-buttons.navbar-nav >a.nav-utility.nav-link {
    text-decoration: none !important;
    text-decoration-color: transparent !important;
} 

/*** Nav-Utility buttons on right side of NavBar ***/
nav.top-nav.navbar .btn-primary {
    margin: 0; 
    /*margin: 0 3px 0 3px; tabs*/
}
svg.svg-inline--fa.fa-bars.fa-icon {
    min-height: 24px;
}
svg.svg-inline--fa.fa-xmark.fa-icon {
    min-height: 28px;
}
button[title=Statistics].minimal.btn.btn-primary {
    margin-left: 12px;
}

@media (max-width: 576px) {
    button[title=Statistics].minimal.btn.btn-primary {
        margin-left: 0;
    }
}
/*@media (max-width: 576px) {
    .navbar-nav:last-child button.minimal.donate.btn.btn-primary {
        display: none;
    }
}*/

.top-nav .navbar-buttons .btn.donate svg.svg-inline--fa.fa-heart.fa-icon {
    color: rgb(var(--red));
    padding-bottom: 2px;
    font-size: 18px;
}
.top-nav .navbar-buttons .btn:not(.donate),
.top-nav .navbar-buttons a.nav-utility button.minimal.btn.btn-primary:not(.donate),
button[title=Help].nav-utility.minimal.btn.btn-primary:has(>svg.svg-inline--fa.fa-circle-question.fa-icon) {
    color: rgb(var(--nav-white));
    border: none;
    border-radius: 5rem;
    background: none;
    background-color: transparent;
    text-shadow: none;
    text-decoration: none !important;
    text-decoration-color: transparent !important;
    position: relative;
    overflow: hidden;
    padding: 12px;
    box-shadow: none;
    opacity: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: var(--trans-0);
}
button[title="Help"].nav-utility.btn-primary > svg.fa-circle-question {
    background-color: transparent;
    outline: 0;
}
button[title=Help].nav-utility.minimal.btn.btn-primary > svg.svg-inline--fa.fa-circle-question.fa-icon {
    color: rgb(var(--btn-toggler-color));
    font-size: 22px;
}
svg.svg-inline--fa.fa-gear {
    font-size: 22px;
}
svg.svg-inline--fa.fa-chart-column.fa-icon {
    font-size: 22px;
}
svg.svg-inline--fa.fa-right-from-bracket.fa-icon {
    font-size: 22px;
}

.top-nav .navbar-buttons > a.nav-utility.nav-link > button.minimal.donate.btn.btn-primary {
    border-radius: 5rem;
    background-color: rgb(var(--sec-container));
    text-decoration: none !important;
    text-decoration-color: transparent !important;
    border: none;
    box-shadow: var(--elevation-0);
    color: rgb(var(--on-sec-container));
    font-weight: 500;
    padding: 12px !important;
    width: auto;
    height: 40px !important;
    max-height: 40px;
}
.top-nav .navbar-buttons .btn:not(.donate):not(:disabled):not(.disabled):hover,
.top-nav .navbar-buttons .btn:not(.donate):not(:disabled):not(.disabled):focus:hover {
    color: rgb(var(--btn-toggler-color));
    border: 0 solid transparent;
    box-shadow: none;
}
button[title=Help].nav-utility.minimal.btn.btn-primary>svg.svg-inline--fa.fa-circle-question.fa-icon:not(:disabled):not(.disabled):hover,
button[title=Help].nav-utility.minimal.btn.btn-primary>svg.svg-inline--fa.fa-circle-question.fa-icon:not(:disabled):not(.disabled):hover:focus,
button[title=Help].nav-utility.minimal.btn.btn-primary>svg.svg-inline--fa.fa-circle-question.fa-icon:focus-visible {
    color: rgb(var(--btn-toggler-color));
}
.top-nav .navbar-buttons > a.nav-utility.nav-link > button.minimal.donate.btn.btn-primary:hover,
.top-nav .navbar-buttons > a.nav-utility.nav-link > button.minimal.donate.btn.btn-primary:focus {
    color: rgb(var(--on-sec-container));
    background-color: rgba(var(--sec-container),var(--btn-hover-rev));
    box-shadow: var(--elevation-1);
}
.top-nav .navbar-buttons a.minimal.logout-button.btn.btn-primary:not(:disabled):not(.disabled):hover,
.top-nav .navbar-buttons a.minimal.logout-button.btn.btn-primary:not(:disabled):not(.disabled):hover:focus,
.top-nav .navbar-buttons a.minimal.logout-button.btn.btn-primary:not(:disabled):not(.disabled):focus-visible,
button[title=Help].nav-utility.minimal.btn.btn-primary:not(:disabled):not(.disabled):hover:has(>svg.svg-inline--fa.fa-circle-question.fa-icon),
button[title=Help].nav-utility.minimal.btn.btn-primary:not(:disabled):not(.disabled):hover:focus:has(>svg.svg-inline--fa.fa-circle-question.fa-icon),
button[title=Help].nav-utility.minimal.btn.btn-primary:not(:disabled):not(.disabled):focus-visible:has(svg.svg-inline--fa.fa-circle-question.fa-icon),
button[title=Settings].minimal.btn.btn-primary:not(:disabled):not(.disabled):hover,
button[title=Settings].minimal.btn.btn-primary:not(:disabled):not(.disabled):hover:focus,
button[title=Settings].minimal.btn.btn-primary:not(:disabled):not(.disabled):focus-visible,
button[title=Statistics].minimal.btn.btn-primary:not(:disabled):not(.disabled):hover,
button[title=Statistics].minimal.btn.btn-primary:not(:disabled):not(.disabled):hover:focus,
button[title=Statistics].minimal.btn.btn-primary:not(:disabled):not(.disabled):focus-visible {
    color: rgb(var(--btn-toggler-color));
    border: 0 solid transparent;
    background: none;
    border-radius: 50%;
    box-shadow: none;
}
.top-nav .navbar-buttons .btn:not(.donate):not(:disabled):not(.disabled).active,
.top-nav .navbar-buttons .btn:not(.donate):not(:disabled):not(.disabled):active,
.top-nav .navbar-buttons .btn:not(.donate):not(:disabled):not(.disabled).active:focus,
.top-nav .navbar-buttons .btn:not(.donate):not(:disabled):not(.disabled):active:focus,
button[title=Help].nav-utility.minimal.btn.btn-primary:not(:disabled):not(.disabled):active:has(>svg.svg-inline--fa.fa-circle-question.fa-icon),
button[title=Help].nav-utility.minimal.btn.btn-primary:not(:disabled):not(.disabled):active:focus:has(>svg.svg-inline--fa.fa-circle-question.fa-icon),
.top-nav .navbar-buttons a.nav-utility.active button.minimal.btn.btn-primary:not(.donate):not(:disabled):not(.disabled),
.top-nav .navbar-buttons a.nav-utility button.minimal.btn.btn-primary:not(.donate):not(:disabled):not(.disabled):active,
.top-nav .navbar-buttons a.nav-utility.active button.minimal.btn.btn-primary:not(.donate):not(:disabled):not(.disabled):focus,
.top-nav .navbar-buttons a.nav-utility button.minimal.btn.btn-primary:not(.donate):not(:disabled):not(.disabled):active:focus {
    color: rgb(var(--pry-color));
    border: 0 solid transparent;
    background-color: rgba(var(--pry-color),var(--btn-active));
}
.top-nav .navbar-buttons a.nav-utility.active button.minimal.btn.btn-primary:not(.donate):not(:disabled):not(.disabled) {
    background-color: rgb(var(--pry-container),var(--btn-active));
}


button[title=Help].nav-utility.minimal.btn.btn-primary>svg.svg-inline--fa.fa-circle-question.fa-icon:not(:disabled):not(.disabled):active,
button[title=Help].nav-utility.minimal.btn.btn-primary>svg.svg-inline--fa.fa-circle-question.fa-icon:not(:disabled):not(.disabled):active:focus,
button[title=Help].nav-utility.minimal.btn.btn-primary>svg.svg-inline--fa.fa-circle-question.fa-icon:not(:disabled):not(.disabled):active:hover {
    color: rgb(var(--pry-color));
}
.top-nav .navbar-buttons > a.nav-utility.nav-link > button.minimal.donate.btn.btn-primary:active,
.top-nav .navbar-buttons > a.nav-utility.nav-link > button.minimal.donate.btn.btn-primary.active {
    color: rgb(var(--on-sec-container));
    background-color: rgba(var(--sec-container),var(--btn-active-rev));
    box-shadow: var(--elevation-0);
}
.top-nav .navbar-buttons .btn:not(.donate):not(:disabled):not(.disabled).active:hover,
.top-nav .navbar-buttons .btn:not(.donate):not(:disabled):not(.disabled):active:hover,
.top-nav .navbar-buttons a.nav-utility.active button.minimal.btn.btn-primary:not(.donate):not(:disabled):not(.disabled):hover,
.top-nav .navbar-buttons a.nav-utility button.minimal.btn.btn-primary:not(.donate):not(:disabled):not(.disabled):active:hover {
    color: rgb(var(--pry-color));
    border: 0 solid transparent;
}

.top-nav .navbar-buttons > a.minimal.logout-button.btn.btn-primary:not(:disabled):not(.disabled).active:hover,
.top-nav .navbar-buttons > a.minimal.logout-button.btn.btn-primary:not(:disabled):not(.disabled):active:hover,
.top-nav .navbar-buttons > button[title=Help].nav-utility.minimal.btn.btn-primary:not(:disabled):not(.disabled).active:hover:has(>svg.svg-inline--fa.fa-circle-question.fa-icon),
.top-nav .navbar-buttons > button[title=Help].nav-utility.minimal.btn.btn-primary:not(:disabled):not(.disabled):active:hover:has(>svg.svg-inline--fa.fa-circle-question.fa-icon),
.top-nav .navbar-buttons a.nav-utility.active button[title=Settings].minimal.btn.btn-primary:not(:disabled):not(.disabled):hover,
.top-nav .navbar-buttons a.nav-utility button[title=Settings].minimal.btn.btn-primary:not(:disabled):not(.disabled):active:hover,
.top-nav .navbar-buttons a.nav-utility.active button[title=Statistics].minimal.btn.btn-primary:not(:disabled):not(.disabled):hover,
.top-nav .navbar-buttons a.nav-utility button[title=Statistics].minimal.btn.btn-primary:not(:disabled):not(.disabled):active:hover {
    color: rgb(var(--pry-color));
    border: 0 solid transparent;
    border-radius: 5rem;
    background-color: rgba(var(--pry-color),var(--btn-active));
    text-decoration: none !important;
    text-decoration-color: transparent !important;
}
.top-nav .navbar-buttons a.nav-utility.active button[title=Settings].minimal.btn.btn-primary:not(:disabled):not(.disabled):hover {
    background-color: rgb(var(--pry-container),var(--btn-hover));
}

a.nav-utility:focus,
a.nav-utility:focus-visible,
a.nav-utility.nav-link:focus,
a.nav-utility.nav-link:focus-visible {
    outline: none; 
    box-shadow: none;
    background: none;
    background-color: transparent; 
} 
.top-nav .navbar-buttons .btn:not(.donate):not(:disabled):not(.disabled):active:focus-visible,
.top-nav .navbar-buttons .btn:not(.donate):not(:disabled):not(.disabled).active:focus-visible,
.top-nav .navbar-buttons a.nav-utility button.minimal.btn.btn-primary:not(.donate):not(:disabled):not(.disabled):active:focus-visible,
.top-nav .navbar-buttons a.nav-utility button.minimal.btn.btn-primary:not(.donate):not(:disabled):not(.disabled).active:focus-visible {
    color: rgb(var(--pry-color));
    background-color: rgba(var(--pry-color),var(--btn-active));
    box-shadow: none;
    outline-color: rgb(var(--focus-ring));
    outline-offset: -0.1rem;
    outline-style: solid;
    outline-width: 0.19rem;
    text-decoration: none !important;
    text-decoration-color: transparent !important;
}
.top-nav .navbar-buttons > a.nav-utility.nav-link > button.minimal.donate.btn.btn-primary:active:focus-visible,
.top-nav .navbar-buttons > a.nav-utility.nav-link > button.minimal.donate.btn.btn-primary.active:focus-visible {
    color: rgb(var(--on-sec-container));
    background-color: rgba(var(--sec-container),var(--btn-active-rev));
    box-shadow: none;
    outline-color: rgb(var(--focus-ring));
    outline-offset: -0.1rem;
    outline-style: solid;
    outline-width: 0.19rem;
}
.top-nav .navbar-buttons .btn:not(.donate):not(:disabled):not(.disabled):focus-visible,
.top-nav .navbar-buttons a.nav-utility button.minimal.btn.btn-primary:not(.donate):not(:disabled):not(.disabled):focus-visible {
    color: rgb(var(--btn-toggler-color));
    background: none;
    background-color: rgba(var(--on-surface),var(--btn-hover));
    border-radius: 5rem;
    box-shadow: none;
    outline-color: rgb(var(--focus-ring));
    outline-offset: -0.1rem;
    outline-style: solid;
    outline-width: 0.19rem;
    text-decoration: none !important;
    text-decoration-color: transparent !important;
}
.top-nav .navbar-buttons > a.nav-utility.nav-link > button.minimal.donate.btn.btn-primary:focus-visible {
    color: rgb(var(--on-sec-container));
    background-color: rgba(var(--sec-container),var(--btn-hover-rev));
    box-shadow: none;
    outline-color: rgb(var(--focus-ring));
    outline-offset: -0.1rem;
    outline-style: solid;
    outline-width: 0.19rem;
}

/* --- Text-Input Clear button --- */
button.query-text-field-clear.btn.btn-secondary>svg.svg-inline--fa.fa-xmark.fa-icon,
button.clearable-text-field-clear.btn.btn-secondary>svg.svg-inline--fa.fa-xmark.fa-icon {
    height: 60%;
    width: 100%;
}
.btn-toolbar button.query-text-field-clear.btn.btn-secondary,
button.clearable-text-field-clear.btn.btn-secondary {
    color: rgb(var(--on-surface-variant));
    background-color: transparent;
    border-style: none;
    border-radius: 5rem;
    height: 40px;
    min-height: 40px;
    max-height: 40px;
    width: 40px;
    min-width: 40px;
    padding: 0;
    margin-left: -48px;
    z-index: 3;
    right: 4px;
    margin-top: auto;
    margin-bottom: auto;
    outline: none;
    opacity: 1;
    transition: background-color 0.55s ease;
    -webkit-transition: background-color 0.55s ease;
    -moz-transition: background-color 0.55s ease;
}
button.clearable-text-field-clear.btn.btn-secondary {
    height: 40px;
    top: 11px;
}
.btn-toolbar input.query-text-field.bg-secondary.text-white.border-secondary.form-control + button.query-text-field-clear.btn.btn-secondary:hover, 
button.clearable-text-field-clear.btn.btn-secondary:hover {
    background-color: rgb(var(--on-surface-variant),var(--btn-hover));
    box-shadow: var(--elevation-0);
}
/* Text-Input Clear button ACTIVE */
.btn-toolbar input.query-text-field.bg-secondary.text-white.border-secondary.form-control + button.query-text-field-clear.btn.btn-secondary:not(:disabled):not(.disabled):is(:active, :focus, :focus:active),
button.clearable-text-field-clear.btn.btn-secondary:not(:disabled):not(.disabled):is(:active, :focus, :focus:active) {
    background-color: rgb(var(--on-surface-variant),var(--btn-active));
    box-shadow: none;
    outline: none;
}
.btn-toolbar input.query-text-field.bg-secondary.text-white.border-secondary.form-control + button.query-text-field-clear.btn.btn-secondary:focus-visible,
button.clearable-text-field-clear.btn.btn-secondary:focus-visible {
    box-shadow: none;
    outline-color: rgb(var(--focus-ring));
    outline-style: solid;
    outline-width: 0.19rem;
    outline-offset: -0.1rem;
}
/* Switch */
.custom-switch {
    margin-left: -0.5rem;
}
.custom-control-label:is(:only-of-type, :hover, :active, :focus, :active:focus)::before {
    background-color: rgb(var(--menu-color));
    border: 2px solid rgb(var(--outline));
    top: -4.5px;
}
.custom-switch .custom-control-label::after {
    background-color: rgb(var(--outline));
    width: 16px;
    height: 16px;
    border-radius: 5rem;
    top: 3px;
    left: -24px;
    box-shadow: var(--elevation-1);
}
.custom-switch .custom-control-label:hover::after {
    background-color: rgb(var(--on-surface-variant));
    box-shadow: 0 0 0 12px rgb(var(--on-surface-variant),var(--btn-hover));
}
.custom-switch .custom-control-label:is(:active, :focus, :active:focus)::after {
    width: 28px;
    height: 28px;
    background-color: rgb(var(--on-surface-variant));
    top: -2.5px;
    left: -30px;
    box-shadow: 0 0 0 6px rgb(var(--on-surface-variant),var(--btn-hover));
}
.custom-control-input:checked~.custom-control-label::before,
.custom-control-input:checked~.custom-control-label:hover::before,
.custom-control-input:checked~.custom-control-label:focus::before,
.custom-control-input:checked~.custom-control-label:active::before {
     border: 2px solid rgb(var(--outline));
     background-color: rgb(var(--tertiary));
     /*box-shadow: 0 0 3px 0.1rem rgba(0,0,0,0.25);*/
}
.custom-switch .custom-control-label:before {
    /*width: 1.85rem; Original*/
    width: 52px;
    height: 32px;
    border-radius: 5rem;
}
.custom-switch .custom-control-input:checked~.custom-control-label::after {
    background-image: none;
    background-color: rgb(var(--on-tertiary-container));
    height: 24px;
    width: 24px;
    content: "\xB9";
    color: rgb(var(--tertiary));
    font-size: 20px;
    border:0;
    border-radius: 5rem;
    box-shadow: var(--elevation-1);
    transform: translate(22px);
    display: flex;
    top: -0.5px;
    left: -30px;
    transition: background-image 0.55s ease, background-color 0.55s ease, box-shadow 0.4s ease-in, transform 0s linear;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    align-content: center;
}
.custom-switch .custom-control-input:checked~.custom-control-label:hover::after {
    background-image: var(--btn-hover-highlight);
    background-color: rgb(var(--on-pry));
    background-blend-mode: screen;
    box-shadow: 0 0 0 9px rgb(var(--on-pry),var(--btn-hover));
}
.custom-switch .custom-control-input:checked~.custom-control-label:focus::after,
.custom-switch .custom-control-input:checked~.custom-control-label:active::after {
    background-image: var(--btn-active-highlight);
    background-color: rgb(var(--on-pry));
    background-blend-mode: screen;
    box-shadow: 0 0 0 6px rgb(var(--on-pry),var(--btn-active));
    top: -2.5px;
    width: 28px;
    height: 28px;
}
.custom-switch .custom-control-input:disabled {
    opacity: 0;
}
.custom-switch .custom-control-input:disabled:checked {
    opacity: 0;
}
.custom-switch .custom-control-input:disabled~.custom-control-label:before {
    background-color: #373d3b;
    opacity: 0.4;
}
.custom-switch .custom-control-input:disabled:checked~.custom-control-label:before {
     background-color: #00dfc6;
}
/*.custom-switch .custom-control-input:focus + .custom-control-label,*/
.custom-switch .custom-control-input:focus-visible:not(:disabled)~.custom-control-label:after {
    background-color: #fff;
}
/* ***removing default borders and boxes*** */
.custom-control-input:focus:not(:checked):not(:disabled)~.custom-control-label:before {
    border-color: transparent;
}
.custom-control-input:focus:not(:disabled)~.custom-control-label:before {
    box-shadow: none;
}
/* *** *** */
.custom-switch .custom-control-input:focus-visible:not(:disabled)~.custom-control-label:before,
.custom-switch .custom-control-input:focus-visible:not(:checked):not(:disabled)~.custom-control-label:before {
    outline-color: #899390;
    outline-style: solid;
    outline-width: 2px;
    outline-offset: 3px;
    box-shadow: none;
}
.custom-switch .custom-control-input:focus-visible:checked:not(:disabled)~ .custom-control-label:before {
    outline-color: #d0d4d2;
    outline-style: solid;
    outline-width: 2px;
    outline-offset: 3px;
    box-shadow: none;
}
/* Danger Button */
.btn-danger,
.addresses .btn-danger.btn-sm {
     color: rgb(var(--on-error-container));
     background-image: var(--btn-dummy-highlight);
     background-color: rgb(var(--error-container));
     font-size: 14px;
     font-weight: 500;
     border-width: 0;
     border-radius: 5rem;
     gap: 8px;
     display: inline-flex;
     justify-content: center;
     align-items: center;
     height: 40px;
     max-height: 40px;
     width: auto;
     line-height: 20px;
     letter-spacing: 0.025em;
     padding: 0 24px 0 24px;
     outline: 0;
     overflow: hidden;
     box-shadow: var(--elevation-0);
     transition: var(--trans-0);
     -webkit-transition: var(--trans-0);
}
.addresses button.btn.btn-danger.btn-sm {
    padding: 0 16px 0 16px;
}
.btn-danger:not(.disabled):not(:disabled):is(:hover, :focus-visible),
.addresses .btn-danger.btn-sm:not(.disabled):not(:disabled):is(:hover, :focus-visible) {
     color: rgb(var(--on-error-container));
     background-image: var(--btn-hover-highlight);
     background-color: rgba(var(--error-container));
     background-blend-mode: screen;
     box-shadow: var(--elevation-1);
}
.btn-danger:focus-visible,
.addresses .btn-danger.btn-sm:focus-visible {
     outline-color: rgb(var(--focus-ring));
}
.btn-danger:not(:disabled):not(.disabled):is(.active, :active, :focus, :active:focus, .active:focus),
.addresses .btn-danger.btn-sm:not(:disabled):not(.disabled):is(.active, :active, :focus, :active:focus, .active:focus) {
     color: rgb(var(--on-error-container));
     background-image: var(--btn-active-highlight);
     background-color: rgba(var(--error-container));
     background-blend-mode: screen;
     border: 0;
     outline: 0;
     box-shadow: var(--elevation-0);
}
.btn-danger:is(.disabled, :disabled),
.addresses .btn-danger.btn-sm:is(.disabled, :disabled) {
    color: rgb(var(--on-error-container));
    background-color: rgb(var(--error-container));
    opacity: var(--disabled);
    box-shadow: none;
}

/* Success Button */
.btn-success {
     color: rgb(var(--tertiary-container));
     background-image: var(--btn-dummy-highlight);
     background-color: rgb(var(--on-tertiary-container));
     font-size: 14px;
     font-weight: 500;
     border: 0;
     border-radius: 5rem;
     gap: 8px;
     display: inline-flex;
     justify-content: center;
     align-items: center;
     height: 40px;
     max-height: 40px;
     width: auto;
     line-height: 20px;
     letter-spacing: 0.025em;
     padding: 0 24px 0 24px;
     outline: 0;
     overflow: hidden;
     box-shadow: var(--elevation-0);
     transition: var(--trans-0);
     -webkit-transition: var(--trans-0);
}
.btn-success:not(:disabled):not(.disabled):is(:hover, :focus-visible) {
     color: rgb(var(--tertiary-container));
     background-image: var(--btn-hover-highlight);
     background-color: rgb(var(--on-tertiary-container));
     background-blend-mode: screen;
     box-shadow: var(--elevation-1);
}
.btn-success:not(:disabled):not(.disabled):focus-visible {
     outline-color: rgb(var(--focus-ring));
}
.btn-success:not(:disabled):not(.disabled):is(.active, :active, :focus, :active:focus, .active:focus) {
     color: rgb(var(--tertiary-container));
     background-image: var(--btn-active-highlight);
     background-color: rgb(var(--on-tertiary-container));
     background-blend-mode: screen;
     outline: 0;
     box-shadow: var(--elevation-0);
}
.btn-success:is(.disabled, :disabled) {
    color: rgb(var(--tertiary-container));
    background-color: rgb(var(--on-tertiary-container));
    box-shadow: none;
    opacity: var(--disabled);
}

/* Tagger-Container Text-Danger-Button */
.text-danger svg.svg-inline--fa.fa-xmark.fa-icon {
    min-height: 14px;
    width: 1em;
}
button.text-danger.include-exclude-button {
    border: 0;
    padding: 0;
    margin: 0 8px 0 0;
    outline: 0;
    box-shadow: var(--elevation-0);
    background: none;
    background-color: rgb(var(--on-error-container));
    color: rgb(var(--error-container)) !important;
    font-size: 18px;
    line-height: 0;
    letter-spacing: 0;
    border-radius: 2px;
    font-weight: 900;
}
.text-success svg.svg-inline--fa.fa-check.fa-icon {
    width: 1em;
}
button.text-success.include-exclude-button {
    border: 0;
    padding: 0;
    margin: 0 8px 0 0;
    outline: 0;
    box-shadow: var(--elevation-0);
    background: none;
    background-color: rgb(var(--tertiary));
    color: rgb(var(--on-tertiary)) !important;
    line-height: 0;
    letter-spacing: 0;
    font-size: 18px;
    border-radius: 2px;
    font-weight: 900;
}
button:is(.text-success, .text-danger).include-exclude-button:focus-visible {
    outline-color: rgb(var(--focus-ring));
    outline-offset: -0.1rem;
    outline-style: solid;
    outline-width: 0.19rem;
    box-shadow: none;
}

li.active .optional-field.excluded .optional-field-content, 
li.active .optional-field.excluded .scene-link {
    text-decoration: line-through;
    text-decoration-color: rgb(var(--on-error-container));
    filter: saturate(0.6);
}

/* */
.brand-link {
     background-color: var(--nav-color)!important;
}

/* */
.hover-popover-content {
     max-width: 32rem;
     text-align: center;
     background: var(--nav-color);
}

/* Progress Bars*/
.progress-bar.progress-bar-animated.progress-bar-striped {
    background-color: rgb(var(--pry-color));
}
.progress-bar {
    color: transparent;
    text-shadow: none;
    background-color: white;
    height: 0.25rem;
    border-radius: 2.5rem;
}
.progress-bar-animated {
    animation: none;
}
.progress-bar-striped {
    background-image: none;
    background-size: 0rem 0rem;
}
.progress {
    height: 0.25rem;
    font-size: 0.75rem;
    background-color: rgb(var(--pry-container));
    border-radius: 2.5rem;
}

.grid-card .progress-bar {
     background-color: rgba(var(--white-color),0.2);
     backdrop-filter: blur(6px);
     height: 7px;
     border-radius: 0;
     margin-bottom: -5px;
}
.progress-indicator {
    background-color: rgba(var(--white-color),var(--btn-active-rev));
    height: 8px;
}
.grid-card .progress-indicator {
    background-color: rgb(var(--pry-color));
    height: 7px;
}

/* Terminal */
.job-table.card {
    margin: 0%;
    padding: 0.5rem 1rem;
    height: 12.469rem;
    border-radius: 0.25rem;
    background-color: rgb(var(--body-color2));
    border: 1px solid rgb(var(--outline-variant));
    box-shadow: var(--elevation-5);
}
.empty-queue-message {
    color: rgb(var(--muted-text),0.75);
}
.job-table.card .progress {
    margin-top: 0.25rem;
    margin-bottom: 0.5rem;
}
.job-table.card .finished .fa-icon {
    color: rgb(var(--green));
}
.job-table.card svg.svg-inline--fa.fa-xmark.fa-icon {
    min-height: 22px;
}

.job-table.card .stop, .job-table.card .stop:not(:disabled), .job-table.card .stopping .fa-icon, .job-table.card .cancelled .fa-icon {
    color: rgb(var(--on-surface-variant));
    font-size: 11px;
    font-weight: 500;
    line-height: 1rem;
    padding: 0;
}
.job-table.card button.minimal.stop.btn.btn-primary.btn-sm,
.job-table.card button.minimal.stop:not(:disabled).btn.btn-primary.btn-sm {
    background-image: none;
    background-color: transparent;
    color: rgb(var(--on-surface-variant));
    padding: 0;
    width: 32px;
    min-width: 32px;
    max-width: 32px;
    height: 32px;
    min-height: 32px;
    max-height: 32px;
    box-shadow: none;
}
.job-table.card button.minimal.stop:not(:disabled).btn.btn-primary.btn-sm:hover {
    color: rgb(var(--on-surface-variant));
    background-image: var(--btn-dummy-highlight);
    background-color: rgb(var(--on-surface-variant),var(--btn-hover));
    background-blend-mode: normal;
    box-shadow: var(--elevation-0);
}
.job-table.card button.minimal.stop:not(:disabled).btn.btn-primary.btn-sm:is(:active, :focus, :active:focus) {
    color: rgb(var(--on-surface-variant));
    background-image: var(--btn-dummy-highlight);
    background-color: rgb(var(--on-surface-variant),var(--btn-active));
    background-blend-mode: normal;
    box-shadow: none;
}

.job-status {
    color: rgb(var(--on-surface));
}

/* Progress Spin-Grean and "Scanning" */
.job-table.card .job-status .fa-icon.fa-spin {
    color: transparent;
}
.job-status > div > svg.fa-spin {
    color: transparent;
}
.job-status > div > svg.fa-spin + span {
    margin-left: -1rem;
}
/* */

#tasks-panel .tasks-panel-queue {
    background-color: transparent;
}

#queue-viewer .current {
     background-color: var(--card-color2);
}
.tab-content .card-popovers .btn {
     padding-left: .5rem;
     padding-right: .5rem;
}

/* */
.react-select__menu-portal {
     z-index: 2;
}

/* --- Adjust the lengths of the Performer, Movies and Tags fields while editing a scene while the scene plays --- */
#scene-edit-details .col-sm-9 {
    flex: 0 0 100%;
    max-width: 100%;
}

/* --- Cuts the name of Performers, Movies and Tags short if they go longer than the length of the field --- */
div.react-select__control .react-select__multi-value {
  max-width: 285px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* --- Changes the size of the Custom CSS field in the settings --- */
#configuration-tabs-tabpane-interface textarea.text-input { 
    min-width:60ex; 
    max-width:55vw !important; 
    min-height:50ex;
}

div.modal-body b, 
.form-label h6 {
    text-shadow: none;
}

.set-as-default-button {
    margin-top: 8px;
}

/* --- Spacing out the paginationIndex --- */
.paginationIndex {
    color: #ffffff;
    margin-bottom: 8px;
}
.paginationIndex .scenes-stats, 
.images-stats {
    margin-top: -3px; 
    color: #dbe4ec;
}
.paginationIndex .scenes-stats:before, 
.images-stats:before {
    font-size: 16px;
    margin-left:18px;
    margin-right:12px;
    color: #e1e4e6;
    content: "-";
}
.form-group>.form-group {
    margin-top:0.5em; 
    margin-bottom: 0.5rem;
}

#configuration-tabs-tabpane-tasks>.form-group {
    margin-bottom:2rem; 
    margin-top:1em;
}

#configuration-tabs-tabpane-tasks h6 {     
    margin-top:3.5em; 
    font-weight:bold; 
    margin-bottom:1em;  
}
#configuration-tabs-tabpane-tasks h5 {     
    margin-top:2.0em; 
    font-weight:bold;  
    letter-spacing: 0.09rem; 
}
.form-group h4 {
    margin-top:2em;
}

#parser-container.mx-auto {
    max-width:1400px;
    margin-right:auto !important;
}
.scene-parser-row .parser-field-title {
    width: 62ch;
}

.mx-auto.card .row .col-md-2 .flex-column { 
    position:fixed;
    min-height:400px;
}
.mx-auto.card>.row {
    min-height:360px;
}

.loading-indicator {
    opacity:0.8; 
    zoom:2;
}

/* Setting-Section */
.setting-section .setting {
    padding: 1rem 1.25rem;
}
.changelog >h1,
.setting-section h1, 
#tasks-panel h1 {
    font-size: 57px;
    color: rgb(var(--setting-h1));
    margin-bottom: 1.25rem;
    margin-top: 2.75rem;
    text-shadow: var(--light-txt-shadow);
}

.setting-section .setting-group>.setting:first-child h3,
.setting-section>.card>.setting:first-child h3,
.form-group:nth-of-type(2) .setting-section:nth-child(2)>.card>.setting h3,
.form-group:nth-of-type(2) .setting-section:nth-child(3)>.card>.setting h3,
.form-group:nth-of-type(2) .setting-section:nth-child(4)>.card>.setting h3,
#apikey h3,
#maxSessionAge h3 {
    color: rgb(var(--on-tertiary));
    font-weight: 400;
    font-size: 28px;
    line-height: 36px;
    letter-spacing: 0.013em;
    font-family: var(--HeaderFont);
}
.setting-section .setting-group>.setting:not(:first-child) h3,
.setting-section .setting-group .collapsible-section {
    color: #dee5e4;
    text-shadow: var(--really-light-txt-shadow);
}
.setting-section .setting h3[title] {
    text-decoration: none !important;
    text-decoration-color: transparent !important;
}
.setting-section .setting h3[title]:hover {
    text-decoration: underline dotted !important;
    text-decoration-thickness: 0.13em !important;
    text-decoration-color: rgb(var(--link)) !important;
    text-underline-offset: 0.24em;
}
.settings-section .setting .value {
    font-family: var(--MonoFont);
}


/* || Collapse Butons */
    /* fixes oddly scaled and un-centerd arrow svg */
button.minimal.collapse-button.btn.btn-primary.btn-lg.enhanced svg.svg-inline--fa.fa-chevron-up.fa-icon.fa-fw,
.setting-section .setting-group .setting-group-collapse-button svg.svg-inline--fa.fa-chevron-up.fa-icon.fa-fw {
    vertical-align: middle;
    width: 1em;
}

button.minimal.collapse-button.btn.btn-primary.btn-lg.enhanced,
.setting-section .setting-group .setting-group-collapse-button {
    color: rgb(var(--on-surface-variant));
    background-image: none;
    background-color: transparent;
    box-shadow: none;
    border-radius: 5rem;
    padding: 0;
    border: 0;
    line-height: 28px;
    height: 40px;
    width: 40px;
    min-width: 40px;
    font-weight: 500;
    font-size: 27.45px;
    outline: none;
    transition: var(--trans-0);
    -webkit-transition: var(--trans-0);
    -moz-transition: var(--trans-0);
}
button.minimal.collapse-button.btn.btn-primary.btn-lg.enhanced:hover,
.setting-section .setting-group .setting-group-collapse-button:hover {
    box-shadow: var(--elevation-0);
    background-color: rgb(var(--on-surface-variant),var(--btn-hover));
}
button.minimal.collapse-button.btn.btn-primary.btn-lg.enhanced:is(:active, :focus, :active:focus),
.setting-section .setting-group .setting-group-collapse-button:is(:active, :focus, :active:focus) {
    color: rgb(var(--on-surface-variant));
    box-shadow: var(--elevation-0);
    background-image: none;
    background-color: rgb(var(--on-surface-variant),var(--btn-active));
}
div.original-scene-details button.minimal.collapse-button.btn.btn-primary.btn-lg.enhanced:focus-visible,
.setting-section .setting-group .setting-group-collapse-button:focus-visible {
    box-shadow: none;
    outline-color: rgb(var(--focus-ring));
    outline-style: solid;
    outline-width: 0.19rem;
    outline-offset: -0.1rem;
}
/* --- */
#tasks-panel h1 {
    margin-top: 0.8em;
    /*margin-left: 4px;*/
}

#configuration-tabs-tabpane-tasks .form-group:last-child .setting-section .setting div:last-child {
    margin-right: 0% !important;
    margin-left: 0px;
    margin-top: 2px;
}

#configuration-tabs-tabpane-tasks #video-preview-settings  button { 
    width:250px;
    margin-top:22px;
    margin-left:-57px;
}
#configuration-tabs-tabpane-tasks .tasks-panel-tasks .setting-section:nth-child(3) {
    margin-top:5em;
}

.setting-section .setting .value,
#settings-container .col-form-label:first-of-type {
    font-family: var(--MonoFont);
    font-size: 12px;
    font-weight: 200;
    line-height: 16px;
    letter-spacing: 0.078em;
    color: rgb(var(--on-surface));
    padding: 16px 22px;
    background-image: linear-gradient(to right, rgba(var(--pry-color),var(--text-field-tint)), rgba(var(--pry-color),var(--text-field-tint)));
    background-color: rgb(var(--card-color));
    background-blend-mode: screen;
    border: 0;
    border-radius: 4px;
    font-variant: tabular-nums slashed-zero;
    margin: 4px 0;
    text-rendering: optimizeLegibility;
    box-shadow: inset 0 0 0px 1px rgb(0,0,0,0);
}
.setting-section .setting .value {
    margin: 10px 0%;
    width: 100%;
    margin-left: 2.5%;
}

.setting-section .setting .value:empty {
    display: none;
}
.setting-section .setting .value:has(>span:empty) {
    display: none;
}
.setting-section .setting .value:has(>div:empty) {
    display: none;
}

.setting-section .setting-group >.setting:not(:first-child), 
.setting-section .setting-group .collapsible-section .setting {
    margin-left: 4rem; 
}
.setting-section .setting h3 {
    font-weight: 400;
    font-size: 28px;
    line-height: 36px;
    letter-spacing: 0.013em;
    font-family: var(--HeaderFont); 
    color: rgb(var(--on-tertiary));
}

/* ||Help Circles */
.setting-section .setting h3>a>svg.svg-inline--fa.fa-circle-question.fa-icon {
    font-size: 1.1rem;
}
svg.svg-inline--fa.fa-circle-question.fa-icon {
    color: #005a82;
    font-size: 1.1rem;
    background-color: rgb(var(--on-pry-container));
    margin-left: 8px;
    border-radius: 5rem;
    border-width: 0;
    outline-color: currentColor;
    outline-style: solid;
    outline-width: 2px;
    outline-offset: -1px;
    box-shadow: var(--elevation-0);
}
/* --- */

.setting-section .setting.sub-setting h3 {
    color: rgb(var(--on-tertiary),0.94);
}
.setting-section .setting-group>.setting:not(:first-child) h3, 
.setting-section .setting-group .collapsible-section .setting h3 {
    color: rgb(var(--on-tertiary),0.94);
    font-size: 17.5px;
    font-weight: 400;
    letter-spacing: 0.026em;
    line-height: 26px;
    padding: 10px 0 6px 0;
}
.setting-section .setting.disabled .custom-switch, 
.setting-section .setting.disabled h3 {
    opacity: 0.4;
}
.setting-section:not(:first-child) {
    margin-top: 1em;
}

.setting-section {
    margin-bottom: 0.8em;
}
.setting-section .setting-group>.setting:not(:first-child), 
.setting-section .setting-group .collapsible-section .setting {
    padding-bottom: 3px;
    padding-top: 4px;
    margin-right: 0rem;
}
.setting-section .sub-heading {
    font-size: 11px;
    margin-top: 0.25rem;
    margin-bottom: 1rem;
    margin-left: 0%;
    margin-right: 0%;
    font-weight: 200;
    text-shadow: var(--really-light-txt-shadow);
    letter-spacing: 0.107em;
    line-height: 16px;
    color: rgb(var(--on-surface-variant),0.96);
    text-rendering: optimizeLegibility;
}
.setting-section .sub-heading code {
    font-style: normal;
    font-size: smaller;
}
.setting-dialog .sub-heading {
    color: #879390;
}


/* ||Changelog */
.changelog-version svg:is(.fa-angle-up, .fa-angle-down).svg-inline--fa.fa-icon.mr-3 {
    font-size: 24px;
    margin-right: 8px !important;
    color: rgb(var(--on-surface-variant));
}
.changelog-version-header .btn-link {
    font-weight: 200;
    font-size: 28px;
    line-height: 32px;
    letter-spacing: 0.012em;
    color: rgb(var(--on-surface));
    text-decoration-thickness: 1% !important;
    background-color: transparent;
    padding: 0 24px;
    height: 48px;
    min-height: 48px;
    box-shadow: none;
    display: flex;
    gap: 4px;
    justify-content: center;
    align-items: center;
}
.card-header:first-child {
    border-radius: 12px 12px 0 0;
}
.card-header {
    border-bottom: 1px solid rgb(var(--card-fold));
    background-color: rgb(var(--card-color));
    padding: 1rem 1.25rem;
    margin-bottom: -2px;
}


/* --- */

#configuration-tabs-tabpane-library>#stashes.setting-section:first-child>.sub-heading {
    position: relative;
    top: -0.75rem;
    color: rgb(var(--on-surface-variant));
    text-shadow: var(--light-txt-shadow);
}
#configuration-tabs-tabpane-library .setting-section:not(#stashes)>h1 {
    margin-top: 1em;
}
#configuration-tabs-tabpane-library .setting-section:nth-of-type(2)>.card>.setting h3,
#configuration-tabs-tabpane-library .setting-section:nth-of-type(3)>.card>.setting h3,
#configuration-tabs-tabpane-library .setting-section:nth-of-type(4)>.card>.setting h3,
#configuration-tabs-tabpane-library .setting-section:nth-of-type(5)>.card>.setting h3 {
    color: rgb(var(--on-tertiary),0.94);
}
#configuration-tabs-tabpane-library .setting-section:nth-of-type(4)>.card>.setting .custom-control,
#configuration-tabs-tabpane-library .setting-section:nth-of-type(5)>.card>.setting .custom-control {
    margin-right: 26px;
}
#configuration-tabs-tabpane-interface .setting-section:first-child>.card>.setting select.input-control.form-control {
    margin-top: 16px;
    margin-bottom: 16px;
    margin-right: 38px;
    margin-left: -16px;
}

/* ||Toolbar-Button's */
.btn-toolbar .btn-group:not(.pagination) .btn-secondary:not(.btn-sm),
.btn-toolbar:has(:not(.btn-group)) .btn-secondary:not(.btn-sm),
.btn-toolbar button#more-menu {
    background-color: rgb(var(--body-color2));
    border-color: rgb(var(--outline));
    border-width: 1px;
    border-style: solid;
    border-radius: 5rem;
    color: rgb(var(--on-surface));
    font-size: 18px; /* make 16px for buttons with text */
    font-weight: 500;
    gap: 8px;
    padding-left: 16px; 
    padding-right: 16px;
    height: 40px;
    max-height: 40px;
    width: auto;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
    box-shadow: var(--elevation-0);
    transition: var(--trans-0);
    -webkit-transition: var(--trans-0);
}

.btn-toolbar .btn-group>.btn.btn-secondary:not(:last-child):not(.dropdown-toggle), 
.btn-toolbar .btn-group:not(.pagination)>:is(.btn-group, .dropdown):not(:last-child)>.btn.btn-secondary {
    border-bottom-right-radius: 0;
    border-top-right-radius: 0;
}

.btn-toolbar .btn-group:not(.pagination)>.btn.btn-secondary:not(:first-child), 
.btn-toolbar .btn-group:not(.pagination)>.btn-group:not(:first-child)>.btn.btn-secondary {
    border-bottom-left-radius: 0;
    border-top-left-radius: 0;
}
    /* ||Dropdown-Menu Toggler Toolbar-Button */ 
.btn-toolbar .btn-group .input-group-prepend > button.dropdown-toggle.btn.btn-secondary,
.btn-toolbar:has(:not(.btn-group))  select.btn-secondary.form-control {
    font-size: 16px;
    line-height: 24px;
    letter-spacing: 0.0357em;
    padding-left: 24px;
    padding-right: 12px;
    border-bottom-right-radius: 0;
    border-top-right-radius: 0;
}
.btn-toolbar:has(:not(.btn-group))  select.btn-secondary.form-control {
    border-bottom-right-radius: 5rem;
    border-top-right-radius: 5rem;
}
    /* ||Descending and Ascending Toolbar-Button */
.btn-toolbar .dropdown.btn-group > .input-group-prepend + button.btn.btn-secondary {
    font-size: 24px;
    padding-left: 12px;
}
.btn-toolbar .dropdown.btn-group > .input-group-prepend + button.btn.btn-secondary > svg.fa-caret-down {
    vertical-align: -0.065em;
}
.btn-toolbar .dropdown.btn-group > .input-group-prepend + button.btn.btn-secondary > svg.fa-caret-up {
    vertical-align: 0.065em;
}
    /* ||Form-control Toolbar-Button */
.btn-toolbar:has(:not(.btn-group))  select.btn-secondary.form-control {
    font-size: 16px;
    line-height: 24px;
    letter-spacing: 0.0357em;
}
/* ||Toolbar-Button Hover */
.btn-toolbar .btn-group:not(.pagination):not(.show):not(:has(>.show)):not(:has(>.input-group-prepend+.show)) .btn-secondary:not(.btn-sm):not(.active):hover,
.btn-toolbar:has(:not(.btn-group)) .btn-secondary:not(.form-control):not(.btn-sm):hover,
.btn-toolbar button#more-menu:not(.show>button):hover {
    background-image: linear-gradient(to right, rgba(var( --on-surface),var(--btn-hover)), rgba(var(--on-surface),var(--btn-hover)));
    background-color: rgb(var(--body-color2));
    background-blend-mode: screen;
    box-shadow: var(--elevation-0);
}
    /* ||Form-Control Toolbar-Button Hover */
.btn-toolbar select.btn-secondary.form-control:hover {
    background-image: url("data:image/svg+xml;utf8,<svg fill='%23e2e2e5' width='16' height='16' viewBox='0 0 16 16' class='bi bi-caret-down-fill' xmlns='http://www.w3.org/2000/svg'><path d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/></svg>"), linear-gradient(to right, rgba(var( --on-surface),var(--btn-hover)), rgba(var(--on-surface),var(--btn-hover)));
    background-repeat: no-repeat, repeat;
    background-position: calc( 100% - 16px ) calc(50% + 0.065em), center left;
    background-color: rgb(var(--body-color2));
    background-blend-mode: screen;
    background-size: 20px;
    border-color: rgb(var(--outline));
    box-shadow: var(--elevation-0);
    color: rgb(var(--on-surface));
}
/* ||Toolbar-Button Active/Show/Selected */
.btn-toolbar .btn-group:not(.pagination).show .btn-secondary,
.btn-toolbar .btn-group:not(.pagination).show .btn-secondary:focus,
.btn-toolbar .btn-group:not(.pagination):not(.show) > .show .btn-secondary,
.btn-toolbar .btn-group:not(.pagination):not(.show) > .show .btn-secondary:focus,
.btn-toolbar .btn-group:not(.pagination):not(.show):not(:has(>.show)) > .input-group-prepend + .show .btn-secondary,
.btn-toolbar .btn-group:not(.pagination):not(.show):not(:has(>.show)) > .input-group-prepend + .show .btn-secondary:focus,
.btn-toolbar .btn-group:not(.pagination):not(.show):not(:has(>.show)):not(:has(>.input-group-prepend+.show)) .btn-secondary.active,
.btn-toolbar .btn-group:not(.pagination):not(.show):not(:has(>.show)):not(:has(>.input-group-prepend+.show)) .btn-secondary.active:focus,
.btn-toolbar .show > button#more-menu,
.btn-toolbar .show > button#more-menu:focus {
    background-image: var(--btn-dummy-highlight);
    background-color: rgba(var( --sec-container));
    background-blend-mode: normal;
    color: rgb(var(--on-sec-container));
    box-shadow: var(--elevation-0);
}
.btn-toolbar:has(:not(.btn-group)) .btn-secondary:not(.form-control):not(.btn-sm):where(:active, :focus, :active:focus) {
    background-image: linear-gradient(to right, rgba(var( --sec-container),var(--btn-active)), rgba(var(--sec-container),var(--btn-active)));
    background-color: rgb(var(--body-color2));
    background-blend-mode: screen;
    color: rgb(var(--on-sec-container));
    box-shadow: var(--elevation-0);
}
    /* ||Form-Control Toolbar-Button Hover Selected */
.btn-toolbar select.btn-secondary.form-control:active:hover {
    background-image: url("data:image/svg+xml;utf8,<svg fill='%23e2e2e5' width='16' height='16' viewBox='0 0 16 16' class='bi bi-caret-down-fill' xmlns='http://www.w3.org/2000/svg'><path d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/></svg>"), var(--btn-hover-highlight);
    background-repeat: no-repeat, repeat;
    background-position: calc( 100% - 16px ) calc(50% + 0.065em), center left;
    background-color: rgba(var( --sec-container));
    background-blend-mode: screen;
    background-size: 20px;
    border-color: rgb(var(--outline));
    color: rgb(var(--on-sec-container));
    box-shadow: var(--elevation-0) !important;
}
    /* ||Form-Control Toolbar-Button Selected */
.btn-toolbar select.btn-secondary.form-control:active {
    background-image: url("data:image/svg+xml;utf8,<svg fill='%23e2e2e5' width='16' height='16' viewBox='0 0 16 16' class='bi bi-caret-down-fill' xmlns='http://www.w3.org/2000/svg'><path d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/></svg>"), var(--btn-dummy-highlight);
    background-repeat: no-repeat, repeat;
    background-position: calc( 100% - 16px ) calc(50% + 0.065em), center left;
    background-color: rgba(var( --sec-container));
    background-blend-mode: normal;
    background-size: 20px;
    border-color: rgb(var(--outline));
    color: rgb(var(--on-sec-container));
    box-shadow: var(--elevation-0) !important;
}
/* ||Toolbar-Button Hover Selected */
.btn-toolbar .btn-group:not(.pagination).show .btn-secondary:hover,
.btn-toolbar .btn-group:not(.pagination):not(.show) > .show .btn-secondary:hover,
.btn-toolbar .btn-group:not(.pagination):not(.show):not(:has(>.show)) > .input-group-prepend + .show .btn-secondary:hover,
.btn-toolbar .btn-group:not(.pagination):not(.show):not(:has(>.show)):not(:has(>.input-group-prepend+.show)) .btn-secondary.active:hover,
.btn-toolbar .show > button#more-menu:hover {
    background-image: var(--btn-hover-highlight);
    background-color: rgb(var(--sec-container));
    background-blend-mode: screen;
    color: rgb(var(--on-sec-container));
    box-shadow: var(--elevation-0);
}
    /* ||Form-Control Toolbar-Button Hover Selected */
.btn-toolbar select.btn-secondary.form-control:active:hover {
    background-image: url("data:image/svg+xml;utf8,<svg fill='%23e2e2e5' width='16' height='16' viewBox='0 0 16 16' class='bi bi-caret-down-fill' xmlns='http://www.w3.org/2000/svg'><path d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/></svg>"), var(--btn-hover-highlight);
    background-repeat: no-repeat, repeat;
    background-position: calc( 100% - 16px ) calc(50% + 0.065em), center left;
    background-color: rgba(var( --sec-container));
    background-size: 20px;
    border-color: rgb(var(--outline));
    color: rgb(var(--on-sec-container));
    box-shadow: var(--elevation-0) !important;
}
/* ||Toolbar-Button Focus-Visible */
.btn-toolbar .btn-group:not(.pagination):not(.show):not(:has(>.show)):not(:has(>.input-group-prepend+.show)) .btn-secondary:not(.btn-sm):not(.active):focus-visible,
.btn-toolbar:has(:not(.btn-group)) .btn-secondary:not(.form-control):not(.btn-sm):focus-visible,
.btn-toolbar button#more-menu:not(.show>button):focus-visible,
.btn-toolbar select.btn-secondary.form-control:focus-visible,
.btn-toolbar:has(:not(.btn-group)) .btn-secondary:not(.form-control):not(.btn-sm):focus-visible {
    outline-color: rgb(var(--focus-ring));
    outline-offset: -0.10rem;
    outline-style: solid;
    outline-width: 0.19rem;
    box-shadow: none;
    animation: focus-ring-width-bounce-outer 0.45s cubic-bezier(0.25, 1, 0.5, 1) 0.15s forwards;
    z-index: 5;
}
    /* ||Toolbar-Button Active/Show/Selected Focus-Visible */
.btn-toolbar .btn-group:not(.pagination).show .btn-secondary:focus-visible,
.btn-toolbar .btn-group:not(.pagination):not(.show) > .show .btn-secondary:focus-visible,
.btn-toolbar .btn-group:not(.pagination):not(.show):not(:has(>.show)) > .input-group-prepend + .show .btn-secondary:focus-visible,
.btn-toolbar .btn-group:not(.pagination):not(.show):not(:has(>.show)):not(:has(>.input-group-prepend+.show)) .btn-secondary.active:focus-visible,
.btn-toolbar .show > button#more-menu:focus-visible,
.btn-toolbar select.btn-secondary.form-control:is(:active:focus-visible, :active:hover:focus-visible),
.btn-toolbar:has(:not(.btn-group)) .btn-secondary:not(.form-control):not(.btn-sm):active:focus-visible {
    outline-color: rgb(var(--focus-ring-active));
    outline-offset: -0.10rem;
    outline-style: solid;
    outline-width: 0.19rem;
    box-shadow: none;
    animation: focus-ring-width-bounce-outer 0.45s cubic-bezier(0.25, 1, 0.5, 1) 0.15s forwards;
    z-index: 5;
}
/* ||Toolbar-Button Danger-Button */
.btn-toolbar > .btn-group > button.btn-danger,
.btn-toolbar > .btn-group > button.btn-danger:not(.disabled):not(:disabled):where(:active, :focus, :active:focus) {
    border: 1px solid rgb(var(--outline));
    padding-left: 16px;
    padding-right: 16px;
}

/* ||Button-Secondary */
.btn-secondary:not(.btn-toolbar .btn-secondary),
.modal-body .btn-secondary.form-control,
button#scene-scrape,
.scrape-url-button:not(:disabled) {
    color: rgb(var(--on-sec-container));
    background-image: none;
    background-color: rgb(var(--sec-container));
    border: 0;
    border-radius: 5rem;
    font-size: 14px;
    font-weight: 500;
    gap: 8px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    height: 40px;
    max-height: 40px;
    width: auto;
    padding-left: 24px;
    padding-right: 24px;
    overflow: hidden;
    box-shadow: var(--elevation-0);
}
.btn-secondary:not(.btn-toolbar .btn-secondary):hover,
.modal-body .btn-secondary.form-control:hover,
button#scene-scrape:hover,
.scrape-url-button:hover {
    background-image: var(--btn-hover-highlight);
    background-color: rgb(var(--sec-container));
    color: rgb(var(--on-sec-container));
    box-shadow: var(--elevation-1);
}
.btn-secondary:not(.btn-toolbar .btn-secondary):focus,
.modal-body .btn-secondary.form-control:focus,
button#scene-scrape:focus,
.scrape-url-button:not(:disabled):focus {
    color: rgb(var(--on-sec-container));
    background-image: var(--btn-active-highlight);
    background-color: rgb(var(--sec-container));
    box-shadow: var(--elevation-0);
}
.btn-secondary:not(.btn-toolbar .btn-secondary):focus-visible,
.modal-body .btn-secondary.form-control:focus-visible:not(:focus),
button#scene-scrape:focus-visible,
.scrape-url-button:not(:disabled):focus-visible {
    background-image: none;
    background-color: rgba(var(--pry-container));
    color: rgb(var(--on-tertiary-container));
    box-shadow: none;
    z-index: 20;
}
.btn-secondary:not(.btn-toolbar .btn-secondary):not(.disabled):not(:disabled):active:focus {
    box-shadow: none;
}
.btn-secondary:not(.btn-toolbar .btn-secondary):not(:disabled):not(.disabled):active,
button#scene-scrape:not(:disabled):not(.disabled):active,
button#scene-scrape:not(:disabled):not(.disabled).active,
.scrape-url-button:not(:disabled):active,
.scrape-url-button:not(:disabled).active {
     color: rgb(var(--on-sec-container));
     background-image: var(--btn-active-highlight);
     background-color: rgb(var(--sec-container));
     box-shadow: var(--elevation-0);
     outline: 0;
}
.btn-secondary:not(.btn-toolbar .btn-secondary).disabled,
.btn-secondary:not(.btn-toolbar .btn-secondary):disabled {
    color: rgba(var(--on-sec-container),var(--disabled));
    background-image: none;
    background-color: rgb(var(--sec-container),var(--disabled));
    box-shadow: none; 
    outline: 0;
}

button#scene-scrape {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    padding-left: 24px;
    padding-right: 12px;
    border-right-width: 0;
}

svg.svg-inline--fa.fa-magnifying-glass.fa-icon {
    font-size: 20px;
}
.preview-button > button.btn-primary > svg.svg-inline--fa.fa-magnifying-glass.fa-icon {
    font-size: 12px;
}

.scraper-group > .dropdown:not(:first-child) button.dropdown-toggle:not(:disabled) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    padding-left: 12px;
    border-left: 1px solid rgb(var(--body-color2));
}

.modal-body .btn-secondary.form-control {
    background-color: transparent;
}
.modal-body .form-label {
    font-size: 1.20rem;
}

/**********************/
/* Transform property as a fix for the Toolbar-Filter-Button's "Badge" not being visible because of overflow to contain the Active Button state Wave. */
.mr-2.mb-2:not(.show):not(.dropdown).btn-group:not(:has(>*.show)) {
    transform: translateZ(0); /* If the parent does have position attribute, the—although not "proper"—alternative is to use a transform with any value other than none on the wrapper and position: fixed; on the overflowing child This occurs because the transform overrides the position: fixed; element's containing block—it's reference—which is usually the viewport itself. */
}
.filter-button .badge {
    position: fixed; /* Overririding Parent's OverflowHidden. Parent with a defined position ie. relative. */
}
/* Revert changes on the btn-group when it has a dropdown or the dropdown menu will be hidden behind other elements */
.mr-2.mb-2.show.dropdown.btn-group {
    transform: none;
}
/**********************/

a#new-performer-filter {
    padding-left: 24px;
    padding-right: 24px;
}

/* O-Counter with right dropdown toggle in nav-items tabs, O-Counter toggled On*/
.o-counter.btn-group > button[title="O-Counter"].minimal.btn.btn-secondary:has(+ .dropdown > .dropdown-toggle.btn-secondary) {
    background-color: rgb(var(--pry-color));
    color: rgb(var(--on-pry));
    padding-right: 8px !important;
    box-shadow: var(--elevation-0);
    transition: background-image 0.55s ease, color 0.2s ease-in-out, outline 0.4s ease-in-out 0.2s;
}
.o-counter.btn-group > button[title="O-Counter"].minimal.btn.btn-secondary:has(+ .dropdown > .dropdown-toggle.btn-secondary):where(:hover, :focus-visible) {
    background-image: var(--btn-hover-highlight);
    background-color: rgb(var(--pry-color));
    background-blend-mode: screen;
    box-shadow: var(--elevation-1);
}
.o-counter.btn-group > button[title="O-Counter"].minimal.btn.btn-secondary:has(+ .dropdown > .dropdown-toggle.btn-secondary):where(:focus:not(:focus-visible), :active) {
    background-image: var(--btn-active-highlight);
    background-color: rgb(var(--pry-color));
    background-blend-mode: screen;
    box-shadow: var(--elevation-0);
}
/* O-Counter sibling Dropdown Toggle */
.o-counter.btn-group > button[title="O-Counter"].minimal.btn.btn-secondary + .dropdown > .dropdown-toggle.btn-secondary,
.o-counter.btn-group > .dropdown > .dropdown-toggle.btn-secondary {
    border: 0;
    color: rgb(var(--on-pry));
    padding: 0 16px 0 28px;
    margin-right: 6px;
    box-shadow: var(--elevation-0);
    background-image: url("data:image/svg+xml;utf8,<svg fill='%2300344d' width='16' height='16' viewBox='0 0 16 16' class='bi bi-caret-down-fill' xmlns='http://www.w3.org/2000/svg'><path d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/></svg>"), var(--btn-dummy-highlight);
    background-color: rgb(var(--pry-color));
    background-blend-mode: normal;
    background-repeat: no-repeat, repeat;
    background-position: calc( 100% - 16px ) calc(50% + 0.065em), center left;
    background-size: 20px;
    transition: var(--trans-0);
}
.o-counter.btn-group > button[title="O-Counter"].minimal.btn.btn-secondary + .dropdown > .dropdown-toggle.btn-secondary:hover,
.o-counter.btn-group > .dropdown > .dropdown-toggle.btn-secondary:hover {
    background-image: url("data:image/svg+xml;utf8,<svg fill='%2300344d' width='16' height='16' viewBox='0 0 16 16' class='bi bi-caret-down-fill' xmlns='http://www.w3.org/2000/svg'><path d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/></svg>"), var(--btn-hover-highlight);
    background-color: rgb(var(--pry-color));
    background-blend-mode: normal;
    box-shadow: var(--elevation-1);
    background-repeat: no-repeat, repeat;
    background-position: calc( 100% - 16px ) calc(50% + 0.065em), center left;
    background-size: 20px;
    padding: 0 16px 0 28px;
    border: 0;
}
.o-counter.btn-group > button[title="O-Counter"].minimal.btn.btn-secondary:has(+ .dropdown > .dropdown-toggle.btn-secondary):focus-visible,
.o-counter.btn-group > button[title="O-Counter"].minimal.btn.btn-secondary + .dropdown > .dropdown-toggle.btn-secondary:focus-visible {
    outline-color: rgb(var(--focus-ring));
    outline-width: 0.19rem;
    outline-style: solid;
    outline-offset: -0.1rem;
    box-shadow: none;
}
.o-counter.btn-group > button[title="O-Counter"].minimal.btn.btn-secondary + .dropdown > .dropdown-toggle.btn-secondary:is(:focus:not(:focus-visible), :active),
.o-counter.btn-group > .dropdown > .dropdown-toggle.btn-secondary:where(:focus:not(:focus-visible), :active) {
    background-image: url("data:image/svg+xml;utf8,<svg fill='%2300344d' width='16' height='16' viewBox='0 0 16 16' class='bi bi-caret-down-fill' xmlns='http://www.w3.org/2000/svg'><path d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/></svg>"), var(--btn-active-highlight);
    background-color: rgb(var(--pry-color));
    background-blend-mode: normal;
    box-shadow: var(--elevation-0);
    background-repeat: no-repeat, repeat;
    background-position: calc( 100% - 16px ) calc(50% + 0.065em), center left;
    background-size: 20px;
    padding: 0 16px 0 28px;
    border: 0;
}

/* Rating Banner */
.rating-banner {
    color: rgb(var(--white-color));
}
.rating-5 {
    background: #ff8893dd;
}
.rating-4 {
    background: #eb0002dd;
}
.rating-100-12,
.rating-3 {
    background: #a24000dd;
}
.rating-2 {
    background: #743e1cdd;
}
.rating-1 {
    background: #4e615ddd;
}

/* Star Outline */
button:where(.star-fill-100, .star-fill-90, .star-fill-80, .star-fill-75, .star-fill-70, .star-fill-60, .star-fill-50, .star-fill-40, .star-fill-30, .star-fill-30, .star-fill-25, .star-fill-20, .star-fill-10, .star-fill-0).minimal.btn.btn-secondary:not(:disabled):not(.disabled) {
    border: 0;
    box-shadow: none;
    outline: 0;
    color: rgb(var(--outline));
    filter: drop-shadow(0 0 0.22rem rgba(0,0,0,.45));
    transition: filter 0.25s, var(--trans-0);
}
button:where(.star-fill-100, .star-fill-90, .star-fill-80, .star-fill-75, .star-fill-70, .star-fill-60, .star-fill-50, .star-fill-40, .star-fill-30, .star-fill-30, .star-fill-25, .star-fill-20, .star-fill-10, .star-fill-0).minimal.btn.btn-secondary:not(:disabled):not(.disabled):hover {
    color: rgb(var(--outline));
    background-image: none;
    background-color: transparent;
    filter: none;
}
button:where(.star-fill-100, .star-fill-90, .star-fill-80, .star-fill-75, .star-fill-70, .star-fill-60, .star-fill-50, .star-fill-40, .star-fill-30, .star-fill-30, .star-fill-25, .star-fill-20, .star-fill-10, .star-fill-0).minimal.btn.btn-secondary:not(:disabled):not(.disabled):is(:focus, :active, :active:focus, .active, .active:focus) {
    color: rgb(var(--outline));
    background-image: none;
    background-color: rgb(var(--star-color),var(--btn-hover));
    box-shadow: var(--elevation-0);
    filter: none;
}
.detail-header.edit button:where(.star-fill-100, .star-fill-90, .star-fill-80, .star-fill-75, .star-fill-70, .star-fill-60, .star-fill-50, .star-fill-40, .star-fill-30, .star-fill-30, .star-fill-25, .star-fill-20, .star-fill-10, .star-fill-0).minimal.btn.btn-secondary:not(:disabled):not(.disabled):is(:focus, :active, :active:focus, .active, .active:focus) {
    background-image: linear-gradient(to right, rgb(var(--body-color2)), rgb(var(--body-color2)));
    background-blend-mode: screen;
}
button:where(.star-fill-100, .star-fill-90, .star-fill-80, .star-fill-75, .star-fill-70, .star-fill-60, .star-fill-50, .star-fill-40, .star-fill-30, .star-fill-30, .star-fill-25, .star-fill-20, .star-fill-10, .star-fill-0).minimal.btn.btn-secondary:is(.diabled, :disabled) {
    border: 0;
    box-shadow: none;
    outline: 0;
    color: rgb(var(--outline));
    opacity: var(--disabled);
}

button:where(.star-fill-100, .star-fill-90, .star-fill-80, .star-fill-75, .star-fill-70, .star-fill-60, .star-fill-50, .star-fill-40, .star-fill-30, .star-fill-30, .star-fill-25, .star-fill-20, .star-fill-10, .star-fill-0).minimal.btn.btn-secondary:not(:focus):not(:disabled):not(.disabled):focus-visible {
    outline-color: rgb(var(--focus-ring));
    outline-offset: -0.10rem;
    outline-style: solid;
    outline-width: 0.19rem;
    box-shadow: none;
}

.Lightbox > .Lightbox-footer > .Lightbox-footer-left > .rating-stars > button:where(.star-fill-100, .star-fill-90, .star-fill-80, .star-fill-75, .star-fill-70, .star-fill-60, .star-fill-50, .star-fill-40, .star-fill-30, .star-fill-30, .star-fill-25, .star-fill-20, .star-fill-10, .star-fill-0).minimal.btn.btn-secondary:not(:disabled):not(.disabled):is(:hover, :focus, :hover:focus) {
    color: white;
    opacity: 1;
    box-shadow: none;
}

.Lightbox > .Lightbox-footer > .Lightbox-footer-left > .rating-stars > button:where(.star-fill-100, .star-fill-90, .star-fill-80, .star-fill-75, .star-fill-70, .star-fill-60, .star-fill-50, .star-fill-40, .star-fill-30, .star-fill-30, .star-fill-25, .star-fill-20, .star-fill-10, .star-fill-0).minimal.btn.btn-secondary:not(:disabled):not(.disabled),
.Lightbox > .Lightbox-footer > .Lightbox-footer-left > .rating-stars > button:where(.star-fill-100, .star-fill-90, .star-fill-80, .star-fill-75, .star-fill-70, .star-fill-60, .star-fill-50, .star-fill-40, .star-fill-30, .star-fill-30, .star-fill-25, .star-fill-20, .star-fill-10, .star-fill-0).minimal.btn.btn-secondary:not(:disabled):not(.disabled):is(:active, .active, :active:focus, .active:focus) {
    color: white;
    opacity: 0.9;
    box-shadow: none;
}

.Lightbox > .Lightbox-footer > .Lightbox-footer-left > .rating-stars > button:where(.star-fill-100, .star-fill-90, .star-fill-80, .star-fill-75, .star-fill-70, .star-fill-60, .star-fill-50, .star-fill-40, .star-fill-30, .star-fill-30, .star-fill-25, .star-fill-20, .star-fill-10, .star-fill-0).minimal.btn.btn-secondary:not(:focus):not(:disabled):not(.disabled):focus-visible {
    color: white;
    opacity: 1;
    outline-color: rgb(var(--focus-ring));
    outline-offset: -0.10rem;
    outline-style: solid;
    outline-width: 0.19rem;
    box-shadow: none;
}

.Lightbox > .Lightbox-footer > .Lightbox-footer-left > .rating-stars > button:where(.star-fill-100, .star-fill-90, .star-fill-80, .star-fill-75, .star-fill-70, .star-fill-60, .star-fill-50, .star-fill-40, .star-fill-30, .star-fill-30, .star-fill-25, .star-fill-20, .star-fill-10, .star-fill-0).minimal.btn.btn-secondary:is(:disabled, .disabled) {
    color: white;
    opacity: var(--disabled);
}

.input-group>.input-group-append .btn:not(:first-child):not(.duration-button):last-child {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left: 0;
    padding: 28px 24px 28px;
}
.input-group>.input-group-append>.btn:not(:last-child):first-child {
    border-top-left-radius: 0.25rem;
    border-bottom-left-radius: 0.25rem;
}

#configuration-tabs-tabpane-metadata-providers .setting,
#configuration-tabs-tabpane-security .setting,
#configuration-tabs-tabpane-system .setting-section .setting,
#settings-dlna .setting-section .setting,
#configuration-tabs-tabpane-interface .setting-section .setting {
    padding-top:0; 
    padding-bottom:0
}
#configuration-tabs-tabpane-interface .setting-section .setting-group > .setting:not(:first-child) h3 {
    margin-left: 60px;
}

#configuration-tabs-tabpane-interface .setting-section .setting-group .setting>div:last-child {
    margin-right: 95% !important;
    margin-left:0px;
    margin-top:-32px;
}
#configuration-tabs-tabpane-interface .setting-section > .card > .setting {
    padding-top: 16px;
}
#configuration-tabs-tabpane-interface .setting-section:nth-of-type(4) > .card > .setting {
    padding-bottom: 1rem;
}
#configuration-tabs-tabpane-interface .setting-section > .card > #wall-preview.setting {
    padding-top: 1rem;
}
#configuration-tabs-tabpane-interface .setting-section > .card > .setting .custom-control,
#configuration-tabs-tabpane-metadata-providers .setting-section > .card > .setting .custom-control,
#configuration-tabs-tabpane-services .setting-section > .card > .setting .custom-control,
#configuration-tabs-tabpane-system .setting-section > .card > .setting .custom-control {
    margin-right: 30px;
}
#configuration-tabs-tabpane-interface .setting-section > .card > #lightbox_display_mode.setting {
    padding-bottom: 16px;
}
#configuration-tabs-tabpane-interface .setting-section > .card > #rating_system_star_precision.setting {
    padding-bottom: 30px;
}
.setting-section .setting > div:first-child {
    max-width: 415px
}
.setting-section .setting-group:not(:last-child) {
    border-bottom: 0;
    padding-bottom: 0;
}
.setting-section .setting-group:not(:last-child),
.setting-section:not(#configuration-tabs-tabpane-tasks .setting-section) .setting-group:not(:last-child) {
    border-bottom: 0;
    padding-bottom: 20px;
}
#configuration-tabs-tabpane-tasks .setting-section .setting-group:not(:last-child) {
    border-bottom: 1px solid rgb(var(--card-fold));
    margin-left: 1.375rem;
    width: calc(100% - 2.75rem);
}
#configuration-tabs-tabpane-tasks .setting-section .setting-group>.setting:has(>div+div>button.btn-danger+button.btn-danger):first-child,
#configuration-tabs-tabpane-tasks .setting-section .setting-group>.setting:has(>div+div>button#migrateBlobs) {
    padding-left: 0;
    padding-right: 0;
}

#configuration-tabs-tabpane-interface .setting-section .setting > div:last-child {
    min-width: 20px;
    text-align: left;
    width:38%; 
}
#configuration-tabs-tabpane-interface h3,
#configuration-tabs-tabpane-metadata-providers h3,
#configuration-tabs-tabpane-services h3,
#configuration-tabs-tabpane-system h3 {
    color: rgb(var(--on-tertiary),0.94);
}

#wall-preview .input-control {
    width: 160px
}

.setting-section .setting-group > .setting:not(:first-child), 
.setting-section .setting-group .collapsible-section .setting {
    margin-right: 3rem;
    line-height: 100%;
}
.setting-section .setting:not(:last-child) {
    border-bottom: 1px solid transparent;
}
#configuration-tabs-tabpane-interface .setting-section:nth-child(7) .setting {
    margin-left: 15px !important
}
#configuration-tabs-tabpane-interface .setting-section:nth-child(7) .setting:nth-child(1) {
    margin-left: 0px !important;
}

#configuration-tabs-tabpane-interface .setting-section:nth-child(10) > .card {
    padding-top: 16px;
    padding-bottom: 30px;
}

#configuration-tabs-tabpane-metadata-providers #stash-boxes .sub-heading {
    text-shadow: var(--light-txt-shadow);
    margin-top: 0%;
    margin-left: 0%;
}
#configuration-tabs-tabpane-metadata-providers #stash-boxes.setting-section > .card > .setting,
#configuration-tabs-tabpane-metadata-providers .setting-section > .card > #scraperUserAgent.setting {
    padding-top:16px;
}
#configuration-tabs-tabpane-metadata-providers #stash-boxes.setting-section > .card > .setting:nth-of-type(2) {
    padding-top: 0;
    padding-bottom: 30px;
}

/* Settings Page Scrapers-Buttons */
#configuration-tabs-tabpane-metadata-providers .setting-section > .card > .content button.minimal.collapse-button,
#configuration-tabs-tabpane-metadata-providers .setting-section > .card > .content button.minimal.collapse-button:focus {
    margin-top: 8px;
    margin-bottom: 8px;
    color: rgb(var(--on-pry-container));
    background-image: none;
    background-color: transparent;
    box-shadow: none;
}
#configuration-tabs-tabpane-metadata-providers .setting-section > .card > .content button.minimal.collapse-button:hover {
    color: rgb(var(--on-pry-container));
    background-image: var(--btn-hover-highlight);
    background-color: rgb(var(--pry-container));
    box-shadow: var(--elevation-0);
}
#configuration-tabs-tabpane-metadata-providers .setting-section > .card > .content button.minimal.collapse-button:is(:active, :active:focus) {
    color: rgb(var(--on-pry-container));
    background-image: var(--btn-active-highlight);
    background-color: rgb(var(--pry-container));
    box-shadow: none;
    outline: 0;
}

#configuration-tabs-tabpane-services #settings-dlna .setting-section .form-group .addresses .buttons button.btn.btn-primary {
    padding: 0;
    max-height: 48px;
    height: 48px;
    width: 48px;
    margin-left: 16px;
    border-radius: 5rem;
    font-size: 20px;
}

#configuration-tabs-tabpane-system .setting-section > .card > .setting:first-child {
    padding-top: 16px;
}

.setting:has(+.setting input#dlna-enabled-by-default) {
    padding-top: 1rem;
}

/* --- Library ---*/
.stash-row .col-md-2 {
    padding-left:4%
}
#configuration-tabs-tabpane-security .setting-section,
#configuration-tabs-tabpane-tasks .setting-section,
#configuration-tabs-tabpane-tasks .setting-group{
    max-width:915px;
}

#configuration-tabs-tabpane-logs .setting-section,
#configuration-tabs-tabpane-metadata-providers .setting-section,
#configuration-tabs-tabpane-services .setting-section,
#configuration-tabs-tabpane-system  .setting-section,
#configuration-tabs-tabpane-library .setting-section:not(:first-child),
#configuration-tabs-tabpane-interface .setting-section {
    max-width:810px;
}

#configuration-tabs-tabpane-security .setting-section .setting > div:last-child,
#configuration-tabs-tabpane-metadata-providers .setting-section .setting > div:last-child,
#configuration-tabs-tabpane-services .setting-section .setting > div:last-child,
#configuration-tabs-tabpane-system .setting-section .setting > div:last-child,
#configuration-tabs-tabpane-library .setting-section .setting > div:last-child,
#configuration-tabs-tabpane-interface .setting-section .setting > div:last-child,
#configuration-tabs-tabpane-tasks .setting-section .setting > div:last-child {
    min-width: 20px;
    text-align: right;
    width:auto;
}
#configuration-tabs-tabpane-tasks .setting-section .setting > div + div:has(>.custom-control>#clean-dryrun),
#configuration-tabs-tabpane-tasks .setting-section .setting > div + div:has(>.custom-control>#migrate-blobs-delete-old) {
    height: 0;
}
#configuration-tabs-tabpane-tasks .setting-section .setting:has(>div+div>button#import.btn-danger) {
    padding: 0 1.25rem;
}
#configuration-tabs-tabpane-tasks .setting-section .setting:has(>div+div>button#backup.btn-secondary),
#configuration-tabs-tabpane-tasks .setting-section .setting:has(>div+div>button#anonymise.btn-secondary),
#configuration-tabs-tabpane-tasks .setting-section .setting:has(>div+div>button#migrateHashNaming.btn-danger),
#configuration-tabs-tabpane-library .setting-section .setting#video-extensions,
#configuration-tabs-tabpane-library .setting-section .setting#excluded-video-patterns,
#configuration-tabs-tabpane-library .setting-section .setting:has(>div+div>.custom-control>input#create-galleries-from-folders) {
    padding: 1rem 1.25rem 0;
}
#configuration-tabs-tabpane-library .setting-section .setting#image-extensions,
#configuration-tabs-tabpane-library .setting-section .setting:has(>div+div>.custom-control>input#write-image-thumbnails),
#configuration-tabs-tabpane-library .setting-section .setting:has(>div+div>.custom-control>input#create-image-clips-from-videos) {
    padding: 0 1.25rem 0 1.25rem;
}
#configuration-tabs-tabpane-library .setting-section .setting#gallery-extensions,
#configuration-tabs-tabpane-library .setting-section .setting#excluded-image-gallery-patterns,
#configuration-tabs-tabpane-library .setting-section .setting:has(>div+div>.custom-control>input#delete-generated-default) {
    padding: 0 1.25rem 1rem 1.25rem;
}
#configuration-tabs-tabpane-library .setting-section .setting#gallery-cover-regex {
    border-top: 1px solid rgb(var(--card-fold));
    color: rgb(var(--on-tertiary));
    padding-top: 1rem;
    margin-left: 1.375rem;
    padding: 1rem 0 1rem 0;
    width: calc(100% - 2.75rem);
}
#configuration-tabs-tabpane-system .setting-section .sub-heading {
    margin-bottom: 1.2rem
}

#configuration-tabs-tabpane-library #stash-table .d-none.d-md-flex.row,
#configuration-tabs-tabpane-library .setting-section > .card > .setting > div > h3 {
    font-weight: 400;
    font-size: 22px;
    line-height: 30px;
    letter-spacing: 0.016em;
    font-family: var(--HeaderFont);
}

#configuration-tabs-tabpane-interface .setting-section > .card > .setting#language + .setting-group {
    border-bottom: 1px solid rgb(var(--card-fold));
    padding: 1rem 0 1rem 0;
    margin-left: 1.375rem;
    width: calc(100% - 2.75rem);
}
#configuration-tabs-tabpane-interface .setting-section >.card >.setting#language + .setting-group > .setting {
    padding-left: 0;
    padding-right: 0;
}

#configuration-tabs-tabpane-interface .setting-section > .card .setting:has(+ .setting#wall-preview),
#configuration-tabs-tabpane-interface .setting-section > .card .setting#ignore-interval {
    border-bottom: 1px solid rgb(var(--card-fold));
    padding: 1rem 0 1rem 0;
    margin-left: 1.375rem;
    width: calc(100% - 2.75rem);
}
#configuration-tabs-tabpane-interface .setting-section .setting#vr-tag {
    border: 1px solid rgb(var(--card-fold));
    border-left: 0;
    border-right: 0;
    padding: 1rem 0 1rem 0;
    margin-left: 1.375rem;
    width: calc(100% - 2.75rem);
}
#configuration-tabs-tabpane-system div#video-preview-settings.setting,
#configuration-tabs-tabpane-interface .setting-section > .card .setting:has(+.setting#vr-tag) {
    padding-bottom: 1rem;
}
.setting:has(>div+div>.custom-control>input#dlna-enabled-by-default),
#configuration-tabs-tabpane-interface .setting-section > .card #ignore-interval.setting + .setting,
#configuration-tabs-tabpane-interface .setting-section > .card > .setting:has(input#lightbox_reset_zoom_on_nav),
#configuration-tabs-tabpane-interface .setting-section > .card > .setting:has(input#disableDropdownCreate_movie) {
    border-bottom: 1px solid rgb(var(--card-fold));
    margin-left: 1.375rem;
    width: calc(100% - 2.75rem);
    padding: 1rem 0;
}
#configuration-tabs-tabpane-system div#blobs-storage,
#configuration-tabs-tabpane-interface .setting-section > .card .setting#max-loop-duration,
#configuration-tabs-tabpane-interface .setting-section > .card .setting:has(+.setting#max-loop-duration),
#configuration-tabs-tabpane-interface .setting-section > .card .setting:has(input#show_all_details),
#configuration-tabs-tabpane-interface .setting-section > .card > #rating_system.setting {
    border-top: 1px solid rgb(var(--card-fold));
    margin-left: 1.375rem;
    width: calc(100% - 2.75rem);
    padding: 1rem 0;
}
#configuration-tabs-tabpane-plugins .setting-section .card .setting > div > h3,
#configuration-tabs-tabpane-system .setting-section > .card .setting > div > h3,
#configuration-tabs-tabpane-services .setting-section > .card .setting > div > h3,
#configuration-tabs-tabpane-metadata-providers .setting-section > .card .setting > div > h3,
#configuration-tabs-tabpane-tasks .setting-section > .card .setting > div > h3,
#configuration-tabs-tabpane-library .setting-section > .card .setting > div > h3,
#configuration-tabs-tabpane-interface .setting-section > .card .setting > div > h3,
#configuration-tabs-tabpane-library #stash-table .d-none.d-md-flex.row h6 {
    color: rgb(var(--card-color2-text));
    font-size: 18.5px;
    font-weight: 400;
    line-height: 27px;
    letter-spacing: 0.033em;
}
#configuration-tabs-tabpane-tasks .setting-section > .card .setting:has(>div+div>button#optimiseDatabase) h3,
.setting:has(+.setting>div+div>.custom-control>input#clean-dryrun) h3,
.setting-group > .setting:has(+.collapsible-section>.setting>div+div>.custom-control>input#covers-task) > div > h3,
.setting-group > .setting:has(+ .collapsible-section>.setting>div+div>.custom-control>input#autotag-performers) > div > h3,
.setting-section:has(+.setting-section .setting-group>.setting+.collapsible-section>.setting>div+div>.custom-control>input#autotag-performers) .setting > div > h3,
.setting-group > .setting:has(+.collapsible-section>.setting>div+div>.custom-control>input#scan-generate-covers) > div > h3,
#configuration-tabs-tabpane-interface .setting-section > .card > div#language h3,
.setting:has(+.setting>div+div>.custom-control>input#menu-items-scenes) h3,
.setting:has(+.setting>div+div>.custom-control>input#enableMovieBackgroundImage) h3,
.setting:has(+.setting>div+div>.custom-control>input#disableDropdownCreate_performer) h3,
#configuration-tabs-tabpane-library .setting-section > .card > div:is(#video-extensions, #image-extensions, #gallery-extensions, #excluded-video-patterns, #excluded-image-gallery-patterns).setting h3 {
    color: #e5fefc;
    font-weight: 500;
    font-size: 26px;
    line-height: 32px;
    letter-spacing: 0.02em;
}
#configuration-tabs-tabpane-tasks .setting-section .setting-group > .setting:has(>div+div>button#migrateBlobs) {
    border-top: 1px solid rgb(var(--card-fold));
}
.setting:has(>div+div>.custom-control>input#dlna-enabled-by-default) h3 {
    padding-bottom: 0.5rem;
}
#configuration-tabs-tabpane-interface .setting:has(+div#rating_system),
#configuration-tabs-tabpane-interface .setting-section > .card > .setting:has(input#show-ab-loop),
#configuration-tabs-tabpane-interface .setting-section > .card > div#image_wall_direction.setting {
    padding-bottom: 1rem;
}
#configuration-tabs-tabpane-system div#transcode-input-args.setting,
#settings-dlna div#dlna-network-interfaces.setting,
#configuration-tabs-tabpane-security div#authentication-settings.setting,
#configuration-tabs-tabpane-interface .setting-section > .card .setting:has(+.setting>div+div>.custom-control>input#disableDropdownCreate_performer) {
    padding-top: 1rem;
}
#configuration-tabs-tabpane-security div#maxSessionAge.setting {
    padding-bottom: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgb(var(--card-fold));
}
div#excluded-tag-patterns.setting {
    border-top: 1px solid rgb(var(--card-fold));
    padding: 1rem 0;
    margin-left: 1.25rem;
    width: calc(100% - 2.75rem);
}
#settings-dlna div#video-sort-order.setting {
    padding-bottom: 1rem;
}
.setting:has(>div+div>.custom-control>input#hardware-encoding) {
    border: 1px solid rgb(var(--card-fold));
    border-width: 1px 0;
    padding: 1rem 0 0.25rem;
    margin-left: 1.25rem;
    width: calc(100% - 2.75rem);
}
div#configuration-tabs-tabpane-logs > h2 {
    color: #6fb0dd;
    text-shadow: var(--light-txt-shadow);
}

.setting>div+div>button.minimal.btn.btn-primary > a.link {
    color: rgb(var(--on-surface-variant));
}
.setting>div+div>button.minimal.btn.btn-primary > a.link:where(:hover, :active, :focus, :active:focus) {
    color: rgb(var(--link));
}
#configuration-tabs-tabpane-plugins .setting>div+div>button.minimal.btn.btn-primary:not(.disabled):not(:disabled):is(:hover, :focus-visible) {
    background-image: none;
    background-color: rgb(var(--link),var(--btn-hover));
    box-shadow: var(--elevation-0);
}
.#configuration-tabs-tabpane-plugins setting>div+div>button.minimal.btn.btn-primary:not(.disabled):not(:disabled):is(:active, :focus, :active:focus) {
    background-image: none;
    background-color: rgb(var(--link),var(--btn-active));
    box-shadow: none;
}
#configuration-tabs-tabpane-changelog .markdown li {
    color: rgb(var(--on-surface));
}
#configuration-tabs-tabpane-changelog .strong {
    color: #d7e4e4;
}

/* Buttons and Icons within Metadata Page */
.btn-primary > span.fa-icon > svg.fa-rotate {
    font-size: 22px;
}
button.collapse-button > svg:is(.fa-chevron-right, .fa-chevron-down).fa-icon {
    font-size: 20px;
}
.scraper-table button.btn.btn-link {
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
}
.package-manager .package-source .source-collapse .btn {
    color: rgb(var(--description-color));
    background-color: transparent;
    font-size: 20px;
    border-radius: 5rem;
    max-height: 32px;
    height: 32px;
    width: 32px;
    padding: 0;
    box-shadow: none;
    outline: 0;
    transition: var(--trans-0);
    -webkit-transition: var(--trans-0);
}
.package-manager .package-source .source-collapse .btn:hover {
    background-color: rgb(var(--description-color),var(--btn-hover));
    box-shadow: var(--elevation-0);
}
.package-manager .package-source .source-collapse .btn:where(:active, :focus, :active:focus) {
    background-color: rgb(var(--description-color),var(--btn-active));
    box-shadow: none;
    outline: 0;
}

#configuration-tabs-tabpane-services #settings-dlna ul.addresses li div.address > input.text-input.form-control, 
#configuration-tabs-tabpane-services #settings-dlna ul.addresses li div.address > input.text-input.form-control:focus {
    background-color: transparent !important;
}



a .TruncatedText:focus-visible {
    box-shadow: none;
    outline: none;
    text-decoration: solid underline;
}

/* Check for new version & Download buttons on About in Settings */
div#settings-container div#configuration-tabs-tabpane-about .card .setting div a button.btn-primary,
div#settings-container div#configuration-tabs-tabpane-about .card .setting div button.btn-primary,
div#settings-container div#configuration-tabs-tabpane-about .card .setting div a button.btn-primary:focus:not(:focus-visible),
div#settings-container div#configuration-tabs-tabpane-about .card .setting div button.btn-primary:focus:not(:focus-visible) {
    color: #dffffb;
    background-color: #32675e;
}
div#settings-container div#configuration-tabs-tabpane-about .card .setting div a button.btn-primary:hover,
div#settings-container div#configuration-tabs-tabpane-about .card .setting div button.btn-primary:hover {
    color: #dffffb;
    background-color: #38746a;
}
div#settings-container div#configuration-tabs-tabpane-about .card .setting div a button.btn-primary:focus-visible,
div#settings-container div#configuration-tabs-tabpane-about .card .setting div button.btn-primary:focus-visible {
    outline-color: #8249C2;
}
div#settings-container div#configuration-tabs-tabpane-about .card .setting div a button.btn-primary.active,
div#settings-container div#configuration-tabs-tabpane-about .card .setting div button.btn-primary:active,
div#settings-container div#configuration-tabs-tabpane-about .card .setting div a button.btn-primary.active:hover,
div#settings-container div#configuration-tabs-tabpane-about .card .setting div button.btn-primary:active:hover,
div#settings-container div#configuration-tabs-tabpane-about .card .setting div a button.btn-primary.active:focus,
div#settings-container div#configuration-tabs-tabpane-about .card .setting div button.btn-primary:active:focus {
    color: #dffffb;
    background-color: #3f8176;
}
#configuration-tabs-tabpane-about .setting-section .setting .value,
#configuration-tabs-tabpane-services .setting-section .setting .value,
#configuration-tabs-tabpane-services #settings-dlna ul.addresses {
    color: #cef1ff;
    font-size: small;
    font-variant-caps: all-small-caps;
}

#configuration-tabs-tabpane-tasks .tasks-panel-tasks .setting-section:nth-last-of-type(5) div h3:last-child {
    color: #c0ebe2;
    font-size: small;
    font-variant-caps: all-small-caps;
    margin-left: 30px;
    margin-top: 10px;
}
#configuration-tabs-tabpane-tasks .form-group:nth-of-type(2) .setting-section .setting>div:last-child .custom-control.custom-switch {
    margin-right: 70rem;
    left: -30px;
    bottom: 26px;
}

#configuration-tabs-tabpane-tasks .tasks-panel-tasks .form-group:nth-of-type(2) .setting-section:nth-of-type(5)>.card>.setting-group>.setting:nth-of-type(2) h3 {
    position: relative;
    left: 30px;
}
#configuration-tabs-tabpane-tasks .tasks-panel-tasks .form-group:nth-of-type(2) .setting-section:nth-of-type(5)>.card>.setting-group .setting:last-child h3 {
    position: relative;
    left: 30px;
}

.stash-row.align-items-center.row {
    padding: 4px 8px 4px 8px;
    background-color: transparent !important;
}

.stash-row.align-items-center.row .dropdown>button.minimal.dropdown-toggle.btn.btn-minimal {
    padding: 0 19px 0 19px;
}

@media (min-width: 576px) and (min-height: 600px) {
#tasks-panel .tasks-panel-queue {
    padding-top: 0;
    padding-bottom: 0;
    position: -webkit-sticky;
    position: sticky;
    top: 0;
    }
}

.scene-video-filter {
    padding-left: 0;
    padding-right: 0;
}

@media (min-width: 1200px) {
    .order-xl-2 {
        order: 0 !important;
    }
}
.navbar-buttons.flex-row.navbar-nav {
    align-items: center;
    min-height: 64px;
}

nav.top-nav.navbar .navbar-buttons a:is([href="/scenes/new"],[href="/galleries/new"],[href="/movies/new"],[href="/performers/new"],[href="/studios/new"],[href="/tags/new"]) > button.btn.btn-primary::before {
    content: "\FE62";
    font-family: var(--UnicodeFont);
    font-weight: 700;
    font-size: 62px;
    position: relative;
    top: -10.5px;
    left: 4px;
}
    /* Moves button to bottom right of screen */
nav.top-nav.navbar .navbar-buttons a:is([href="/scenes/new"],[href="/galleries/new"],[href="/movies/new"],[href="/performers/new"],[href="/studios/new"],[href="/tags/new"]) > button.btn.btn-primary {
    color: rgb(var(--on-tertiary-container));
    background-color: rgb(var(--tertiary-container));
    border: 0;
    border-radius: 16px;
    box-shadow: var(--elevation-5);
    height: 56px;
    min-height: 56px;
    width: max-content;
    font-weight: 700;
    overflow: hidden;
    position: fixed;
    z-index: 995590 !important;
    display: flex;
    gap: 8px;
    padding-right: 19px;
    padding-left: 6px;
    padding-top: 0;
    padding-bottom: 0;
    margin: 16px;
    right: 0%;
    bottom: 68px;
    will-change: animation, transition;
    transition: background-color 0.55s ease, background 0.55s ease, box-shadow 0.25s ease, outline 0.35s ease, opacity 0.55s ease;
    -webkit-transition: background-color 0.55s ease, background 0.55s ease, box-shadow 0.25s ease, outline 0.35s ease, opacity 0.55s ease;
}
nav.top-nav.navbar .navbar-buttons a:is([href="/scenes/new"],[href="/galleries/new"],[href="/movies/new"],[href="/performers/new"],[href="/studios/new"],[href="/tags/new"]) > button.btn.btn-primary:hover {
    color: rgb(var(--on-tertiary-container));
    background: linear-gradient(rgba(var(--on-tertiary-container),var(--btn-hover)) 0%, rgba(var(--on-tertiary-container),var(--btn-hover)) 100%), rgb(var(--tertiary-container));
    background-blend-mode: screen;
    box-shadow: var(--elevation-4);
    opacity: 1;
}
nav.top-nav.navbar .navbar-buttons a:is([href="/scenes/new"],[href="/galleries/new"],[href="/movies/new"],[href="/performers/new"],[href="/studios/new"],[href="/tags/new"]) > button.btn.btn-primary:is(:focus, :active) {
    color: rgb(var(--on-tertiary-container));
    background: linear-gradient(rgba(var(--on-tertiary-container),var(--btn-active)) 0%, rgba(var(--on-tertiary-container),var(--btn-active)) 100%), rgb(var(--tertiary-container));
    background-blend-mode: screen;
    box-shadow: var(--elevation-2);
    opacity: 1;
}
nav.top-nav.navbar .navbar-buttons a:is([href="/scenes/new"],[href="/galleries/new"],[href="/movies/new"],[href="/performers/new"],[href="/studios/new"],[href="/tags/new"]) > button.btn.btn-primary:focus {
    opacity: 1;
    animation: fadeout 0.05s linear 0s forwards;
}
nav.top-nav.navbar .navbar-buttons a:is([href="/scenes/new"],[href="/galleries/new"],[href="/movies/new"],[href="/performers/new"],[href="/studios/new"],[href="/tags/new"]) > button.btn.btn-primary:focus-visible {
    color: rgb(var(--on-tertiary-container));
    background: linear-gradient(rgba(var(--on-tertiary-container),var(--btn-hover)) 0%, rgba(var(--on-tertiary-container),var(--btn-hover)) 100%), rgb(var(--tertiary-container));
    background-blend-mode: screen;
    text-decoration: none !important;
    text-decoration-color: transparent !important;
    outline-color: rgb(var(--focus-ring));
    outline-style: solid;
    outline-width: 0.25rem;
    outline-offset: -1px;
    box-shadow: var(--elevation-5);
    border-radius: 16px;
}

#create-scene-page,
.movie-details.mb-3.col,
.col-md-6:has(>*#gallery-edit-details),
#performer-page,
.studio-details,
.tag-details:has(*#tag-edit) {
    animation: fadein 0.35s linear 0s forwards;
    will-change: animation;
}

@keyframes fadein {
    0% {
        background-color: rgb(var(--body-color2));
        opacity: 0;
    }
    80% {
        background-color: rgb(var(--body-color2));
        opacity: 0.5;
    }
    100% {
        background-color: transparent;
        opacity: 1;
    }
}
@keyframes fadeout {
    0% {
        opacity: 1;
        transform: scale(1) translate(0%, 0%);
    }
    100% { 
        opacity: 0.6;
        transform: scale(38) translate(-0.3%, -15%);
    }
}

/* --- Edit Tab --- */
.edit-buttons.mb-3.pl-0 {
    margin-bottom: 0 !important;
    align-items: flex-start;
    display: flex;
}
/* expands Text-Field to full width of container*/
.col-9 {
    flex: 1 0 100%;
    max-width: 100%;
}
.form-group .input-group>.input-group-append .react-datepicker__input-container > button.btn.btn-secondary {
    background: transparent;
    outline: none;
    box-shadow: none;
    border-radius: 5rem;
    border-style: none;
    border: 0 !important;
    color: rgb(var(--on-surface-variant));
    width: 40px;
    min-width: 40px;
    height: 40px;
    max-height: 40px;
    font-size: 24px;
    padding: 0;
}
.form-group .input-group>.input-group-append:last-child > button.scrape-url-button.btn:not(:last-child):not(.dropdown-toggle),
.form-group .input-group>.input-group-append > button.scrape-url-button.btn:not(.dropdown-toggle),
.form-group button.scrape-url-button:not(:disabled):not(.disabled):hover,
.form-group button.scrape-url-button:not(:disabled):not(.disabled):focus,
.form-group button.scrape-url-button:not(:disabled):not(.disabled):active,
.form-group button.scrape-url-button.active:not(:disabled):not(.disabled),
.form-group button.scrape-url-button:not(:disabled):not(.disabled):active:hover,
.form-group button.scrape-url-button.active:not(:disabled):not(.disabled):hover,
.form-group button.scrape-url-button:not(:disabled):not(.disabled):focus-visible {
    background: transparent;
    outline: none;
    box-shadow: none;
    top: 7px;
    left: -12px;
    padding: 0 14px;
    border-radius: 5rem;
    border-style: none;
    border: 0;
    color: #c0ebe2;
}
.form-group .input-group>.input-group-append .react-datepicker__input-container > button.btn.btn-secondary:hover,
.form-group .input-group>.input-group-append .react-datepicker__input-container > button.btn.btn-secondary:focus-visible,
.form-group .input-group>.input-group-append:last-child > button.scrape-url-button.btn:not(:last-child):not(.dropdown-toggle):not(:disabled):not(.disabled):hover,
.form-group .input-group>.input-group-append:last-child > button.scrape-url-button.btn:not(:last-child):not(.dropdown-toggle):not(:disabled):not(.disabled):focus,
.form-group .input-group>.input-group-append:last-child > button.scrape-url-button.btn:not(:last-child):not(.dropdown-toggle):not(:disabled):not(.disabled):focus-visible,
.form-group button.scrape-url-button.text-input.btn.btn-secondary:not(:disabled):not(.disabled):hover,
.form-group button.scrape-url-button.text-input.btn.btn-secondary:not(:disabled):not(.disabled):focus,
.form-group button.scrape-url-button.text-input.btn.btn-secondary:not(:disabled):not(.disabled):focus-visible {
    background-color: rgba(255,255,255, 0.08);
    box-shadow: none;
    text-shadow: none;
    outline: none;
}
.form-group .input-group>.input-group-append .react-datepicker__input-container > button.btn.btn-secondary:active,
.form-group .input-group>.input-group-append .react-datepicker__input-container > button.btn.btn-secondary.active,
.form-group .input-group>.input-group-append .react-datepicker__input-container > button.btn.btn-secondary:active:hover,
.form-group .input-group>.input-group-append .react-datepicker__input-container > button.btn.btn-secondary.active:hover,
.form-group .input-group>.input-group-append .react-datepicker__input-container > button.btn.btn-secondary:focus,
.form-group .input-group>.input-group-append:last-child > button.scrape-url-button.btn:not(:last-child):not(.dropdown-toggle):not(:disabled):not(.disabled):active,
.form-group .input-group>.input-group-append:last-child > button.scrape-url-button.btn:not(:last-child):not(.dropdown-toggle).active:not(:disabled):not(.disabled),
.form-group .input-group>.input-group-append:last-child > button.scrape-url-button.btn:not(:last-child):not(.dropdown-toggle):not(:disabled):not(.disabled):active:hover,
.form-group .input-group>.input-group-append:last-child > button.scrape-url-button.btn:not(:last-child):not(.dropdown-toggle):not(:disabled):not(.disabled):hover,
.form-group button.scrape-url-button.text-input.btn.btn-secondary:not(:disabled):not(.disabled):active,
.form-group button.scrape-url-button.text-input.btn.btn-secondary.active:not(:disabled):not(.disabled),
.form-group button.scrape-url-button.text-input.btn.btn-secondary:not(:disabled):not(.disabled):active:hover,
.form-group button.scrape-url-button.text-input.btn.btn-secondary:not(:disabled):not(.disabled):hover {
    background-color: rgba(255,255,255, 0.16);
    box-shadow: none;
    text-shadow: none;
    outline: none;
}
.form-group button.scrape-url-button.text-input.btn.btn-secondary:not(:disabled):not(.disabled):focus-visible,
.form-group .input-group>.input-group-append .react-datepicker__input-container > button.btn.btn-secondary:focus-visible {
    outline-color: #dffffb;
    outline-width: 0.14285714285714285rem;
    outline-style: solid;
    outline-offset: 0.21428571428571427rem;
}
.form-group button.scrape-url-button.text-input.btn.btn-secondary:disabled {
    background: transparent;
    color: #c0ebe2;
    opacity: 0.4;
}
/*#scene-edit-details .form-container .form-group:nth-of-type(-n+5) input.form-control {
    padding-left: 1.1428571428571428rem;
    padding-right: 1.1428571428571428rem;
}*/
#scene-edit-details .form-container .form-group input[placeholder="URL"].form-control {
    border-radius: 4px;
    padding-right: 120px;
    /*margin-top: -4.5%;*/
} 
#scene-edit-details .form-container .form-group:nth-of-type(4) input.form-control {
    border-radius: 4px;
    margin-right: -11%;
    padding-right: 64px;
}

#scene-edit-details .form-container .form-group input[placeholder="URL"].form-control:focus {
    padding-right: 120px;
}

#scene-edit-details .form-container .form-group:nth-of-type(-n+5) input.form-control::placeholder {
    font-size: 16px;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0.5px;
}

#scene-edit-details .form-container .form-group:nth-of-type(4) input.form-control:focus::placeholder {
    color: rgb(var(--on-surface-variant));
    visibility: visible;
}
/* general settings for Text-Field Labels */
/*#scene-edit-details .form-container .form-group:nth-of-type(-n+5) .col-form-label:not([for="urls"]):not([for="code"]):not([for="title"]),*/
/*#scene-edit-details .form-label[for="details"] {
    color: rgb(var(--pry-color));
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: 0.85px;
}*/
/*#scene-edit-details .form-container .form-group:nth-of-type(-n+5) .col-form-label:not([for="urls"]):not([for="code"]):not([for="title"]),*/
/*#scene-edit-details .form-label[for="details"] {
    visibility: hidden;
    padding: 0 0.2857142857142857rem 0.5714285714285714rem 0.2857142857142857rem;
    left: 28px;
    top: 17px;
    position: relative;
    background-color: transparent;
    z-index: 2;
}*/
/*#scene-edit-details .form-container .form-group:nth-of-type(-n+5) .col-form-label:not([for="urls"]):not([for="code"]):not([for="title"])::before,*/
/*#scene-edit-details .form-label[for="details"]::before {
    content: "";
    background-color: rgb(var(--body-color2));
    height: 3px;
    top: 7px;
    left: 0;
    position: absolute;
    z-index: -1;
}*/
#scene-edit-details .form-container .form-group:nth-of-type(-n+5) .col-form-label[for="date"]::before {
    top: 6px;
}
/*#scene-edit-details .form-label[for="details"]::before {
    top: 8px;
}*/
/*#scene-edit-details .form-container .form-group:nth-of-type(-n+5):focus-within .col-form-label:not([for="urls"]):not([for="code"]) {
    visibility: visible;
}*/
/* */
/*#scene-edit-details .form-container .form-group:first-of-type .col-form-label,*/
/*#scene-edit-details .col-form-label[for="title"],
#scene-edit-details .col-form-label[for="title"]::before {
    max-width: 2.4285714285714284rem;
    width: 2.4285714285714284rem;
}*/
/*#scene-edit-details .form-container .form-group:nth-of-type(2) .col-form-label,*/
/*#scene-edit-details .col-form-label[for="code"],
#scene-edit-details .col-form-label[for="code"]::before {
    max-width: 5.571428571428571rem;
    width: 5.571428571428571rem;
}*/
/*#scene-edit-details .form-container .form-group:nth-of-type(3) .col-form-label[for="urls"]::before,*/
#movie-edit .form-group:nth-of-type(7) .col-form-label[for="url"]::before {
    content: "";
    background-color: rgb(var(--body-color2));
    height: 6px;
    top: 6px;
    left: 0;
    position: absolute;
    z-index: -1;
}
/*#scene-edit-details .form-container .form-group:nth-of-type(3):focus-within .col-form-label,*/
/*#scene-edit-details .form-container .form-group:nth-of-type(3):focus-within .col-form-label[for="urls"],*/
#movie-edit .form-group:nth-of-type(7):focus-within .col-form-label[for="url"] {
    visibility: visible;
}

/* Scene-Edit-Details URL's Input-Append */
#scene-edit-details > form > .form-container + .form-container .form-group.row:nth-of-type(3) .string-list-input > .form-group > .input-group > input[placeholder="URL"].text-input.form-control + .input-group-append {
    display: flex;
    margin-left: unset;
    margin-left: 70%;
    margin-right: auto;
    position: absolute;
    margin-bottom: -10%;
    padding-right: 12px;
    z-index: 2;
    column-gap: 12px;
    top: 7px;
    right: 0%;
}
#scene-edit-details > form > .form-container + .form-container .form-group.row:nth-of-type(3) .string-list-input > .form-group > .input-group > input[placeholder="URL"].text-input.form-control + .input-group-append > button.scrape-url-button.text-input.btn.btn-secondary {
    padding: unset;
    top: 0%;
    left: 1%;
    width: 40px;
    height: 40px;
    font-size: 24px;
}
#scene-edit-details > form > .form-container + .form-container .form-group.row:nth-of-type(3) .string-list-input > .form-group > .input-group > input[placeholder="URL"].text-input.form-control + .input-group-append > button.scrape-url-button.text-input.btn.btn-secondary + button.btn.btn-danger {
    padding: unset;
    border-radius: 5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin-left: 0%;
    margin-right: 0%;
    width: 40px;
    height: 40px;
    font-size: 24px;
}
/*#scene-edit-details .form-container .form-group:nth-of-type(3) .col-form-label,*/
/*#scene-edit-details .col-form-label[for="urls"],*/
#movie-edit .col-form-label[for="url"] {
    visibility: hidden;
    left: 12px;
    top: 8px;
    padding: 0 4px 0 4px !important;
    position: relative;
    background-color: transparent;
    z-index: 12009;
}
#create-scene-page .col-form-label[for="urls"] {
    top: 10px;
}
/*#scene-edit-details .form-container .form-group:nth-of-type(3) .col-form-label::before,*/
/*#scene-edit-details .col-form-label[for="urls"],
#scene-edit-details .col-form-label[for="urls"]::before {
    max-width: 37px;
    width: 37px;
}*/
#movie-edit .col-form-label[for="url"],
#movie-edit .col-form-label[for="url"]::before {
    max-width: 31px;
    width: 31px;
}
/*#scene-edit-details .form-container .form-group:nth-of-type(4) .col-form-label,*/
#scene-edit-details .col-form-label[for="date"],
#scene-edit-details .col-form-label[for="date"]::before {
    max-width: 2.5rem;
    width: 2.5rem;
}
/*#scene-edit-details .form-container .form-group:nth-of-type(5) .col-form-label,*/
/*#scene-edit-details .col-form-label[for="director"],
#scene-edit-details .col-form-label[for="director"]::before {
    max-width: 3.857142857142857rem;
    width: 3.857142857142857rem;
}*/
/*#scene-edit-details .form-label[for="details"] {
    left: 12px !important;
    top: 15px !important;
    padding: 0 4px 0 4px !important;
    visibility: visible !important;
    color: #c0ebe2 !important;
}
#scene-edit-details .form-label[for="details"],
#scene-edit-details .form-label[for="details"]::before {
    max-width: 48px;
    width: 48px;
}*/

#scene-edit-details .col-form-label[for="rating"] {
    top: 0.42857142857142855rem;
}
#scene-edit-details .form-container .form-group:nth-of-type(6) .col-9:has(>*.rating-stars) {
    flex-basis: 75%;
    max-width: 75%;
}
#scene-edit-details .form-container .form-group:has(>.col-9 .is-invalid) .col-form-label {
    color: #93000a;
}
/* Labels of React-Combo-Boxs */
#scene-edit-details .form-container .form-group:nth-of-type(n+6) .col-form-label {
    display: flex;
    padding-bottom: 0.2857142857142857rem;
    padding-left: 2.142857142857143rem;
    font-size: 0.8571428571428571rem;
    font-weight: 400;
    line-height: 1.1428571428571428rem;
    letter-spacing: 0.028571428571428574rem;
}
/* StashID's if installed */
#scene-edit-details .form-label[for="stash_ids"],
#scene-edit-details .form-label[for="cover"] {
    padding-bottom: 0.2857142857142857rem;
    font-size: 0.8571428571428571rem;
    font-weight: 400;
    line-height: 1.1428571428571428rem;
    letter-spacing: 0.028571428571428574rem;
    padding-top: 0.42857142857142855rem;
    margin-bottom: 0;
}
#scene-edit-details .form-container .form-group:nth-last-of-type(2) label.form-label:not([for="details"]) {
    padding-left: 2.142857142857143rem;
}
#scene-edit-details .form-label[for="stash_ids"] {
    position: relative;
    left: 16px;
    top: 22px;
}
#scene-edit-details .form-label[for="cover"] {
    padding-left: 1.1428571428571428rem;
    position: relative;
    left: -2px;
    top: 10px;
}
#scene-edit-details .form-container .form-group:has(>*.form-label[for="stash_ids"]) {
    margin-top: -10px;
}
#scene-edit-details .form-container .form-group:nth-of-type(12) ul.pl-0 {
    margin-bottom: 0;
    padding-left: 0 !important;
}

/* Scene Editor React-Select Input */
#scene-edit-details .form-container .form-group:nth-last-of-type(-n + 6) div.react-select__control {
    margin-top: 13px;
}
    /* label */
#scene-edit-details .form-container .form-group:nth-last-of-type(-n +6):has(* div.react-select__control) label.form-label.col-form-label {
    visibility: visible;
    color: rgb(var(--on-surface-variant));
    margin-left: 16px;
}
/*.form-container.row.px-3:not(.pt-3) {
    padding-top: 1.7142857142857142rem;
    padding-left: 0.8571428571428571rem !important;
    padding-right: 0.8571428571428571rem !important;
    padding-bottom: 1.7142857142857142rem;
    border-radius: 28px;
    background-color: rgb(var(--body-color2));
    margin-left: 0.8571428571428571rem;
    margin-right: 0.8571428571428571rem;
    padding-left: 0 !important;
    padding-right: 0 !important;
}*/
.gallery-tabs .tab-content .tab-pane:nth-of-type(4)>#gallery-edit-details .form-container.row.px-3.pt-3 {
    padding-bottom: 16px;
    background-color: transparent;
}
/*.details-list dd:nth-of-type(10)::after {
    content: "StashID";
    float: left;
    left: -24.714285714285715rem;
    color: #00dfc6;
    position: relative;
    font-size: 0.8571428571428571rem;
    font-weight: 400;
    line-height: 1.1428571428571428rem;
    letter-spacing: 0.028571428571428574rem;
    top: 0.07142857142857142rem;
    padding-left: 0.2857142857142857rem;
    padding-right: 0.2857142857142857rem;
    background-color: #254e46;
    visibility: hidden;
    z-index: 2;
    transition: visibility 0.3s ease;
}
.details-list dd:nth-of-type(10):focus-within::after {
    visibility: visible;
}*/
/* StashIds */
/*#studio-stashids.row::after {
    content: "StashID";
    left: 14px;
    color: #c0ebe2;
    position: relative;
    font-size: 0.8571428571428571rem;
    font-weight: 400;
    line-height: 1.1428571428571428rem;
    letter-spacing: 0.028571428571428574rem;
    top: -200px;
    padding-left: 0.2857142857142857rem;
    padding-right: 0.2857142857142857rem;
    background-color: #254e46;
    z-index: 2;
    transition: color 0.2s ease-in-out;
}
#studio-stashids.row:focus-within::after {
    color: #00dfc6;
}*/
#studio-stashids input#update-stashids {
    margin-bottom: 0.8571428571428571rem;
}
#studio-stashids #update-stashids-endpoint.from-control {
    margin-bottom: 0.8571428571428571rem;
}
#studio-stashids #update-stashids-endpoint.input-control.form-control {
    margin-bottom: 0.7142857142857143rem;
    min-width: 140px;
}
#studio-stashids button[title="Copy to clipboard"].btn>svg.svg-inline--fa>path,
#studio-stashids button[title="Download studio image and set parent studio"].btn>svg.svg-inline--fa>path,
button[title="Copy to clipboard"].btn.btn-secondary.btn-sm.minimal.ml-1>svg.svg-inline--fa>path {
    fill: #a8dfd4;
}
input#update-stashids {
    background-color: transparent !important;
    border: 0 !important;
    border-style: none;
    border-radius: 0.5rem;
    box-shadow: 0 0 0 0.07142857142857142rem #899390, inset 0 0 0 0.07142857142857142rem transparent;
    transition: box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
input#update-stashids:hover {
    box-shadow: 0 0 0 0.07142857142857142rem #bec9c5, 0 0 0 0.07142857142857142rem transparent;
}
input#update-stashids:focus,
input#update-stashids:active {
    background-color: transparent !important;
    border: 0 !important;
    border-style: none;
    box-shadow: 0 0 0 0.07142857142857142rem #00dfc6, inset 0 0 0 0.07142857142857142rem #00dfc6;
    outline: none;
}
input#update-stashids::placeholder {
    color: #6a7573;
}
.details-list dd:nth-of-type(9) .btn.btn-secondary.btn-sm.minimal {
    top: -0.7142857142857143rem;
    position: relative;
    padding: 0.5714285714285714rem 1.0714285714285714rem;
}
/* Performer Labels */
@media (min-width: 576px) {
    .col-sm-9 {
        flex: 0 0 100%;
        max-width: 100%;
    }
}
#performer-edit .form-group .col-form-label,
#tag-edit .form-group .col-form-label,
#studio-edit .form-group .col-form-label,
#gallery-edit-details .form-group .col-form-label {
    position: relative;
    color: #00dfc6;
    font-size: 0.8571428571428571rem;
    font-weight: 400;
    line-height: 1.1428571428571428rem;
    letter-spacing: 0.028571428571428574rem;
    transition: color 0.15s ease-in-out;
} 
#performer-edit .form-group:nth-of-type(-n+23):not(:nth-of-type(4)):not(:nth-of-type(7)):not(:nth-of-type(14)) .col-form-label {
    visibility: hidden;
    padding: 0 0.2857142857142857rem 0 0.2857142857142857rem;
    left: 2.0714285714285716rem;
    top: 0.5714285714285714rem;
    background-color: transparent;
    z-index: 33;
}
#performer-edit .form-group:nth-of-type(-n+23):not(:nth-of-type(4)):not(:nth-of-type(7)):not(:nth-of-type(14)) .col-form-label::before {
    content: "";
    background-color: rgb(var(--body-color2));
    height: 4px;
    top: 7px;
    left: 0;
    position: absolute;
    z-index: -1;
}
#performer-edit .form-group:nth-of-type(4) select.input-control.form-control[name="gender"] {
    background-position: calc( 100% - 18px ) center;
}

.new-view#performer-page #performer-edit .form-group:nth-of-type(-n+23):not(:nth-of-type(4)):not(:nth-of-type(7)):not(:nth-of-type(14)) .col-form-label::before {
    background-color: rgb(var(--body-color2));
}
#performer-edit .form-group:nth-of-type(1) .col-form-label,
#performer-edit .col-form-label[for="name"]::before {
    max-width: 3rem;
    width: 3rem;
}
#performer-edit .form-group:nth-of-type(2) .col-form-label,
#performer-edit .col-form-label[for="disambiguation"]::before {
    max-width: 7rem;
    width: 7rem;
}
#performer-edit .row.form-group:nth-of-type(3):not(:nth-of-type(4)):not(:nth-of-type(7)):not(:nth-of-type(14)) .col-form-label,
#performer-edit .col-form-label[for="aliases"]::before {
    color: #c0ebe2;
    max-width: 3.4285714285714284rem;
    width: 3.4285714285714284rem;
    visibility: visible;
}
#performer-edit .row.form-group:nth-of-type(5):not(:nth-of-type(4)):not(:nth-of-type(7)):not(:nth-of-type(14)) .col-form-label,
#performer-edit .col-form-label[for="birthdate"]::before {
    color: #c0ebe2;
    max-width: 4.285714285714286rem;
    width: 4.285714285714286rem;
    visibility: visible;
}
#performer-edit .row.form-group:nth-of-type(6):not(:nth-of-type(4)):not(:nth-of-type(7)):not(:nth-of-type(14)) .col-form-label,
#performer-edit .col-form-label[for="death_date"]::before {
    color: #c0ebe2;
    max-width: 5.142857142857143rem;
    width: 5.142857142857143rem;
    visibility: visible;
}
#performer-edit .form-group:nth-of-type(8) .col-form-label,
#performer-edit .col-form-label[for="ethnicity"]::before {
    max-width: 4.142857142857143rem;
    width: 4.142857142857143rem;
}
#performer-edit .form-group:nth-of-type(9) .col-form-label,
#performer-edit .col-form-label[for="hair_color"]::before {
    max-width: 4.714285714285714rem;
    width: 4.714285714285714rem;
}
#performer-edit .form-group:nth-of-type(10) .col-form-label,
#performer-edit .col-form-label[for="eye_color"]::before {
    max-width: 4.428571428571429rem;
    width: 4.428571428571429rem;
}
#performer-edit .form-group:nth-of-type(11) .col-form-label,
#performer-edit .col-form-label[for="height_cm"]::before {
    max-width: 5.428571428571429rem;
    width: 5.428571428571429rem;
}
#performer-edit .form-group:nth-of-type(12) .col-form-label,
#performer-edit .col-form-label[for="weight"]::before {
    max-width: 5.285714285714286rem;
    width: 5.285714285714286rem;
}
#performer-edit .form-group:nth-of-type(13) .col-form-label,
#performer-edit .col-form-label[for="penis_length"]::before {
    max-width: 112px;
    width: 112px;
}
#performer-edit .form-group:nth-of-type(15) .col-form-label,
#performer-edit .col-form-label[for="measurements"]::before {
    max-width: 6.571428571428571rem;
    width: 6.571428571428571rem;
}
#performer-edit .form-group:nth-of-type(16) .col-form-label,
#performer-edit .col-form-label[for="fake_tits"]::before {
    max-width: 4.285714285714286rem;
    width: 4.285714285714286rem;
}
#performer-edit .form-group:nth-of-type(17) .col-form-label,
#performer-edit .col-form-label[for="tattoos"]::before {
    max-width: 3.5714285714285716rem;
    width: 3.5714285714285716rem;
}
#performer-edit .form-group:nth-of-type(18) .col-form-label,
#performer-edit .col-form-label[for="piercings"]::before {
    max-width: 4.285714285714286rem;
    width: 4.285714285714286rem;
}
#performer-edit .form-group:nth-of-type(19) .col-form-label,
#performer-edit .col-form-label[for="career_length"]::before {
    max-width: 6.357142857142857rem;
    width: 6.357142857142857rem;
}
#performer-edit .form-group:nth-of-type(20) .col-form-label,
#performer-edit .col-form-label[for="url"]::before {
    max-width: 2.2142857142857144rem;
    width: 2.2142857142857144rem;
}
#performer-edit .form-group:nth-of-type(21) .col-form-label,
#performer-edit .col-form-label[for="twitter"]::before {
    max-width: 3.357142857142857rem;
    width: 3.357142857142857rem;
}
#performer-edit .form-group:nth-of-type(22) .col-form-label,
#performer-edit .col-form-label[for="instagram"]::before {
    max-width: 4.642857142857143rem;
    width: 4.642857142857143rem;
}
#performer-edit .form-group:nth-of-type(23) .col-form-label,
#performer-edit .col-form-label[for="details"]::before {
    max-width: 3.357142857142857rem;
    width: 3.357142857142857rem;
}
#performer-edit .form-group:focus-within:nth-of-type(-n+23):not(:nth-of-type(4)):not(:nth-of-type(7)):not(:nth-of-type(14)) .col-form-label {
    color: #00dfc6;
    visibility: visible;
}
.new-view#performer-page #performer-edit .form-group:nth-of-type(1):has(.is-invalid) label.form-label.col-form-label {
    color: #93000a;
}

/* Labels of React-Combo-Boxs */
#performer-edit .form-group:nth-of-type(4) .col-form-label,
#performer-edit .form-group:nth-of-type(7) .col-form-label,
#performer-edit .form-group:nth-of-type(14) .col-form-label,
#performer-edit .col-form-label[for="tags"],
#performer-edit .col-form-label[for="ignore-auto-tag"],
#performer-edit .row:not(.form-group):has(*[title="Delete StashID"]) .col-form-label {
    color: #c0ebe2;
    display: flex;
    padding-bottom: 0.2857142857142857rem;
    padding-left: 2.0714285714285716rem;
    font-size: 0.8571428571428571rem;
    font-weight: 400;
    line-height: 1.1428571428571428rem;
    letter-spacing: 0.028571428571428574rem;
}
#performer-edit .col-form-label[for="ignore-auto-tag"] {
    left: 24px;
    top: 23px;
}
#performer-edit .form-group .col-auto {
    width: 100%;
}
#performer-edit .form-group:nth-of-type(3) .string-list-input .input-group button.btn.btn-danger,
#tag-edit .form-group:nth-of-type(2) .string-list-input .input-group button.btn.btn-danger,
#studio-edit .form-group .string-list-input .input-group .input-group-append button.btn.btn-danger {
    top: 1.1071428571428572rem;
    right: 18px;
    width: 1.7142857142857142rem;
    max-width: 1.7142857142857142rem;
    height: 1.7142857142857142rem;
    padding: 0.03571428571428571rem 0 0 0;
    border-radius: 5rem;
    border: 0.14285714285714285rem solid rgb(var(--on-surface-variant));
    background-color: transparent;
    color: rgb(var(--error));
}
#performer-edit .form-group:nth-of-type(3) .string-list-input .input-group button.btn.btn-danger:not(:disabled):not(.disabled):hover,
#performer-edit .form-group:nth-of-type(3) .string-list-input .input-group button.btn.btn-danger:not(:disabled):not(.disabled):focus,
#tag-edit .form-group:nth-of-type(2) .string-list-input .input-group button.btn.btn-danger:not(:disabled):not(.disabled):hover,
#tag-edit .form-group:nth-of-type(2) .string-list-input .input-group button.btn.btn-danger:not(:disabled):not(.disabled):focus,
#studio-edit .form-group .string-list-input .input-group .input-group-append button.btn.btn-danger:not(:disabled):not(.disabled):hover,
#studio-edit .form-group .string-list-input .input-group .input-group-append button.btn.btn-danger:not(:disabled):not(.disabled):focus {
    border-color: #c0ebe2;
    color: #c0ebe2;
    background-color: rgba(255,255,255,0.15);
}
#performer-edit .form-group:nth-of-type(3) .string-list-input .input-group button.btn.btn-danger:not(:disabled):not(.disabled):active,
#performer-edit .form-group:nth-of-type(3) .string-list-input .input-group button.btn.btn-danger:not(:disabled):not(.disabled).active,
#performer-edit .form-group:nth-of-type(3) .string-list-input .input-group button.btn.btn-danger:not(:disabled):not(.disabled):active:hover,
#performer-edit .form-group:nth-of-type(3) .string-list-input .input-group button.btn.btn-danger:not(:disabled):not(.disabled).active:hover,
#performer-edit .form-group:nth-of-type(3) .string-list-input .input-group button.btn.btn-danger:not(:disabled):not(.disabled):active:focus,
#performer-edit .form-group:nth-of-type(3) .string-list-input .input-group button.btn.btn-danger:not(:disabled):not(.disabled).active:focus,
#tag-edit .form-group:nth-of-type(2) .string-list-input .input-group button.btn.btn-danger:not(:disabled):not(.disabled):active,
#tag-edit .form-group:nth-of-type(2) .string-list-input .input-group button.btn.btn-danger:not(:disabled):not(.disabled).active,
#tag-edit .form-group:nth-of-type(2) .string-list-input .input-group button.btn.btn-danger:not(:disabled):not(.disabled):active:hover,
#tag-edit .form-group:nth-of-type(2) .string-list-input .input-group button.btn.btn-danger:not(:disabled):not(.disabled).active:hover,
#tag-edit .form-group:nth-of-type(2) .string-list-input .input-group button.btn.btn-danger:not(:disabled):not(.disabled):active:focus,
#tag-edit .form-group:nth-of-type(2) .string-list-input .input-group button.btn.btn-danger:not(:disabled):not(.disabled).active:focus,
#studio-edit .form-group .string-list-input .input-group .input-group-append button.btn.btn-danger:not(:disabled):not(.disabled):active,
#studio-edit .form-group .string-list-input .input-group .input-group-append button.btn.btn-danger:not(:disabled):not(.disabled).active,
#studio-edit .form-group .string-list-input .input-group .input-group-append button.btn.btn-danger:not(:disabled):not(.disabled):active:hover,
#studio-edit .form-group .string-list-input .input-group .input-group-append button.btn.btn-danger:not(:disabled):not(.disabled).active:hover,
#studio-edit .form-group .string-list-input .input-group .input-group-append button.btn.btn-danger:not(:disabled):not(.disabled):active:focus,
#studio-edit .form-group .string-list-input .input-group .input-group-append button.btn.btn-danger:not(:disabled):not(.disabled).active:focus {
    border-color: #c0ebe2;
    color: #c0ebe2;
    background-color: rgba(255,255,255,0.23);
}
#performer-edit .form-group:nth-of-type(3) .string-list-input .input-group button.btn.btn-danger:not(:disabled):not(.disabled):focus-visible,
#tag-edit .form-group:nth-of-type(2) .string-list-input .input-group button.btn.btn-danger:not(:disabled):not(.disabled):focus-visible,
#studio-edit .form-group .string-list-input .input-group .input-group-append button.btn.btn-danger:not(:disabled):not(.disabled):focus-visible {
    border-color: #c0ebe2;
    color: #c0ebe2;
    background-color: rgba(255,255,255,0.15);
}
#performer-edit .form-group:nth-of-type(3) .string-list-input .input-group:not(.has-validation)>.form-control:not(:last-child),
#tag-edit .form-group:nth-of-type(2) .string-list-input .input-group:not(.has-validation)>.form-control:not(:last-child),
#studio-edit .form-group .string-list-input .input-group:not(.has-validation)>.form-control:not(:last-child) {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    margin-right: -1.7142857142857142rem;
    padding-right: 3.7142857142857144rem;
}
.studio-details #studio-edit .form-group:nth-of-type(2) .string-list-input .input-group:not(.has-validation)>.form-control:not(:last-child) {
    margin-right: -34px;
    margin-left: -10px;
}
#performer-edit .form-group:nth-of-type(5) .input-group.has-validation>#birthdate.form-control,
#performer-edit .form-group:nth-of-type(6) .input-group.has-validation>#death_date.form-control,
#gallery-edit-details .form-group:nth-of-type(3) .input-group.has-validation>#date.form-control,
#movie-edit .form-group:nth-of-type(4) .input-group.has-validation>#date.form-control,
#image-edit-details .form-group:nth-of-type(3) .input-group.has-validation>#date.form-control {
    border-radius: 4px;
    margin-right: -40px;
    padding-right: 64px;
}
#performer-edit .form-group:nth-of-type(5) .input-group.has-validation>#birthdate.form-control:focus::placeholder,
#performer-edit .form-group:nth-of-type(5) .input-group.has-validation>#birthdate.form-control:active::placeholder,
#performer-edit .form-group:nth-of-type(6) .input-group.has-validation>#death_date.form-control:focus::placeholder,
#performer-edit .form-group:nth-of-type(6) .input-group.has-validation>#death_date.form-control:active::placeholder,
#gallery-edit-details .form-group:nth-of-type(3) .input-group.has-validation>#date.form-control:focus:placeholder,
#gallery-edit-details .form-group:nth-of-type(3) .input-group.has-validation>#date.form-control:active:placeholder,
#movie-edit .form-group:nth-of-type(4) .input-group.has-validation>#date.form-control:focus:placeholder,
#movie-edit .form-group:nth-of-type(4) .input-group.has-validation>#date.form-control:active:placeholder,
#image-edit-details .form-group:nth-of-type(3) .input-group.has-validation>#date.form-control:focus:placeholder,
#image-edit-details .form-group:nth-of-type(3) .input-group.has-validation>#date.form-control:active:placeholder {
    visibility: visible;
}
#performer-edit .form-group:nth-of-type(20) .input-group:not(.has-validation)>#url.form-control:not(:last-child),
#gallery-edit-details .form-group:nth-of-type(2) .input-group:not(.has-validation)>#url.form-control:not(:last-child),
#movie-edit .form-group:nth-of-type(n+1) .input-group:not(.has-validation)>#url.form-control:not(:last-child) {
    border-radius: 4px;
    margin-right: -40px;
    padding-right: 64px;
}
#image-edit-details .form-group:nth-of-type(2) .input-group:not(.has-validation)>#url.form-control:not(:last-child) {
    border-radius: 4px;
    margin-right: -40px;
    padding-right: 64px;
}
.form-container .form-group:nth-of-type(3):focus-within input.form-control,
.form-container .form-group:nth-of-type(4):focus-within input.form-control,
.form-group:focus-within .input-group.has-validation>input#death_date,
.form-group:focus-within .input-group.has-validation>input#birthdate,
.form-group:focus-within .input-group.has-validation>input#date,
.form-group:focus-within .string-list-input .input-group:not(.has-validation)>.form-control,
.form-group:focus-within .input-group:not(.has-validation)>#url.form-control {
    box-shadow: inset 0 0 0 1px rgb(var(--pry-color));
    border: 1px solid rgb(var(--pry-color));
}

#performer-edit .form-group:has(>div .form-check .form-check-input[value="true"]) label.form-label.col-form-label[for="ignore-auto-tag"] {
    color: #00dfc6;
}

/* Tag Editor */
form#tag-edit {
    /*background-color: #414846;*/
    border-radius: 1rem;
    padding-left: 16px;
    padding-right: 16px;
    padding-bottom: 6px;
    padding-top: 6px;
}
@media (min-width: 576px) {
    .col-sm-3:has(>*:not(.nav-pills)) {
        flex: 0 0 35%;
        max-width: 35%;
    }
}
#tag-edit .form-group:nth-of-type(-n+3) .col-form-label {
    visibility: hidden;
    padding: 0 0.2857142857142857rem 0 0.2857142857142857rem;
    left: 2.0714285714285716rem;
    top: 0.5714285714285714rem;
    background-color: rgb(var(--body-color2));
    z-index: 33;
}
#tag-edit .form-group:nth-of-type(1) .col-form-label {
    max-width: 2.857142857142857rem;
}
#tag-edit .form-group:nth-of-type(2) .col-form-label {
    max-width: 3.4285714285714284rem;
    visibility: visible;
    color: #c0ebe2;
}
#tag-edit .form-group:nth-of-type(3) .col-form-label {
    max-width: 5.142857142857143rem;
}
#tag-edit .form-group:nth-of-type(-n+3):focus-within .col-form-label {
    color: #00dfc6;
    visibility: visible;
}
#tag-edit .form-group:has(>.col-9 .is-invalid) .col-form-label {
    color: #93000a;
}
#image-edit-details .form-group .col-form-label,
#tag-edit .form-group:nth-of-type(n+4) .col-form-label,
#studio-edit>.row:not(.form-group)>.col-form-label,
.studio-details>.form-group>.col-form-label {
    color: #c0ebe2;
    display: flex;
    padding-bottom: 0.2857142857142857rem;
    padding-left: 2.0714285714285716rem;
    font-size: 0.8571428571428571rem;
    font-weight: 400;
    line-height: 1.1428571428571428rem;
    letter-spacing: 0.028571428571428574rem;
}
#tag-edit .form-group:last-of-type .col-form-label[for="ignore-auto-tag"] {
    max-width: 10rem;
    flex-basis: 10rem;
    top: 1.7142857142857142rem;
    right: -24px;
}
#tag-edit .form-group:has(input#ignore-auto-tag[value="true"]) .form-label.col-form-label[for="ignore-auto-tag"] {
    color: #00dfc6;
}



/* Studio Editor */
form#studio-edit {
    margin-top: 24px;
    /*background-color: #414846;*/
    border-radius: 1rem;
}

#studio-edit .form-group:nth-of-type(-n+3) .col-form-label,
#studio-edit .form-group label[for="aliases"].col-form-label {
    visibility: hidden;
    padding: 0 0.2857142857142857rem 0 0.2857142857142857rem;
    left: 2.0714285714285716rem;
    top: 0.5714285714285714rem;
    background-color: rgb(var(--body-color2));
    z-index: 3999;
}
#studio-edit .form-group:nth-of-type(1) .col-form-label {
    max-width: 2.857142857142857rem;
    visibility: visible;
    color: #c0ebe2;
}
#studio-edit .form-group:nth-of-type(2) .col-form-label {
    max-width: 2.142857142857143rem;
    visibility: visible;
    color: #c0ebe2;
}
#studio-edit .form-group:nth-of-type(3) .col-form-label {
    max-width: 31px;
    visibility: visible;
    color: #c0ebe2;
}
#studio-edit .form-group label[for="aliases"].col-form-label {
    /*top: 1.0714285714285714rem;*/
    max-width: 3.4285714285714284rem;
    visibility: visible;
    color: #c0ebe2;
}
#studio-edit .form-group:nth-of-type(4) .col-form-label {
    max-width: 9.857142857142858rem;
    flex-basis: 9.857142857142858rem;
    padding-bottom: 0.2857142857142857rem;
    padding-left: 2.357142857142857rem;
    color: #c0ebe2;
}
#studio-edit .form-group:nth-of-type(5) .col-form-label {
    padding-bottom: 0.2857142857142857rem;
    padding-left: 2.357142857142857rem;
    color: #c0ebe2;
}
#studio-edit>.row:not(.form-group)>.col-form-label {
    padding-left: 4rem;
    color: #c0ebe2;
    padding-bottom: 0.2857142857142857rem;
}
.studio-details>.form-group>.col-form-label {
    flex-basis: 10.714285714285714rem;
    max-width: 10.714285714285714rem;
    padding-left: 2.5714285714285716rem;
    top: 1.7142857142857142rem;
}
.studio-details > .form-group > label.form-label.col-form-label[for="ignore-auto-tag"] {
    position: relative;
    left: 16px;
}
.studio-details > .form-group:has(.form-check-input[value="true"]) > label.form-label.col-form-label[for="ignore-auto-tag"] {
    color: #00dfc6;
}
.studio-head .form-group label.form-label.col-form-label[for="ignore-auto-tag"] {
    position: relative;
    left: 44px;
    top: 28px;
}
.studio-head .form-group:has(input#ignore-auto-tag[value="true"]) .form-label.col-form-label[for="ignore-auto-tag"] {
    color: #00dfc6;
}
#studio-edit .form-group:focus-within:nth-of-type(-n+3) .col-form-label,
#studio-edit .form-group:focus-within label[for="aliases"].col-form-label {
    color: #00dfc6;
    visibility: visible;
}
#studio-edit .form-group:has(>.col-9 .is-invalid) .col-form-label {
    color: #93000a;
}
#studio-edit>.row .row.no-gutters button.mr-2.py-0.btn.btn-danger {
    margin-left: 1.6428571428571428rem;
}

/* Galleries Editor */
.gallery-tabs {
    max-height: none;
}
.tab-content>.tab-pane.active.show>#gallery-edit-details>form>.form-container:first-of-type>.col:has(>*.edit-button) {
    max-width: 50%;
}

#gallery-edit-details .form-container:nth-of-type(2) .form-group:nth-of-type(-n+3) .col-form-label {
    visibility: hidden;
    padding: 0 0.2857142857142857rem 0 0.2857142857142857rem;
    left: 2.0714285714285716rem;
    top: 0.5714285714285714rem;
    background-color: rgb(var(--body-color2));
    z-index: 3999;
}
#gallery-edit-details .form-container:nth-of-type(2) .form-group:focus-within:nth-of-type(-n+3) .col-form-label {
    color: #00dfc6;
    visibility: visible;
}
#gallery-edit-details .form-container:nth-of-type(2) .form-group:nth-of-type(1) .col-form-label {
    max-width: 34px;
}
#gallery-edit-details .form-container:nth-of-type(2) .form-group:has(>.col-9 .is-invalid) .col-form-label {
    color: #93000a;
}
#gallery-edit-details .form-container:nth-of-type(2) .form-group .url-label .col-form-label {
    margin-left: -16px;
    z-index: 39999;
    padding-bottom: 2px;
    top: 10px;
}
#gallery-edit-details .form-container:nth-of-type(2) .form-group:nth-of-type(3) .col-form-label {
    left: 28px;
    max-width: 35px;
}
#gallery-edit-details .form-container:nth-of-type(2) .form-group:nth-of-type(4) .col-form-label {
    left: 16px;
    top: 10px;
    color: #c0ebe2;
}
#gallery-edit-details .form-container:nth-of-type(2) .form-group:nth-of-type(5) .col-form-label,
#gallery-edit-details .form-container:nth-of-type(2) .form-group:nth-of-type(6) .col-form-label,
#gallery-edit-details .form-container:nth-of-type(2) .form-group:nth-of-type(7) .col-form-label,
#gallery-edit-details .form-container:nth-of-type(2) .form-group:nth-of-type(8) .col-form-label {
    left: 16px;
    top: 6px;
    color: #c0ebe2;
}
#gallery-edit-details .form-container:nth-of-type(2) .form-group:not(.row) .form-label {
    color: #c0ebe2;
    font-size: 0.8571428571428571rem;
    font-weight: 400;
    line-height: 1.1428571428571428rem;
    letter-spacing: 0.028571428571428574rem;
    position: relative;
    left: 16px;
    top: 14px;
    background-color: rgb(var(--body-color2));
    padding-left: 4px;
    padding-right: 4px;
}
#gallery-edit-details .form-container:nth-of-type(2) .form-group:not(.row):focus-within .form-label {
    color: #00dfc6;
}

/* Image Edit Tab */
#image-edit-details>form>.form-container>.edit-buttons {
    margin-bottom: 12px !important;
}
#image-edit-details .form-container:nth-of-type(2) .form-group:nth-of-type(-n+3) .col-form-label {
    visibility: hidden;
    padding: 0 0.2857142857142857rem 0 0.2857142857142857rem;
    left: 2.0714285714285716rem;
    top: 0.5714285714285714rem;
    background-color: rgb(var(--body-color2));
    z-index: 3999;
}
#image-edit-details .form-container:nth-of-type(2) .form-group:nth-of-type(1) .col-form-label {
    max-width: 32px;
}
#image-edit-details .form-container:nth-of-type(2) .form-group:nth-of-type(2) .col-form-label {
    position: relative;
    left: 14px;
    max-width: 30px;
}
#image-edit-details .form-container:nth-of-type(2) .form-group:nth-of-type(3) .col-form-label {
    max-width: 34px;
}
#image-edit-details .form-container:nth-of-type(2) .form-group:focus-within:nth-of-type(-n+3) .col-form-label {
    color: #00dfc6;
    visibility: visible;
}
#image-edit-details .form-container:nth-of-type(2) .form-group:nth-of-type(n+4) .col-form-label {

}

/* Scene-Markers-Panel */
@media (min-width: 1200px) {
    .col-xl-6 {
        flex: 0 0 55%;
        max-width: 55%;
    }
}
.scene-markers-panel .primary-card-body.card-body>div>hr {
    border: 1px solid #3f4946;
}
.scene-tabs .tab-content>.fade.tab-pane.active.show {
    padding: 0;
}

.scene-tabs .tab-content .fade.tab-pane.active.show .form-group .col-form-label {
    color: #dcf6f0;
    display: flex;
    padding-bottom: 0.2857142857142857rem;
    padding-left: 2.0714285714285716rem;
    font-size: 0.8571428571428571rem;
    font-weight: 400;
    line-height: 1.1428571428571428rem;
    letter-spacing: 0.028571428571428574rem;
}

.scene-tabs .tab-content .fade.tab-pane.active.show .form-group .row label.col-form-label {
    top: -11px;
    left: 108px;
    background-color: rgb(var(--body-color2));
    z-index: 3339;
    padding: 2px 4px;
    max-width: 36px;
    margin-left: -82px;
    margin-bottom: 40px;
}
.form-group:has(*.select-suggest) .col-form-label[for="title"] {
    max-width: 129px;
}
.scene-tabs .tab-content .fade.tab-pane.active.show .form-group:focus-within .row label.col-form-label {
    color: #00dfc6;
}
.scene-tabs .duration-input>.input-group>.input-group-append>button.btn.btn-secondary {
    border-style: none;
    border: 0;
    border-radius: 5rem;
    top: 7px;
    padding-left: 12px;
    padding-right: 12px;
}
.scene-tabs .duration-input>.input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary {
    flex: 0 0 28px;
    max-height: 27px;
    border-radius: 5rem;
    border: 0;
}
.scene-tabs .duration-input>.input-group:not(.has-validation)>.duration-control.form-control:not(:last-child) {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    height: 58px;
    margin-right: -25%;
}
.scene-tabs .duration-input>.input-group:not(.has-validation)>.duration-control.form-control:focus-within:not(:last-child) {
    box-shadow: 0 0 0 0.07142857142857142rem #00dfc6, inset 0 0 0 0.07142857142857142rem #00dfc6;
}

/*Modal Edit-filter-dialog */
.modal-content, 
.modal-lg, 
.modal-xl {
    background-image: linear-gradient(to right, #2e3133, #2e3133);
    background-color: rgba(var(--pry-color),0.5);
    background-blend-mode: multiply;
    box-shadow: var(--elevation-3);
    border-radius: 28px;
}

.edit-filter-dialog .criterion-list .card .collapse-icon {
    margin-right: 8px;
    width: 24px;
    height: 24px;
    color: rgb(var(--on-surface-variant));
}
.dialog-content .criterion-list .collapse.show .card-body {
    background-color: rgb(var(--card-color-collaps-show));
    border-radius: 12px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    transform: translate(0%,0%);
    transition: transform 0.3s ease-in 0.25s;
}
.criterion-editor .form-group + .form-group > div {
    display: flex;
    width: 100%;
}
.criterion-editor .form-group + .form-group .input-group.has-validation {
    width: 100%;
}
.criterion-editor .form-group + .form-group .input-group.has-validation > input + .input-group-append {
    position: absolute;
    right: 16px;
    margin-left: 90%;
    height: 100%;
}
.criterion-editor .form-group .input-group.has-validation>input.date-input.text-input.form-control {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    background-color: transparent !important;
    display: flex;
}
.react-datepicker-wrapper {
    display: flex;
}
.react-datepicker__input-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
}
.criterion-editor .form-group .input-group.has-validation>.input-group-append>.react-datepicker-wrapper button.btn.btn-secondary:has(>.fa-calendar):not(:first-child):last-child,
.criterion-editor .form-group .input-group.has-validation>.input-group-append>.react-datepicker-wrapper button.btn.btn-secondary:has(>.fa-calendar):not(:first-child):last-child:not(:disabled):not(.disabled):hover,
.criterion-editor .form-group .input-group.has-validation>.input-group-append>.react-datepicker-wrapper button.btn.btn-secondary:has(>.fa-calendar):not(:first-child):last-child:not(:disabled):not(.disabled):focus,
.criterion-editor .form-group .input-group.has-validation>.input-group-append>.react-datepicker-wrapper button.btn.btn-secondary:has(>.fa-calendar):not(:first-child):last-child:not(:disabled):not(.disabled):active,
.criterion-editor .form-group .input-group.has-validation>.input-group-append>.react-datepicker-wrapper button.btn.btn-secondary:has(>.fa-calendar):not(:first-child):last-child:not(:disabled):not(.disabled).active,
.criterion-editor .form-group .input-group.has-validation>.input-group-append>.react-datepicker-wrapper button.btn.btn-secondary:has(>.fa-calendar):not(:first-child):last-child:not(:disabled):not(.disabled):active:hover,
.criterion-editor .form-group .input-group.has-validation>.input-group-append>.react-datepicker-wrapper button.btn.btn-secondary:has(>.fa-calendar):not(:first-child):last-child:not(:disabled):not(.disabled).active:hover,
.criterion-editor .form-group .input-group.has-validation>.input-group-append>.react-datepicker-wrapper button.btn.btn-secondary:has(>.fa-calendar):not(:first-child):last-child:not(:disabled):not(.disabled):focus-visible {
    padding: 0;
    width: 40px;
    max-width: 40px;
    height: 40px;
}

.criterion-editor > div > .form-group + .form-group > .input-group .input-group-append {
    margin-left: auto;
    padding-right: 16px;
    padding-left: 12px;
    top: -50%;
}
.criterion-editor .form-group .input-group:not(.has-validation)>.input-group-append>button.btn.btn-secondary {
    padding: 0;
    border-radius: 5rem;
    border: 0;
    z-index: 3;
    width: 40px;
    max-width: 40px;
    height: 40px;
    font-size: 24px;
    background-color: transparent;
}
.criterion-editor > div > .form-group > .duration-input .input-group-append {
    margin-left: auto;
    top: -50%;
}
.criterion-editor .form-group .input-group>.input-group-append>.btn-group-vertical:has(>.duration-button),
.modal-body>.percent-input>.input-group>.input-group-append>.btn-group-vertical:has(>.percent-button),
.modal-body .duration-input>.input-group>.input-group-append>.btn-group-vertical:has(>.duration-button) {
    flex-direction: row;
    align-items: center;
    margin-right: auto;
    margin-left: auto;
}
.modal-body>.percent-input>.input-group>.input-group-append>.btn-group-vertical:has(>.percent-button),
.modal-body .duration-input>.input-group>.input-group-append>.btn-group-vertical:has(>.duration-button) {
    padding-right: 16px;
}
.criterion-editor .form-group .input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary,
.modal-body>.percent-input>.input-group>.input-group-append>.btn-group-vertical>button.percent-button.btn.btn-secondary,
.modal-body .duration-input>.input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary {
    border: 0;
    background-color: transparent;
    border-radius: 5rem;
    padding: 0;
    z-index: 3;
    font-size: 24px;
    width: 40px;
    min-width: 40px;
    height: 40px;
    justify-content: center;
    align-content: center;
    flex-wrap: wrap;
    margin-left: 12px;
}
.criterion-editor .form-group .input-group:not(.has-validation)>.input-group-append>button.btn.btn-secondary:hover:not(:disabled):not(.disabled),
.criterion-editor .form-group .input-group:not(.has-validation)>.input-group-append>button.btn.btn-secondary:focus:not(:disabled):not(.disabled),
.criterion-editor .form-group .input-group:not(.has-validation)>.input-group-append>button.btn.btn-secondary:focus-visible:not(:focus):not(:disabled):not(.disabled),
.criterion-editor .form-group .input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:hover:not(:disabled):not(.disabled),
.criterion-editor .form-group .input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:focus:not(:disabled):not(.disabled),
.criterion-editor .form-group .input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:focus-visible:not(:focus):not(:disabled):not(.disabled),
.modal-body>.percent-input>.input-group>.input-group-append>.btn-group-vertical>button.percent-button.btn.btn-secondary:hover:not(:disabled):not(.disabled),
.modal-body>.percent-input>.input-group>.input-group-append>.btn-group-vertical>button.percent-button.btn.btn-secondary:focus:not(:disabled):not(.disabled),
.modal-body>.percent-input>.input-group>.input-group-append>.btn-group-vertical>button.percent-button.btn.btn-secondary:focus-visible:not(:focus):not(:disabled):not(.disabled),
.modal-body .duration-input>.input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:hover:not(:disabled):not(.disabled),
.modal-body .duration-input>.input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:focus:not(:disabled):not(.disabled),
.modal-body .duration-input>.input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:focus-visible:not(:focus):not(:disabled):not(.disabled) {
    background-color: rgba(255,255,255,0.08);
    box-shadow: none;
}
.criterion-editor .form-group .input-group:not(.has-validation)>.input-group-append>button.btn.btn-secondary:active:not(:disabled):not(.disabled),
.criterion-editor .form-group .input-group:not(.has-validation)>.input-group-append>button.btn.btn-secondary:active:hover:not(:disabled):not(.disabled),
.criterion-editor .form-group .input-group:not(.has-validation)>.input-group-append>button.btn.btn-secondary:active:focus:not(:disabled):not(.disabled),
.criterion-editor .form-group .input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:active:not(:disabled):not(.disabled),
.criterion-editor .form-group .input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:active:hover:not(:disabled):not(.disabled),
.criterion-editor .form-group .input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:active:focus:not(:disabled):not(.disabled),
.modal-body>.percent-input>.input-group>.input-group-append>.btn-group-vertical>button.percent-button.btn.btn-secondary:active:not(:disabled):not(.disabled),
.modal-body>.percent-input>.input-group>.input-group-append>.btn-group-vertical>button.percent-button.btn.btn-secondary:active:hover:not(:disabled):not(.disabled),
.modal-body>.percent-input>.input-group>.input-group-append>.btn-group-vertical>button.percent-button.btn.btn-secondary:active:focus:not(:disabled):not(.disabled),
.modal-body .duration-input>.input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:active:not(:disabled):not(.disabled),
.modal-body .duration-input>.input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:active:hover:not(:disabled):not(.disabled),
.modal-body .duration-input>.input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:active:focus:not(:disabled):not(.disabled) {
    background-color: rgba(255,255,255,0.16);
    box-shadow: none;
}
.criterion-editor .form-group .input-group:not(.has-validation)>.input-group-append>button.btn.btn-secondary:focus-visible:not(:focus):not(:disabled):not(.disabled),
.criterion-editor .form-group .input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:focus-visible:not(:focus):not(:disabled):not(.disabled),
.modal-body>.percent-input>.input-group>.input-group-append>.btn-group-vertical>button.percent-button.btn.btn-secondary:focus-visible:not(:focus):not(:disabled):not(.disabled),
.modal-body .duration-input>.input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:focus-visible:not(:focus):not(:disabled):not(.disabled) {
    outline-color: #dcf6f0;
    outline-width: 3px;
    outline-style: solid;
    outline-offset: 0;
}

.criterion-editor .form-group .input-group:not(.has-validation)>input.form-control:not(:last-child) {
    border-radius: 4px;
    width: 100%;
    padding-right: 72px;
}
.criterion-editor .form-group>.duration-input>.input-group:not(.has-validation)>input.duration-control.form-control:not(:last-child),
.modal-body>.percent-input>.input-group:not(.has-validation)>input.percent-control.form-control:not(:last-child),
.modal-body .duration-input>.input-group:not(.has-validation)>input.duration-control.form-control:not(:last-child) {
    border-radius: 4px;
    width: 100%;
    margin-right: unset;
    background-color: transparent !important;
}

.modal-body .criterion-editor .form-group input.btn-secondary.form-control {
    min-height: 56px;
    padding: 0 16px 0 16px;
    border-radius: 4px;
    border: 0;
    background-color: transparent;
    background-image: none;
    box-shadow: 0 0 0 1px rgb(var(--outline)), inset 0 0 0 1px transparent;
    transition: background-color 0.55s ease, box-shadow 0.4s ease-in;
}
.modal-body .criterion-editor .form-group input.btn-secondary.form-control:hover {
    box-shadow: 0 0 0 1px rgb(var(--on-surface)), inset 0 0 0 1px rgba(0,0,0,0.0);
    background-color: transparent;
    background-image: none;
}
.modal-body .criterion-editor .form-group input.btn-secondary.form-control:focus,
.modal-body .criterion-editor .form-group input.btn-secondary.form-control:not(:disabled):not(.disabled):active,
.modal-body .criterion-editor .form-group input.btn-secondary.form-control:focus:not(:disabled):not(.disabled):active {
    background-color: transparent;
    background-image: none;
    box-shadow: inset 0 0 0 1px rgb(var(--pry-color)), 0 0 0 1px rgb(var(--pry-color));
}
.modal-body .criterion-editor .form-group input.btn-secondary.form-control:focus-visible {
    outline-offset: 3px;
}

#temp-enable-duration>small.text-muted.form-text {
    left: -312px;
    position: relative;
    top: 58px;
}
/* ***Create*** */

/* Scene */
div#create-scene-page {
    background-color: rgb(var(--body-color2));
}
#create-scene-page.new-view h2 {
    /*background-color: #373d3b;*/
    padding: 16px;
    margin-bottom: 0;
    border-top-left-radius: 1.5rem;
    border-top-right-radius: 1.5rem;
}
#create-scene-page.new-view #scene-edit-details>form>.form-container.edit-buttons-container {
    /*background-color: #373d3b;*/
    padding: 16px;
    border-bottom-left-radius: 1.5rem;
    border-bottom-right-radius: 1.5rem;
    position: relative;
}
#create-scene-page.new-view #scene-edit-details .edit-buttons-container>.edit-buttons.mb-3.pl-0 {
    padding-left: 16px !important;
}
#create-scene-page.new-view #scene-edit-details .form-container:nth-of-type(2) .col-12:nth-of-type(2) .form-group:last-of-type>.form-label {
    margin-bottom: 16px;
}
/* Movie */
@media (min-width: 768px) {
    .movie-details.mb-3.col>div {
        flex: 0 0 66.66666667%;
        max-width: 66.66666667%;
        position: relative;
        width: 100%;
        padding-left: 15px;
        padding-right: 15px;
    }
}
.movie-details.mb-3.col {
    margin: 24px;
    /*background-color: #414846;*/
    padding-top: 24px;
    padding-bottom: 24px;
    border-radius: 1.65rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
}
.movie-details.mb-3.col>div>h2 {
    position: relative;
    padding: 16px;
    background-color: #373d3b;
    border-radius: 1.5rem;
}

#movie-edit .form-group .col-form-label {
    color: transparent;
    display: flex;
    padding-bottom: 0.2857142857142857rem;
    padding-left: 4px;
    left: 28px;
    font-size: 0.8571428571428571rem;
    font-weight: 400;
    line-height: 1.1428571428571428rem;
    letter-spacing: 0.028571428571428574rem;
}
#movie-edit .form-group:nth-of-type(-n+4) .col-form-label,
#movie-edit .form-group:nth-of-type(6) .col-form-label,
#movie-edit .form-group:nth-of-type(n+8) .col-form-label {
    top: 11px;
    background-color: rgb(var(--body-color2));
    z-index: 33339;
    color: #00dfc6;
    visibility: hidden;
    transition: all 0.15s ease-in-out;
}
#movie-edit .form-group:nth-of-type(7) .col-form-label[for="url"] {
    color: #00dfc6;
}
#movie-edit .form-group:focus-within:nth-of-type(-n+4) .col-form-label,
#movie-edit .form-group:focus-within:nth-of-type(6) .col-form-label,
#movie-edit .form-group:focus-within:nth-of-type(n+8) .col-form-label {
    visibility: visible;
}
#movie-edit .form-group:nth-of-type(1) .col-form-label {
    max-width: 42px;
}
#movie-edit .form-group:has(>.col-9 .is-invalid) .col-form-label {
    color: #93000a;
}
#movie-edit .form-group:nth-of-type(2) .col-form-label {
    max-width: 50px;
}
#movie-edit .form-group:nth-of-type(3) .col-form-label {
    max-width: 58px;
}
#movie-edit .form-group:nth-of-type(4) .col-form-label {
    max-width: 35px;
}
#movie-edit .form-group:nth-of-type(5) .col-form-label {
    top: 3px;
}
#movie-edit .form-group:nth-of-type(6) .col-form-label {
    max-width: 54px;
}
/*#movie-edit .form-group:nth-of-type(7) .col-form-label {
    top: 6px;
}*/
#movie-edit .form-group:nth-of-type(8) .col-form-label {
    max-width: 60px;
}
#movie-edit .form-group:nth-of-type(9) .col-form-label {
    padding-bottom: 0;
    top: 7px;
    max-width: 60px;
}
#movie-edit .duration-input>.input-group>.input-group-append>.btn-group-vertical {
    flex-direction: row;
    align-items: flex-end;
}
#movie-edit .duration-input>.input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary {
    left: -12px;
    padding: 0 14px;
    border-radius: 5rem;
    border: 0;
    border-style: none;
    box-shadow: none;
}
#movie-edit .duration-input>.input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:hover:not(:disabled):not(.disabled),
#movie-edit .duration-input>.input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:focus:not(:disabled):not(.disabled),
#movie-edit .duration-input>.input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:focus-visible:not(:focus):not(:disabled):not(.disabled) {
    background-color: rgba(255,255,255,0.08);
    box-shadow: none;
}
#movie-edit .duration-input>.input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:active:not(:disabled):not(.disabled),
#movie-edit .duration-input>.input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:active:hover:not(:disabled):not(.disabled),
#movie-edit .duration-input>.input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:active:focus:not(:disabled):not(.disabled),
#movie-edit .duration-input>.input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary.active:not(:disabled):not(.disabled),
#movie-edit .duration-input>.input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary.active:hover:not(:disabled):not(.disabled),
#movie-edit .duration-input>.input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary.active:focus:not(:disabled):not(.disabled) {
    background-color: rgba(255,255,255,0.16);
    box-shadow: none;
}
#movie-edit .duration-input>.input-group>.input-group-append>.btn-group-vertical>button.duration-button.btn.btn-secondary:focus-visible:not(:focus):not(:disabled):not(.disabled) {
    outline-color: #dffffb;
    outline-style: solid;
    outline-width: 3px;
    outline-offset: 0;
}
#movie-edit .duration-input>.input-group:not(.has-validation)>.duration-control.form-control:not(:last-child) {
    border-radius: 0.5rem;
    margin-right: -80px;
    padding-right: 104px;
}
#movie-edit .duration-input>.input-group:not(.has-validation)>.duration-control.form-control:focus:placeholder,
#movie-edit .duration-input>.input-group:not(.has-validation)>.duration-control.form-control:active:placeholder {
    visibility: visible;
}

/* ImageCard */
.image-card-preview > .preview-button > button.btn.btn-primary:not(.fa-magnifying-glass) {
    background-color: transparent;
    box-shadow: none;
}

/* Galleries */
@media (min-width: 768px) {
    .new-view>.col-md-6:has(>*#gallery-edit-details) {
        position: relative;
        width: 100%;
        padding-left: 15px;
        padding-right: 15px;
        padding-top: 15px;
        border-radius: 1.65rem;
        /*background-color: #41384a;*/
    }
}
.new-view>.col-md-6:has(>*#gallery-edit-details)>h2 {
    position: relative;
    padding: 16px;
    background-color: #373d3b;
    margin-bottom: 0;
    border-top-left-radius: 1.5rem;
    border-top-right-radius: 1.5rem;
}
.new-view>.col-md-6>#gallery-edit-details>form>.form-container:first-of-type {
    background-color: #373d3b;
    padding: 16px;
    border-bottom-left-radius: 1.5rem;
    border-bottom-right-radius: 1.5rem;
    position: relative;
    margin-left: 0;
    margin-right: 0;
}
/* Performer */
#performer-page.row.new-view:has(>*.performer-image-container) {
    position: relative;
    width: 100%;
    padding-left: 15px;
    padding-right: 15px;
    padding-top: 15px;
    border-radius: 1.65rem;
    /*background-color: #414846;*/
}
@media (min-width: 1200px) {
    #performer-page.row.new-view:has(>*.performer-image-container) .details-edit.col-xl-9.mb-3:has(>*.dropup) {
        max-width: 100%;
    }
}
#performer-page.row.new-view:has(>*.performer-image-container)>.col-md-8:has(>*#performer-edit)>h2 {
    position: relative;
    padding: 16px;
    background-color: #373d3b;
    margin-bottom: 0;
    border-top-left-radius: 1.5rem;
    border-top-right-radius: 1.5rem;
}
#performer-page.row.new-view:has(>*.performer-image-container) .details-edit.col-xl-9.mb-3:has(>*.dropup) {
    background-color: #373d3b;
    padding: 16px;
    border-bottom-left-radius: 1.5rem;
    border-bottom-right-radius: 1.5rem;
    position: relative;
    margin-left: 0;
    margin-right: 0;
    margin-top: 0;
    flex-wrap: nowrap;
}
/* Scene Editor --- top spacing filler */
#scene-edit-details .form-group.row {
    padding-top: 1ex;
}
/* Text-Input Column-Form-Label */
#scene-edit-details .form-container .form-group.row > label.col-form-label.form-label,
#scene-edit-details .form-label[for="details"] {
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 1.0px;
    font-weight: 500;
    color: rgb(var(--pry-color));
}
#scene-edit-details .form-container .form-group.row > label.form-label.col-form-label {
    position: relative;
    display: block;
    margin-left: 28px;
    margin-bottom: -2.5%;
    z-index: 4;
    padding: 0;
    padding-left: 4px;
    padding-right: 4px;
    background-color: rgb(var(--body-color2));
    margin-right: auto;
    width: unset;
    max-width: unset;
    transform: translate(0%,0%);
    flex-basis: fit-content;
    visibility: hidden;
    /*opacity: 1;*/
    /*transition: margin-bottom 0.2s ease-in, opacity 0.2s, background-color 0.2s;*/
}
#scene-edit-details .form-container .form-group.row:focus-within > label.form-label.col-form-label,
#scene-edit-details .form-group:focus-within .form-label[for="details"] {
    animation: opacityname 0.3s linear forwards;
    will-change: animation;
}
@keyframes opacityname {
    0% {
        
    }
    100% {
        visibility: visible;
        opacity: 1;
    }
}
    /* For Editor Text-Inputs with multiple Inputs spacing between. */
.string-list-input .input-group {
    margin-bottom: 8px;
}
/*#scene-edit-details .string-list-input > .form-group:is(:only-child, :last-child) {
    margin-bottom: 0;
}*/
#scene-edit-details .string-list-input > .form-group > .input-group:is(:last-child, :only-child) {
    margin-bottom: -4.5%;
}

    /* Title */
#scene-edit-details .form-container .form-group.row > label[for="title"].form-label.col-form-label {
    padding-top: 8px;
}

    /* URL's */
/*.form-container .form-group.row + .form-group.row > .url-label > label[for="urls"].col-form-label {
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0.35px;
    font-weight: 500;
    color: rgb(var(--pry-color));
    position: relative;
    display: block;
    margin-left: 12px;
    margin-bottom: -25%;
    z-index: 4;
    padding-top: 4px;
    padding-left: 4px;
    padding-right: 4px;
    background-color: rgb(var(--body-color2));
    margin-right: 38%;
    transform: translate(0%,0%);
    visibility: visible;
}
.form-container .form-group.row + .form-group.row:focus-within > .url-label > label[for="urls"].col-form-label {
    visibility: visible;
}*/

/* Scene Editor - Details textarea */
/*#scene-edit-details .form-group:has(>label[for="details"]) {
    padding: 0 14px;
}*/


/*#scene-edit-details .form-container .form-group > label.form-label[for="details"]::before {
    content: "Description";
    position: absolute;
    z-index: -1;
    font-size: 16px;
    font-weight: 400;
    letter-spacing: 0.5px;
    line-height: 24px;
    text-shadow: none;
    color: rgb(var(--on-surface-variant));
    isolation: auto;
    top: 0%;
    margin-top: 50%;
    visibility: visible;
    transform: translate(0%,0%);
}*/
#scene-edit-details .form-label[for="details"] {
    top: 2%;
    visibility: hidden;
    position: absolute;
    margin-left: 7.25%;
    margin-bottom: unset;
    width: 12.3%;
    z-index: 4;
    padding: 0 4px;
    background-color: rgb(var(--body-color2));
    transform: translate(0%,0%);
}
/*#scene-edit-details .form-container .form-group:focus-within > label.form-label[for="details"]::before {*/
    /*content: "";*/
    /*content: "Description";
    position: absolute;
    font-size: 16px;
    font-weight: 400;
    letter-spacing: 0.5px;
    line-height: 24px;*/
    /*visibility: hidden;*/
    /*top: 0%;
    margin-top: 50%;
    margin-left: -85%;
    text-shadow: none;
    bottom: 0%;
    color: rgb(var(--body-color2));
    transform: translate(0%,0%);*/
/*}*/
/*textarea#details.text-input.form-control::placeholder {
    color: rgb(var(--body-color2));
}*/

    /* Scene Editor Date-Input */
 input.date-input + .input-group-append:has(>.react-datepicker-wrapper) {
    left: -12px;
    margin-left: auto;
    margin-right: auto;
    width: 11%;
 }   
/* */
label[for="cover_image"].form-label {
    margin-bottom: 0%;
    position: relative;
    top: 6px;
    padding-left: 6px;
}
.scene-cover {
    border-radius: 4px;
    margin-bottom: 12px;
}
    /* Rating Stars */
#scene-edit-details .form-group.row > label.form-label.col-form-label:has(+ div > .rating-stars) {
    visibility: visible;
    color: rgb(var(--on-surface-variant));
    margin-left: 16px;
}
#scene-edit-details .rating-stars {
    height: 56px;
    align-items: flex-end;
}
.rating-stars .unsetting, 
.rating-stars .setting, 
.rating-stars .set {
    color: rgb(var(--star-color));
}
/* * */


/* Tagger-Container */
.tagger-container .search-item > .row > div:nth-child(2) {
    padding: 16px;
}
.tagger-container .search-item {
    background-color: rgb(var(--card-color));
    border-radius: 12px;
    padding: 0;
}
.mt-3, .my-3 {
    margin-top: 16px !important;
}
.mt-2, .my-2 {
    margin-top: 12px !important;
}
.tagger-container div .input-group {
    align-items: center;
}
.tagger-container div.my-1 .input-group>.input-group-append>button.btn.btn-primary,
.PerformerTagger-box-link.input-group>.input-group-append>button.btn.btn-primary,
.PerformerTagger-details>.input-group>.input-group-append>button.btn.btn-primary {
    align-items: center;
    padding-left: 24px;
    padding-right: 24px;
    border-radius: 5rem;
    margin-left: 6px;
}
.tagger-container div.my-1 .input-group > .input-group-append {
    margin-left: -48px;
}
.tagger-container div.my-1 .input-group > .input-group-append > button.btn.btn-primary::before {
    content: "";
    position: absolute;
    background-image: url("data:image/svg+xml;base64,PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4KDTwhLS0gVXBsb2FkZWQgdG86IFNWRyBSZXBvLCB3d3cuc3ZncmVwby5jb20sIFRyYW5zZm9ybWVkIGJ5OiBTVkcgUmVwbyBNaXhlciBUb29scyAtLT4KPHN2ZyB3aWR0aD0iNjRweCIgaGVpZ2h0PSI2NHB4IiB2aWV3Qm94PSIwIDAgMjQuMDAgMjQuMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjYzFjN2NlIiBzdHJva2Utd2lkdGg9IjAuODY0MDAwMDAwMDAwMDAwMSI+Cg08ZyBpZD0iU1ZHUmVwb19iZ0NhcnJpZXIiIHN0cm9rZS13aWR0aD0iMCIvPgoNPGcgaWQ9IlNWR1JlcG9fdHJhY2VyQ2FycmllciIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cg08ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTUgMTAuNUMxNSAxMi45ODUzIDEyLjk4NTMgMTUgMTAuNSAxNUM4LjAxNDcyIDE1IDYgMTIuOTg1MyA2IDEwLjVDNiA4LjAxNDcyIDguMDE0NzIgNiAxMC41IDZDMTIuOTg1MyA2IDE1IDguMDE0NzIgMTUgMTAuNVpNMTQuMTc5MyAxNS4yMzk5QzEzLjE2MzIgMTYuMDI5NyAxMS44ODY1IDE2LjUgMTAuNSAxNi41QzcuMTg2MjkgMTYuNSA0LjUgMTMuODEzNyA0LjUgMTAuNUM0LjUgNy4xODYyOSA3LjE4NjI5IDQuNSAxMC41IDQuNUMxMy44MTM3IDQuNSAxNi41IDcuMTg2MjkgMTYuNSAxMC41QzE2LjUgMTEuODg2NSAxNi4wMjk3IDEzLjE2MzIgMTUuMjM5OSAxNC4xNzkyTDIwLjAzMDQgMTguOTY5N0wxOC45Njk3IDIwLjAzMDNMMTQuMTc5MyAxNS4yMzk5WiIgZmlsbD0iI2MxYzdjZSIvPiA8L2c+Cg08L3N2Zz4=");
    background-repeat: no-repeat;
    background-size: 33px;
    background-position: 30% 30%;
    width: 40px;
    min-width: 40px;
    height: 40px;
    max-height: 40px;
    padding: 0;
    padding-right: 40px;
    z-index: 5;
}
.tagger-container div.my-1 .input-group > .input-group-append > button.btn.btn-primary {
    background-color: transparent;
    width: 40px;
    color: rgb(0,0,0,0);
    min-width: 40px;
    height: 40px;
    max-height: 40px;
    padding: 0;
    z-index: 5;
    left: -31%;
    box-shadow: none;
}
.tagger-container div.my-1 .input-group > .input-group-append > button.btn.btn-primary:is(:hover, :focus-visible) {
    background-color: rgb(var(--on-surface),var(--btn-hover));
    box-shadow: var(--elevation-0);
}
.tagger-container div.my-1 .input-group > .input-group-append > button.btn.btn-primary:is(:active, :focus, :active:focus) {
    background-color: rgb(var(--on-surface),var(--btn-active));
    box-shadow: none;
    outline: 0;
}
.tagger-container div.my-1 .input-group > .input-group-append > button.btn.btn-primary:is(:disabled, .disabled) {
    background-color: transparent;
    color: transparent;
    box-shadow: none;
}
.tagger-container div.my-1 .input-group > .input-group-append > button.btn.btn-primary >span.mr-2>.LoadingIndicator.inline.small>.spinner-border.spinner-border-sm>.sr-only{
    color: transparent;
}
.tagger-container div.my-1 .input-group > .input-group-append > button.btn.btn-primary:has(>span.mr-2>.LoadingIndicator.inline.small)::before {
    background-image: none;
    transition: 0.25s ease-in-out;
}
.tagger-container div.my-1 .input-group > .input-group-append > button.btn.btn-primary:has(>span.mr-2>.LoadingIndicator.inline.small) {
    background-color: transparent;
    color: transparent;
    box-shadow: none;
    transition: background-color 0.25s ease-in-out, box-shadow 0.25s ease-in-out;
}
.tagger-container div.my-1 .input-group > .input-group-append > button.btn.btn-primary >span.mr-2>.LoadingIndicator.inline.small {
    display: flex;
    position: relative;
    width: 40px;
    height: 40px;
    left: 27px;
}
.tagger-container div.my-1 .input-group > .input-group-append > button.btn.btn-primary >span.mr-2>.LoadingIndicator.inline.small>.spinner-border.spinner-border-sm {
    display: flex;
    position: absolute;
    width: 20px;
    height: 20px;
    margin: 8px;
    border: 3px solid rgb(var(--pry-color));
    border-radius: 5rem;
    animation: loading-indicator-small 1.2s cubic-bezier(0.5,0,0.5,1) infinite;
    border-color: rgb(var(--pry-color)) rgb(var(--pry-color)) rgb(var(--pry-color)) transparent;
}
.tagger-container div.my-1 .input-group > .input-group-append > button.btn.btn-primary >span.mr-2>.LoadingIndicator.inline.small>.spinner-border.spinner-border-sm:nth-child(1) {
    animation-delay: -0.47s;
}
.tagger-container div.my-1 .input-group > .input-group-append > button.btn.btn-primary >span.mr-2>.LoadingIndicator.inline.small>.spinner-border.spinner-border-sm:nth-child(2) {
    animation-delay: -0.28s;
}
.tagger-container div.my-1 .input-group > .input-group-append > button.btn.btn-primary >span.mr-2>.LoadingIndicator.inline.small>.spinner-border.spinner-border-sm:nth-child(3) {
    animation-delay: -0.13s;
}
@keyframes loading-indicator-small {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform:rotate(360deg);
    }
}

.tagger-container div.my-1 .input-group > .input-group-append > button.btn.btn-primary > span.mr-2 > div.LoadingIndicator.inline.small > div.spinner-border.spinner-border-sm,
.tagger-container div.my-1 .input-group > .input-group-append > button.btn.btn-primary > span.mr-2 > div.LoadingIndicator.inline.small > div.spinner-border.spinner-border-sm > span.sr-only {
    color: transparent !important;
}


.tagger-container .collapse.show.card .input-group > .input-group-append > button.btn.btn-primary {
    border-radius: 5rem;
    padding: 0;
    margin-right: 4px;
    width: 40px;
    max-width: 40px;
    height: 40px;
    max-height: 40px;
    background: none;
    color: transparent;
    box-shadow: none;
    z-index: 51;
    transform: translate(0%, 0%);
    transition: all 0s;
    will-change: auto;
}

.tagger-container .collapse.show.card .input-group > .input-group-append > button.btn.btn-primary:hover {
    background-color: rgb(var(--on-surface),var(--btn-hover));
}
.tagger-container .collapse.show.card .input-group > .input-group-append > button.btn.btn-primary:is(:active, :focus:not(:focus-visible)) {
    background-color: rgb(var(--on-surface),var(--btn-active));
    outline: none;
}
.tagger-container .collapse.show.card .input-group > .input-group-append > button.btn.btn-primary:focus-visible {
    background-color: rgb(var(--on-tertiary),var(--btn-hover));
    color: rgb(var(--tertiary));
}
.tagger-container .collapse.show.card .input-group > .input-group-append > button.btn.btn-primary::after {
    color: rgb(var(--on-surface));
    display: flex;
    content: "\FF0B";
    font-family: var(--UnicodeFont);
    font-weight: 1000;
    font-size: 24px;
    position: absolute;
    width: 40px;
    max-width: 40px;
    height: 40px;
    align-items: center;
    justify-content: center;
}

/* Flex box for thumb in tagger */
.tagger-container .scene-card-preview {
    border-radius: 12px 0;
    margin-bottom: 0;
    overflow: hidden;
    /* min-width: 42.3vw; */
    flex: 1 1 100%;
    width: 39.25vw;
    max-width: 59.78vh;
    max-height: unset;
    aspect-ratio: 16/9;
    display: block;
}

.tagger-container div:has(>code) {
    position: relative;
    margin: 8px 0 12px 8px;
    display: flex;
    align-items: flex-start;
    align-content: flex-start;
    flex-wrap: wrap;
}
.tagger-container div > code {
    display: flex;
    margin-top: 2px;
}

@media (min-width: 576px) {
    .flex-sm-row {
        flex-direction: column !important;
        padding-left: 0;
        padding-right: 0;
        margin-bottom: 16px;
        border-radius: 12px 0;
        align-items: flex-start !important;
    }
}

.scene-link:not(.optional-field-content > .scene-link) {
    position: relative;
    outline: 0;
    top: -48px;
    /*width: 41.25vw; 31.25vw*/
    /*max-width: 60.78vh; 177.78vh*/
    /*margin-top: 1px;*/
    background-color: #000b12;
    border-radius: 0 0 12px;
    backdrop-filter: blur(10px);
    transform: translate(0%,0%);
    transition: text-decoration 0.25s ease-in, all 0s;
    width: 39.25vw;
    max-width: 59.78vh;
}
.scene-link:not(.optional-field-content > .scene-link):is(:hover, :active) {
    text-decoration: underline;
    text-decoration-color: rgb(var(--nav-white));
    text-underline-offset: 0.22em;
    text-underline-position: from-font;
    outline: 0;
}
.scene-link:not(.optional-field-content > .scene-link):focus {
    text-decoration: underline;
    text-decoration-color: rgb(var(--link-hover));
    text-underline-offset: 0.22em;
    text-underline-position: from-font;
    outline: 0;
}
.scene-link:not(.optional-field-content > .scene-link):visited {
    text-decoration: underline;
    text-decoration-color: rgb(var(--nav-white));
    text-underline-offset: 0.22em;
    text-underline-position: from-font;
    outline: 0;
}

/* Text fields on Tagger-Container Search-Results */
.optional-field-content:not(:has(>.scene-link)) {
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 0.25px;
    color: rgb(var(--on-surface-variant));
}
/* Name of Scene, Movie, etc. */
.optional-field-content > .scene-link {
    font-size: 18px;
    line-height: 26px;
    letter-spacing: 0.11px;
}
/* */
.search-result svg.svg-inline--fa.fa-circle-check.fa-icon {
    color: rgb(var(--green)) !important;
}
.search-result .entity-name {
    color: rgb(var(--on-surface-variant));
}

button.sprite-button.btn.btn-link > svg.fa-image {
    font-size: 24px;
}

.tagger-container .input-group>.form-control:not(:first-child):not(:last-child) {
    border-radius: 4px;
    left: -34px;
    margin-right: -31px;
    background-color: rgb(var(--card-color));
}
.tagger-container .input-group>.form-control:not(:first-child):not(:last-child):focus {
    background-color: rgb(var(--card-color)) !important;
}
.tagger-container .mt-2.text-right:has(>*.btn-primary):not(.submit-draft) {
    margin-top: 12px !important;
}

/* removed right margin so thumbnail in row fills it container. */
.tagger-container .search-item > .row > .col > .scene-card.mr-3 {
    margin-right: 0 !important;
}

.original-scene-details>.collapse.show>.col:first-of-type>h4 {
    color: rgb(var(--on-sec-container));
}
.original-scene-details>.collapse.show>.col:first-of-type>h5 {
    color: #adcce6;
}
.original-scene-details>.collapse.show>.col:first-of-type>.TruncatedText {
    margin-bottom: 8px;
    font-size: 16px;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0.5px;
    color: rgb(var(--description-color));
}
.original-scene-details>.collapse.show>.col:first-of-type>a.scene-url,
.original-scene-details>.collapse.show>.col:first-of-type>a.scene-path,
.original-scene-details>.collapse.show>.col:first-of-type>span.scene-duration {
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: 0.5px;
    color: rgb(var(--on-surface-variant)) !important;
}

.search-item > .row .original-scene-details > .collapse.show .col:is(:has(*.performer-tag-container)) {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}

.original-scene-details > .collapse.show > .col > div:is(:has(.performer-tag-container)) {
    display: flex;
    margin-left: auto;
    flex-direction: row;
    justify-content: flex-end;
    flex-wrap: wrap;
    align-content: flex-start;
    transform: translate(0%,0%);
    transition: all 0.35s ease-in 0s;
    will-change: transform, margin-left, transition;
}
.original-scene-details > .collapse.show > .col > div:is(:has(.performer-tag-container)) + div:has(>.tag-item),
.original-scene-details > .collapse.show > .col > div:empty + div:has(>.tag-item) {
    margin-left: auto;
    margin-top: auto;
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-content: flex-end;
    justify-content: flex-end;
    height: 110%;
    right: 16px;
    transform: translate(16px, 12px);
    transition: all 0.45s ease 0s;
    will-change: transform, height, right;
}

:is(.performer-tag-container, .movie-tag-container) {
    margin: 4px;
    border: 0;
    background-color: rgb(var(--sec-container));
    border-radius: 4px;
    padding: 8px;
    display: flex;
    flex: 1 1 30%;
    max-width: 33%;
    flex-direction: column;
    justify-content: flex-end;
    align-items: stretch;
    align-content: center;
}
:is(.performer-tag, .movie-tag) > img.image-thumbnail {
    min-width: 75px;
    width: 75px;
}
:is(.performer-tag, .movie-tag) > img.image-thumbnail:hover {
    filter: brightness(1.05);
    transition: filter 0.35s ease 0.15s;
}

.collapse.show > .col > div > .performer-tag-container > a.performer-tag.col {
    display: flex;
    flex: 0 0 30%;
    align-items: center;
    justify-content: center;
    flex-wrap: nowrap;
}

/* Tagger Configuration Card */
.tagger-container .collapse.show.card > .row > hr.w-100 {
    border-top: 1px solid rgb(var(--outline));
    margin-right: 16px;
    margin-left: 16px;
    margin-bottom: 16px;
    margin-top: 4px;
}
small.form-text {
    font-size: 11px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: 0.5px;
    color: rgb(var(--on-surface));
    filter: brightness(0.7);
}
#batch-search-config small.form-text {
    word-break: keep-all;
    word-wrap: normal;
    word-spacing: normal;
    margin-top: -8.5%;
    margin-left: 3%;
    margin-right: 80%;
}

.tagger-container .collapse.show.card .input-group:not(.has-validation)>input.form-control:not(:last-child) {
    border-radius: 4px;
    margin-right: -54px;
    padding-right: 68px;
    background-color: rgb(var(--card-color2));
}
.tagger-container .collapse.show.card h4 {
    color: #cae9e3;
}
.tagger-container .collapse.show.card h5 {
    color: #94d2c6;
}
/*.tagger-container .collapse.show.card .tag-item.badge.badge-secondary {
    padding-top: 0;
    padding-bottom: 38px;
}*/

/* Performer Tagger */
.PerformerTagger-performer {
    border-radius: 1.35rem;
    margin: 12px;
    padding: 12px;
    background-color: rgb(var(--body-color2));
}
.PerformerTagger-box-link.input-group>.input-group-text {
    top: 0;
    left: 0;
}
.PerformerTagger-box-link.input-group>.input-group-append>button.btn.btn-primary {
    margin-left: 0;
}
.PerformerTagger-details>.input-group>input.form-control {
    border-radius: 0.5rem;
}
.PerformerTagger-details>.input-group>.input-group-append>button.btn.btn-primary {
    margin-bottom: 6px;
}

.SceneScrapeModal .input-group:not(.has-validation)>.form-control:not(:last-child) {
    margin-right: -62px;
    border-radius: 0.5rem;
    padding-right: 64px;
}
.SceneScrapeModal .input-group .input-group-append>button.btn.btn-primary[title="Search"] {
    padding: 0 14px;
    margin-right: 18px;
    border-radius: 5rem;
    position: relative;
    top: 8px;
    left: 6px;
    background-color: transparent;
    color: #a8dfd4;
    box-shadow: none;
}
.SceneScrapeModal .input-group .input-group-append>button.btn.btn-primary[title="Search"]:hover:not(:disabled):not(.disabled),
.SceneScrapeModal .input-group .input-group-append>button.btn.btn-primary[title="Search"]:focus:not(:disabled):not(.disabled),
.SceneScrapeModal .input-group .input-group-append>button.btn.btn-primary[title="Search"]:focus-visible:not(:disabled):not(.disabled):not(:focus) {
    background-color: rgba(255,255,255,0.10);
    color: #a8dfd4;
    box-shadow: none;
}
.SceneScrapeModal .input-group .input-group-append>button.btn.btn-primary[title="Search"]:active:not(:disabled):not(.disabled),
.SceneScrapeModal .input-group .input-group-append>button.btn.btn-primary[title="Search"].active:not(:disabled):not(.disabled),
.SceneScrapeModal .input-group .input-group-append>button.btn.btn-primary[title="Search"]:active:hover:not(:disabled):not(.disabled),
.SceneScrapeModal .input-group .input-group-append>button.btn.btn-primary[title="Search"].active:hover:not(:disabled):not(.disabled),
.SceneScrapeModal .input-group .input-group-append>button.btn.btn-primary[title="Search"]:active:focus:not(:disabled):not(.disabled),
.SceneScrapeModal .input-group .input-group-append>button.btn.btn-primary[title="Search"].active:focus:not(:disabled):not(.disabled) {
    background-color: rgba(255,255,255,0.16);
    color: #a8dfd4;
    box-shadow: none;
}

.modal-body .dialog-container>.input-group:not(.has-validation)>input.btn-secondary.form-control:not(:last-child) {
    margin-right: -40px;
    border-radius: 5rem;
    min-height: 56px;
    padding-left: 64px;
}
.modal-body .dialog-container:has(>*.folder-list)>.input-group>.input-group-append>button.btn.btn-secondary:has(>.fa-plus) {
    background-color: transparent;
    border: 0;
    border-radius: 5rem;
    padding: 0 14px 0 14px;
    position: relative;
    top: 8px;
    left: -12px;
}
.modal-body .dialog-container:has(>*.folder-list)>.input-group>.input-group-append>button.btn.btn-secondary:has(>.fa-plus):hover:not(:disabled):not(.disabled),
.modal-body .dialog-container:has(>*.folder-list)>.input-group>.input-group-append>button.btn.btn-secondary:has(>.fa-plus):focus:not(:disabled):not(.disabled),
.modal-body .dialog-container:has(>*.folder-list)>.input-group>.input-group-append>button.btn.btn-secondary:has(>.fa-plus):focus-visible:not(:disabled):not(.disabled):not(:focus) {
    background-color: rgba(255,255,255,0.16);
    box-shadow: none;
}
.modal-body .dialog-container:has(>*.folder-list)>.input-group>.input-group-append>button.btn.btn-secondary:has(>.fa-plus):active:not(:disabled):not(.disabled),
.modal-body .dialog-container:has(>*.folder-list)>.input-group>.input-group-append>button.btn.btn-secondary:has(>.fa-plus):active:hover:not(:disabled):not(.disabled),
.modal-body .dialog-container:has(>*.folder-list)>.input-group>.input-group-append>button.btn.btn-secondary:has(>.fa-plus):active:focus:not(:disabled):not(.disabled) {
    background-color: rgba(255,255,255,0.08);
    box-shadow: none;
}
.modal-body .dialog-container:has(>*.folder-list)>.input-group>.input-group-append>button.btn.btn-secondary:has(>.fa-plus):focus-visible:not(:focus):not(:disabled):not(.disabled) {
    outline-color: #dffffb;
    outline-width: 3px;
    outline-style: solid;
    outline-offset: 0;
}
.modal-body .dialog-content:has(>*.folder-list)>.input-group:not(.has-validation)>input.btn-secondary.form-control {
    min-height: 56px;
}
.modal-body .string-list-input .input-group:not(.has-validation)>input.text-input.form-control:not(:last-child) {
    border-radius: 0.5rem;
    margin-right: -40px;
    padding-right: 64px;
}
.modal-body .string-list-input .input-group>.input-group-append>button.btn.btn-danger:has(>.fa-minus) {
    border: 1px solid #dcf6f0;
    color: #dcf6f0;
    background-color: transparent;
    border-radius: 5rem;
    padding: 0 14px 0 14px;
    position: relative;
    top: 8px;
    left: -12px;
}
.modal-body .string-list-input .input-group>.input-group-append>button.btn.btn-danger:has(>.fa-minus):hover:not(:disabled):not(.disabled),
.modal-body .string-list-input .input-group>.input-group-append>button.btn.btn-danger:has(>.fa-minus):focus:not(:disabled):not(.disabled),
.modal-body .string-list-input .input-group>.input-group-append>button.btn.btn-danger:has(>.fa-minus):focus-visible:not(:disabled):not(.disabled):not(:focus) {
    background-color: rgba(255,255,255,0.08);
    border-color: #ffb4ab;
    color: #ffb4ab;
    box-shadow: none;
}
.modal-body .string-list-input .input-group>.input-group-append>button.btn.btn-danger:has(>.fa-minus):active:not(:disabled):not(.disabled),
.modal-body .string-list-input .input-group>.input-group-append>button.btn.btn-danger:has(>.fa-minus):active:hover:not(:disabled):not(.disabled),
.modal-body .string-list-input .input-group>.input-group-append>button.btn.btn-danger:has(>.fa-minus):active:focus:not(:disabled):not(.disabled) {
    background-color: rgba(255,255,255,0.16);
    border-color: #ffb4ab;
    color: #ffb4ab;
    box-shadow: none;
}
.modal-body .string-list-input .input-group>.input-group-append>button.btn.btn-danger:has(>.fa-minus):focus-visible:not(:focus):not(:disabled):not(.disabled) {
    outline-color: #dffffb;
    outline-width: 3px;
    outline-style: solid;
    outline-offset: 0;
}

.main.container-fluid>div:has(>*.error-message)>h2 {
    color: #690005;
}
.error-message {
    color: #93000a;
}

input#filename-pattern.text-input.form-control {
    border-radius: 0.5rem;
    margin-right: 12px;
}
button#parser-field-select.dropdown-toggle.btn.btn-primary {
    position: relative;
    top: 8px;
}
.duplicate-checker .d-flex.mt-2.mb-2 select.w-auto.ml-2.btn-secondary.form-control {
    width: 100% !important;
}
.duplicate-checker-table tbody>tr td>button.edit-button.btn {
    margin-bottom: 4px;
    margin-top: 4px;
}
#parser-container .form-group>.row.form-group>button.ml-3.col-1.btn.btn-secondary {
    position: relative;
    top: 8px;
}
.preview-button .fa-icon {
    color: #fff;
    height: 2.75em;
    width: 2.75em;
}
.edit-filter-dialog .criterion-list .card .card-header {
    border-bottom: 0;
    border-style: none;
}
.edit-filter-dialog .criterion-list .card {
    border-style: none;
    border: 0;
    border-radius: 0;
}
.edit-filter-dialog .criterion-list .card .filter-item-header {
    background-color: transparent;
    border-bottom: 0;
    border-radius: 1.35rem;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
}
.edit-filter-dialog .criterion-list .card .filter-item-header:focus,
.edit-filter-dialog .criterion-list .card:has(>*.collapse.show) .filter-item-header {
    background-color: rgb(var(--card-color-collaps-show));
    border-color: transparent;
    border-radius: 0;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    box-shadow: none;
    transform: translate(0%,0%);
    transition: tranform 0.25s ease-out 0s;
}
.edit-filter-dialog .criterion-list .card .filter-item-header:focus {
    background-color: transparent;
}


/* Chips/Tag-Items for the Filter Editor */ 
.modifier-options button.modifier-option.btn-primary {
    background-image: none;
    background-color: rgb(var(--surface));
    padding: 0 16px;
    border-radius: 8px;
    color: rgb(var(--on-surface-variant));
    border: 1px solid rgb(var(--outline));
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 0.15px;
    font-weight: 500;
    margin-right: 8px;
    margin-bottom: 8px;
    height: 32px;
    min-height: 32px;
    width: auto;
    box-shadow: var(--elevation-0);
}
.modifier-options button.modifier-option.btn.btn-primary:not(.selected):hover {
    color: rgb(var(--on-surface-variant));
    box-shadow: var(--elevation-0);
    background-image: var(--btn-hover-highlight);
    background-color: rgb(var(--surface));
    background-blend-mode: screen;
    border: 1px solid rgb(var(--outline));
}
.modifier-options button.modifier-option.btn.btn-primary:is(:not(.selected)):focus-visible {
    background-image: linear-gradient(to right, rgb(var(--pry-container)), rgb(var(--pry-container))) !important;
    background-color: transparent;
    color: rgb(var(--on-tertiary-container));
    outline-color: rgb(var(--focus-ring));
    outline-offset: -0.1rem;
    outline-style: solid;
    outline-width: 0.19rem;
    box-shadow: none;
}

.modifier-options button.modifier-option.selected::before {
    content: "\xb9";
    font-family: var(--UnicodeFont);
    font-weight: 500;
    font-size: 18px;
    display: inline-block;
    color: rgb(var(--green));
}
.modifier-options button.modifier-option.selected,
.modifier-options button.modifier-option.btn.btn-primary:is(:not(.disabled, :disabled):not(.selected)):is(:focus) {
    background-color: transparent;
    background-image: linear-gradient(to right, rgb(var(--tertiary-container)), rgb(var(--tertiary-container)));
    box-shadow: var(--elevation-0);
    color: rgb(var(--on-tertiary-container)) !important;
    border: 1px solid rgb(var(--tertiary-container));
    opacity: 1;
    transition: background-image 0.55s ease, border 0.25s ease-in, box-shadow 0.4s ease-out, background-color 0.55s ease-in;
}
.modifier-options button.modifier-option.btn.btn-primary:is(:not(.disabled, :disabled).selected):is(:active, :active:focus) {
    color: rgb(var(--on-tertiary-container));
    box-shadow: var(--elevation-0);
    background-image: var(--btn-active-highlight);
    background-color: rgb(var(--tertiary-container));
    background-blend-mode: screen;
    border: 1px solid rgb(var(--tertiary-container));
}
.modifier-options button.modifier-option.btn.btn-primary:is(:not(.disabled, :disabled).selected):is(:hover) {
    color: rgb(var(--on-tertiary-container));
    box-shadow: var(--elevation-1);
    background-image: var(--btn-hover-highlight);
    background-color: rgb(var(--tertiary-container));
    background-blend-mode: screen;
    border: 1px solid rgb(var(--tertiary-container));
}
.modifier-options button.modifier-option.selected.btn.btn-primary:focus-visible {
    background-color: transparent;
    background-image: linear-gradient(to right, rgb(var(--tertiary-container)), rgb(var(--tertiary-container)));
    color: rgb(var(--on-pry-container)) !important;
    outline-color: rgb(var(--focus-ring));
    outline-offset: -0.1rem;
    outline-style: solid;
    outline-width: 0.19rem;
    box-shadow: none;
}
/* * */

/* Critereion Filter Editor */
.criterion-editor .form-group:has(>.input-group > input[placeholder="File path"].btn-secondary.form-control) {
    position: relative;
}
.criterion-editor .form-group:has(>.input-group > input[placeholder="File path"].btn-secondary.form-control)::before {
    content: "File path";
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: 1px;
    color: rgb(var(--pry-color));
    background-color: rgb(var(--card-color-collaps-show));
    position: relative;
    padding-left: 4px;
    padding-right: 4px;
    margin-bottom: -1.75%;
    margin-left: 16px;
    z-index: 5;
    transform: translate(0%,0%);
    transition: all 0.35s ease;
    visibility: hidden;
}
.criterion-editor .form-group:has(>.input-group > input[placeholder="File path"].btn-secondary.form-control):focus-within::before {
    visibility: visible;
}

.criterion-editor > div > .form-group + .form-group > div > div.react-select__control {
    background-color: transparent;
    color: rgb(var(--on-surface-variant));
    width: 100%;
}
/* Folder-List Unicode Characters */
.criterion-editor .folder-list-item .btn span::before {
    content: "\xa9 \x01F5BF";
    font-size: 20px;
    color: rgb(var(--on-surface-variant));
    padding-right: 16px;
}
.criterion-editor .folder-list-item .btn span {
    color: rgb(var(--on-surface-variant));
}
/* Folder-Lists */
.criterion-editor .form-group .folder-list.collapse.show > .folder-list-item > button.btn.btn-link {
    background-color: transparent;
    padding: 0 8px;
    border-radius: 8px;
}
.criterion-editor .form-group .folder-list.collapse.show > .folder-list-item > button.btn.btn-link:hover {
    box-shadow: none;
    border-radius: 8px;
    background-color: rgb(var(--on-surface),var(--btn-hover));
}
.criterion-editor .form-group ul.folder-list.collapse.show {
        overflow-x: visible;
}
/* Parent Folder Icon */
.criterion-editor .folder-list-parent.folder-list-item .btn span::before {
    content: "\A71B";
    visibility: visible;
}
/* Search Bar in Tags */
.criterion-editor input.clearable-text-field.form-control {
    border: 1px solid rgb(var(--outline));
}
.criterion-editor input.clearable-text-field.form-control:hover {
    border: 1px solid rgb(var(--on-surface-variant));
}

.criterion-editor .form-group:has(>input[placeholder="phash"].btn-secondary.form-control) {
    position: relative;
}
.criterion-editor .form-group:has(>input[placeholder="phash"].btn-secondary.form-control)::before {
    content: "phash";
    font-size: 12px;
    color: rgb(var(--pry-color));
    background-color: rgb(var(--card-color-collaps-show));
    position: relative;
    padding-left: 4px;
    padding-right: 4px;
    margin-bottom: -2.5%;
    margin-left: 16px;
    z-index: 5;
    transform: translate(0%,0%);
    visibility: hidden;
}
.criterion-editor .form-group:has(>input[placeholder="phash"].btn-secondary.form-control):focus-within::before {
    visibility: visible;
}

.criterion-editor .form-group:has(>input[placeholder="Stash ID Endpoint"].btn-secondary.form-control) {
    position: relative;
}
.criterion-editor .form-group:has(>input[placeholder="Stash ID Endpoint"].btn-secondary.form-control)::before {
    content: "Stash ID Endpoint";
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: 1px;
    color: rgb(var(--pry-color));
    background-color: rgb(var(--card-color-collaps-show));
    position: relative;
    padding-left: 4px;
    padding-right: 4px;
    margin-bottom: -1.75%;
    margin-left: 16px;
    z-index: 5;
    transform: translate(0%,0%);
    visibility: hidden;
}
.criterion-editor .form-group:has(>input[placeholder="Stash ID Endpoint"].btn-secondary.form-control):focus-within::before {
    visibility: visible;
}
.criterion-editor .form-group:nth-child(2):has(>input[placeholder="Stash ID"].btn-secondary.form-control) {
    position: relative;
}
.criterion-editor .form-group:nth-child(2):has(>input[placeholder="Stash ID"].btn-secondary.form-control)::before {
    content: "Stash ID";
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: 1px;
    color: rgb(var(--pry-color));
    background-color: rgb(var(--card-color-collaps-show));
    position: relative;
    padding-left: 4px;
    padding-right: 4px;
    margin-bottom: -1.75%;
    margin-left: 16px;
    z-index: 5;
    transform: translate(0%,0%);
    visibility: hidden;
}
.criterion-editor .form-group:nth-child(2):has(>input[placeholder="Stash ID"].btn-secondary.form-control):focus-within::before {
    visibility: visible;
}



/* * */

button.btn.btn-primary.btn-sm:first-child {
    border-bottom-left-radius: 5rem;
}
button.btn.btn-primary.btn-sm:last-child {
    border-bottom-right-radius: 5rem;
}
.stats-element {
    margin: auto .5rem 2rem .5rem;
}

.tagger-container .d-flex.align-items-center .d-flex > button + button.ml-1.btn.btn-primary /* Spacing for Tagger-Container top buttons */ {
    margin-left: 1rem !important;
}
.tagger-container .d-flex.align-items-center .d-flex:last-of-type > button + button.ml-1.btn.btn-primary /* * */ {
    margin-right: -0.25rem;
}

.tagger-container .d-flex > .w-auto + .d-flex button.btn.btn-primary:is(:disabled, .disabled) /* Disabled Tagger-Conatainer top buttons */ {
    background-image: linear-gradient(to right, rgb(var(--tertiary),var(--disabled)) rgb(var(--tertiary),var(--disabled)));
    background-color: rgb(var(--body-color2));
    background-blend-mode: normal;
}

.row:has(>:is(label[for="batch-search-delay"], label[for="colorize-color-green"], label[for="colorize-color-yellow"], label[for="colorize-color-red"])) {
    flex-wrap: nowrap;
}
:is(label[for="batch-search-delay"], label[for="colorize-color-green"], label[for="colorize-color-yellow"], label[for="colorize-color-red"]) {
    margin-right: 30px;
    white-space: normal;
    padding-right: 0;
}
/* *** */

/* Radio Button Replacements */
.form-check:has(>input[type="radio"]) {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: flex-start;
    position: relative;
}
.form-check > input[type="radio"] + label {
    margin-left: 11px;
    margin-top: -2px;
    padding-bottom: 13px;
    margin-bottom: 0.15rem;
}
.form-check > input[type="radio"]::before {
    content: "";
    display: flex;
    vertical-align: top;
    width: 20px;
    height: 20px;
    border-radius: 5rem;
    border: 2px solid rgb(var(--on-surface-variant));
    background-color: rgb(var(--card-color2));
    opacity: 1;
    transition: all 0.2s ease-in 0.05s;
}
.form-check > input[type="radio"]:hover::before {
    background-color: rgb(var(--card-color2-hover));
    border: 2px solid rgb(var(--on-surface));
    box-shadow: 0 0 0 8px rgb(var(--card-color2-hover));
}
.form-check > input[type="radio"]:checked::before {
    box-shadow: inset 0 0 0 3px rgb(var(--card-color-collaps-show));
    background-color: rgb(var(--pry-color));
    border: 2px solid rgb(var(--pry-color));
}
.form-check > input[type="radio"]:hover:checked::before {
    box-shadow: inset 0 0 0 3px rgb(var(--card-color2)), 0 0 0 8px rgb(var(--card-color2-hover));
    background-color: rgb(var(--pry-color));
    border: 2px solid rgb(var(--pry-color));
}
.form-check > input[type="radio"]:focus-visible::before {
    background-color: rgba(var(--pry-container));
    border: 2px solid rgb(var(--on-tertiary-container));
    outline-width: 0.19rem;
    outline-style: solid;
    outline-color: rgb(var(--focus-ring));
    outline-offset: 0.1rem;
}
.form-check > input[type="radio"]:focus-visible:checked::before {
    outline-width: 0.19rem;
    outline-style: solid;
    outline-color: rgb(var(--focus-ring));
    outline-offset: 0.1rem;
    background-color: rgba(var(--focus-ring));
    border: 2px solid rgb(var(--on-tertiary-container));
    box-shadow: inset 0 0 0 3px rgb(var(--pry-container));
}
/* Radio Buttons Misc. Background-Colors etc. */
#query-edit-config .form-check:has(>input[type="radio"]) {
    justify-content: space-between;
}

#query-edit-config .form-check:has(>input[type="radio"]) > input[type="radio"] + label, 
#query-edit-config .form-check:has(>input[type="radio"]) > input[type="radio"] + label ~ label {
    margin-left: 8px;
    margin-right: 24px;
    margin-top: -8px;
    padding-bottom: 0;
    margin-bottom: 8px;
    position: relative;
    bottom: -9px;
}

#query-edit-config .form-check:has(>input[type="radio"]) > input[type="radio"] ~ input[type="radio"] {
    margin-left: 16px;
}

/* Checkbox Button Replacements */
/*.form-check:has(>input[type="checkbox"]) {
    display: inline-block;
    position: relative;
    z-index: 0;
    line-height: 1.5;
    font-size: 16px;
    font-family: 'Roboto Flex','Roboto';
    margin-bottom: 6px;
    margin-top: 10px;
    width: 100%;
}
.form-check > input[type=checkbox] {
    appearance: none;
    --moz-appearance: none;
    -webkit-appearance: none;
    z-index: -1;
    position: absolute;
    display: block;
    border-radius: 5rem;
    background-color: rgb(var(--on-surface),var(--btn-hover));
    width: 40px;
    height: 40px;
    top: -9px;
    left: -7px;
    opacity: 0;
    box-shadow: none;
    outline: none;
    pointer-events: none;
    transform: scale(1);
    transition: opacity 0.4s, transform 0.45s;
}
.form-check > input[type="checkbox"] + label {
    margin: 0;
    display: inline-block;
    width: 100%;
    cursor: pointer;
}
.form-check > input[type="checkbox"] + label::before {
    content: " ";
    margin: 0 16px 0 -30px;
    display: inline-block;
    border: solid 2px;
    border-color: rgb(var(--on-surface-variant));
    border-radius: 2px;
    width: 18px;
    height: 18px;
    vertical-align: top;
    transition: border-color 0.35s, background-color 0.55s;
}
.form-check > input[type="checkbox"] + label::after {
    content: "\xb9";
    display: block;
    position: absolute;
    font-size: 18px;
    color: transparent;
    top: -4px;
    left: -12px;
    transform: scale(1);
}
.form-check > input[type=checkbox]:is(:checked, :indeterminate) {
    background-color: rgb(var(--pry-color));
}
.form-check > input[type=checkbox]:is(:checked, :indeterminate) + label::before {
    border-color: rgb(var(--pry-color));
    background-color: rgb(var(--pry-color));
}
.form-check > input[type=checkbox]:is(:checked, :indeterminate) + label::after {
    color: rgb(var(--on-sec));
}
.form-check > input[type="checkbox"]:indeterminate + label::after {
    content: "\x93D";
}
.form-check:hover > input[type="checkbox"] {
    opacity: 0.24;
}
.form-check > input[type="checkbox"]:focus {
    opacity: 0.32;
}
.form-check:hover > input[type="checkbox"]:focus {
    opacity: 0.38;
}
.form-check > input[type="checkbox"]:active {
    opacity: 1;
    transform: scale(0);
    transition: transform 0s, opacity 0s;
}
.form-check > input[type="checkbox"]:active + label::before {
    border-color: rgb(var(--on-surface));
}
.form-check > input[type="checkbox"]:checked:active + label::before {
    background-color: rgb(0,0,0,0.6);
}
.form-check > input[type="checkbox"]:disabled {
    opacity: 0;
}
.form-check > input[type="checkbox"]:disabled + label {
    cursor: initial;
}
.form-check > input[type="checkbox"]:disabled + label::before {
    border-color: currentColor;
}
.form-check > input[type="checkbox"]:checked:disabled + label::before,
.form-check > input[type="checkbox"]:indeterminate:disabled + label::before {
    border-color: transparent;
    background-color: currentColor;
}

.criterion-editor .form-check > input[type=checkbox],
.modal-content .form-check > input[type=checkbox] {
    appearance: none;
    --moz-appearance: none;
    -webkit-appearance: none;
    z-index: -1;
    position: absolute;
    display: block;
    border-radius: 5rem;
    background-color: rgb(var(--on-surface),var(--btn-hover));
    width: 40px;
    height: 40px;
    left: 1.8%;
    top: -8px;
    opacity: 0;
    box-shadow: none;
    outline: none;
    pointer-events: none;
    transform: scale(1);
    transition: opacity 0.4s, transform 0.45s;
}
.criterion-editor .form-check > input[type="checkbox"] + label,
.modal-content .form-check > input[type="checkbox"] + label {
    margin: -30px 0px -20px 0;
    position: absolute;
    white-space: normal;
}
.criterion-editor .form-check > input[type="checkbox"] + label::before,
.modal-content .form-check > input[type="checkbox"] + label::before {
    margin: 0 16px 20px -16px;
}
.criterion-editor .form-check > input[type="checkbox"] + label::after {
    left: 2px;
}*/

/* Performer Page Background-Image-Container's Elevated Buttons */
.background-image-container + .detail-container .details-edit button,
.background-image-container + .detail-container .details-edit button:not(.disabled):not(:disabled):is(:focus, :active, :active:focus) {
    box-shadow: var(--elevation-1);
}
div.detail-header div.background-image-container + div.detail-container div.details-edit button:not(.disabled):not(:disabled):hover,
div.detail-header div.background-image-container + div.detail-container div.details-edit button.btn.btn-secondary:not(.disabled):not(:disabled):hover {
    box-shadow: var(--elevation-2);
}

span.detail-expand-collapse > button.minimal.expand-collapse.btn.btn-primary {
    font-size: 24px;
    color: rgb(var(--on-surface-variant));
    min-width: 40px;
    width: 40px;
    height: 40px;
    border-radius: 5rem;
    background-color: transparent;
    border: 0;
    box-shadow: none;
}
span.detail-expand-collapse > button.minimal.expand-collapse.btn.btn-primary:hover {
    color: rgb(var(--on-surface-variant));
    background-color: rgb(var(--on-surface-variant),var(--btn-hover));
    box-shadow: var(--elevation-1);
}
span.detail-expand-collapse > button.minimal.expand-collapse.btn.btn-primary:not(.disabled):not(:disabled):is(:active, :focus, :active:focus) {
    color: rgb(var(--on-surface-variant));
    background-color: rgb(var(--on-surface-variant),var(--btn-active));
    box-shadow: var(--elevation-0);
    outline: none;
}

/*** Button Ripple ***/
body :is(:not(.collapse.show.card .input-group):has(> .input-group-append)) button:not(.navbar-buttons a[href$="/new"] > button).btn.btn-primary:not(.scrubber-button):not(.minimal):not([title="Search"])::after {
    content: "";
    display: block;
    position: absolute;
    left: 50%;
    top: 50%;
    width: 92px;
    height: 92px;
    margin-left: -46px;
    margin-top: -30px;
    background: radial-gradient(ellipse, #d4ebff9a 0%, #ffffffca 35%, #82c5b8 100%);
    border-radius: 5rem;
    opacity: 0.6;
    transform: scale(0);
    will-change: auto;
}
a:not([href^="/scenes"]):not([href^="/images"]):not([href^="/movies"]):not([href^="/scenes/markers"]):not([href^="/galleries"]):not([href^="/performers"]):not([href^="/studios"]):not([href^="/tags"]).minimal::after, 
button:not(.brand-link).minimal:not(.scene-count>button.minimal):not(:where(.o-counter,.o-count)>button.minimal):not(.image-count>button.minimal):not(.gallery-count>button.minimal):not(.organized>button.minimal):not(.tag-count>button.minimal):not(.performer-count>button.minimal):not(.organized-button)::after, 
.navbar-brand button.minimal.brand-link.d-inline-block.btn.btn-primary::after,
button#operation-menu.minimal.dropdown-toggle.btn.btn-secondary::after,
.card-popovers a.pwPlayer_button::after {
    content: "";
    display: block;
    position: absolute;
    left: 50%;
    top: 50%;
    width: 90px;
    height: 90px;
    margin-left: -45px;
    margin-top: -30px;
    background: radial-gradient(ellipse, #dffffb9a 0%, #ffffffca 20%, #373d3b 100%);
    border-radius: 5rem;
    opacity: 0.6;
    transform: scale(0);
    will-change: auto;
}
.navbar-brand button.minimal.brand-link.d-inline-block.btn.btn-primary::after {
    background: radial-gradient(ellipse, #ffffffa9 0%, #dffffba9 35%, #202B33 100%);
    opacity: 0.5;
    top: 90%;
    transform: scale(0);
    transition: transform 0s;
    will-change: auto;
}


.top-nav .navbar-buttons:not(:has(a[href^="/scenes/new"])):not(:has(a[href^="/movies/new"])):not(:has(a[href^="/galleries/new"])):not(:has(a[href^="/performers/new"])):not(:has(a[href^="/studios/new"])):not(:has(a[href^="/tags/new"])) .btn:not(.donate)::after,
.top-nav .navbar-buttons a.nav-utility button.minimal.btn.btn-primary:not(.donate)::after,
.top-nav .navbar-buttons button.minimal.btn.btn-primary:not(.donate)::after,
.modal-header .close::after {
    content: "";
    display: block;
    position: absolute;
    left: 50%;
    top: 50%;
    width: 48px;
    height: 48px;
    margin-left: -20px;
    margin-top: -20px;
    background: radial-gradient(circle at center, #d4ebff9a 0%, #ffffffca 35%, #687988 100%);
    border-radius: 50%;
    opacity: 0.6;
    transform: scale(0);
    will-change: auto;
}
.top-nav .navbar-buttons a.nav-utility button[title="Donate"].minimal.donate.btn.btn-primary::after,
button.minimal.collapse-button.btn-primary::after,
button.tag-list-button.btn.btn-secondary:has(>.tag-list-anchor)::after {
    content: "";
    display: block;
    position: absolute;
    left: 50%;
    top: 50%;
    width: 92px;
    height: 92px;
    margin-left: -46px;
    margin-top: -30px;
    background: radial-gradient(ellipse, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 100%);
    border-radius: 5rem;
    opacity: 0.6;
    transform: scale(0);
    will-change: auto;
}
/* Nav-Tabs cented ripple */
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter))::after, 
.nav-tabs .nav-item.nav-link::after,
.nav-tabs .nav-link::after,
.show > .dropdown-menu.show .dropdown-item::after {
    content: "";
    display: block;
    position: absolute;
    width: 92px;
    height: 92px;
    background: radial-gradient(ellipse, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 100%) center/15000%;
    border-radius: 5rem;
    opacity: 0.6;
    transform: scale(0);
    will-change: auto;
}
div:not(.pagination)>button:not(.tag-list-button:has(>.tag-list-anchor)):not(.duration-button):not(.scrape-url-button):not(.percent-button).btn.btn-secondary:not(:has(>.fa-plus)):not(:has(>.fa-calendar))::after,
.justify-content-center.btn-toolbar > .mb-2 > select.btn-secondary.form-control::after {
    content: "";
    display: block;
    position: absolute;
    left: 50%;
    top: 50%;
    width: 51px;
    height: 51px;
    margin-left: -23px;
    margin-top: -15px;
    background: radial-gradient(ellipse, #ffffffa9 0%, #dffffba9 35%, #202B33 100%);
    border-radius: 5rem;
    opacity: 0.4;
    transform: scale(0);
    will-change: auto;
}
/*nav.top-nav.navbar .navbar-buttons .mr-2 a[href^="/scenes/new"]>button.btn.btn-primary::after, 
nav.top-nav.navbar .navbar-buttons .mr-2 a[href^="/galleries/new"]>button.btn.btn-primary::after, 
nav.top-nav.navbar .navbar-buttons .mr-2 a[href^="/movies/new"]>button.btn.btn-primary::after, 
nav.top-nav.navbar .navbar-buttons .mr-2 a[href^="/performers/new"]>button.btn.btn-primary::after, 
nav.top-nav.navbar .navbar-buttons .mr-2 a[href^="/studios/new"]>button.btn.btn-primary::after, 
nav.top-nav.navbar .navbar-buttons .mr-2 a[href^="/tags/new"]>button.btn.btn-primary::after,*/
.pagination button.btn.btn-secondary::after {
    content: "";
    display: block;
    position: absolute;
    left: 50%;
    top: 50%;
    width: 92px;
    height: 92px;
    margin-left: -46px;
    margin-top: -30px;
    background: radial-gradient(ellipse, #d4ebff9a 0%, #ffffffca 35%, #57605e 100%);
    border-radius: 5rem;
    opacity: 0.6;
    transform: scale(0);
    will-change: auto;
}
.btn-danger:has(>:not(.fa-minus))::after {
    content: "";
    display: block;
    position: absolute;
    left: 50%;
    top: 50%;
    width: 92px;
    height: 92px;
    margin-left: -46px;
    margin-top: -30px;
    background: radial-gradient(ellipse, #fff8f89a 0%, #ffffffca 35%, #bf1400 100%);
    border-radius: 5rem;
    opacity: 0.6;
    transform: scale(0);
    will-change: auto;
}
.btn-success::after {
    content: "";
    display: block;
    position: absolute;
    left: 50%;
    top: 50%;
    width: 92px;
    height: 92px;
    margin-left: -46px;
    margin-top: -30px;
    background: radial-gradient(ellipse, #f8fbfa9a 0%, #ffffffca 35%, #59877b 100%);
    border-radius: 5rem;
    opacity: 0.6;
    transform: scale(0);
    will-change: auto;
}
@keyframes ripple {
    0% {
        transform: scale(0);
    }
    80% {
        transform: scale(2.5);
    }
    100% {
        transform: scale(4);
        opacity: 0;
    }
}
@keyframes nav-ripple {
    0% {
        transform: scale(0);
    }
    100% {
        transform: scale(2.25);
        opacity: 0;
    }
}
body :is(:not(.collapse.show.card .input-group):has(> .input-group-append)) button:not(.navbar-buttons a[href$="/new"] > button).btn.btn-primary:not(.scrubber-button):not(.minimal):not([title="Search"]):not(:active):not(.active)::after,
.top-nav .navbar-buttons:not(:has(a[href^="/scenes/new"])):not(:has(a[href^="/movies/new"])):not(:has(a[href^="/galleries/new"])):not(:has(a[href^="/performers/new"])):not(:has(a[href^="/studios/new"])):not(:has(a[href^="/tags/new"])) .btn:not(:active):not(.active):not(.donate)::after,
.top-nav .navbar-buttons a.nav-utility button.minimal.btn.btn-primary:not(:active):not(.active):not(.donate)::after,
.top-nav .navbar-buttons button.minimal.donate.btn.btn-primary:not(:active):not(.active)::after,
button.minimal.collapse-button.btn-primary:not(:active):not(.active)::after,
.modal-header .close:not(:active):not(.active)::after,
.recommendation-row-head>a:not(:active):not(.active)::after,
div:not(.pagination)>button:not(.duration-button):not(.scrape-url-button):not(.percent-button).btn.btn-secondary:not(:has(>.fa-plus)):not(:has(>.fa-calendar)):not(:active):not(.active)::after,
.btn-danger:has(>:not(.fa-minus)):not(:active):not(.active)::after,
.btn-success:not(:active):not(.active)::after,
a:not([href^="/scenes"]):not([href^="/images"]):not([href^="/movies"]):not([href^="/scenes/markers"]):not([href^="/galleries"]):not([href^="/performers"]):not([href^="/studios"]):not([href^="/tags"]).minimal:not(:active):not(.active)::after, 
button:not(.brand-link).minimal:not(.scene-count>button.minimal):not(:where(.o-counter,.o-count)>button.minimal):not(.image-count>button.minimal):not(.gallery-count>button.minimal):not(.organized>button.minimal):not(.tag-count>button.minimal):not(.performer-count>button.minimal):not(.organized-button):not(:active):not(.active)::after, 
button#operation-menu.minimal.dropdown-toggle.btn.btn-secondary:not(:active):not(.active)::after,
.card-popovers a.pwPlayer_button:not(:active):not(.active)::after,
.pagination button.btn.btn-secondary:not(:hover)::after,
.justify-content-center.btn-toolbar > .mb-2 > select.btn-secondary.form-control:not(:hover)::after,
button.tag-list-button.btn.btn-secondary:not(:active):not(.active)::after,
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter)):not(:hover)::after, 
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter)):not(:hover:active)::after,
.nav-tabs .nav-item.nav-link:not(:hover)::after,
.nav-tabs .nav-link:not(:hover)::after,
.show > .dropdown-menu.show .dropdown-item:not(:active)::after {
    animation: ripple 0.85s ease-in-out forwards;
    will-change: animation;
}
.navbar-brand button.minimal.brand-link.d-inline-block.btn.btn-primary:not(:active):not(.active)::after {
    animation: nav-ripple 0.85s ease forwards;
    will-change: animation;
}
body :is(:not(.collapse.show.card .input-group):has(> .input-group-append)) button:not(.navbar-buttons a[href$="/new"] > button).btn.btn-primary:not(.scrubber-button):not(.minimal):not([title="Search"])::after,
.top-nav .navbar-buttons:not(:has(a[href^="/scenes/new"])):not(:has(a[href^="/movies/new"])):not(:has(a[href^="/galleries/new"])):not(:has(a[href^="/performers/new"])):not(:has(a[href^="/studios/new"])):not(:has(a[href^="/tags/new"])) .btn::after,
.top-nav .navbar-buttons a.nav-utility button.minimal.btn.btn-primary:not(.donate)::after,
.top-nav .navbar-buttons button.minimal.donate.btn.btn-primary::after,
button.minimal.collapse-button.btn-primary::after,
.modal-header .close::after,
.recommendation-row-head>a::after,
div:not(.pagination)>button:not(.duration-button):not(.scrape-url-button):not(.percent-button).btn.btn-secondary:not(:has(>.fa-plus)):not(:has(>.fa-calendar))::after,
.btn-danger:has(>:not(.fa-minus))::after,
.btn-success::after,
a:not([href^="/scenes"]):not([href^="/images"]):not([href^="/movies"]):not([href^="/scenes/markers"]):not([href^="/galleries"]):not([href^="/performers"]):not([href^="/studios"]):not([href^="/tags"]).minimal::after, 
button:not(.brand-link).minimal:not(.scene-count>button.minimal):not(:where(.o-counter,.o-count)>button.minimal):not(.image-count>button.minimal):not(.gallery-count>button.minimal):not(.organized>button.minimal):not(.tag-count>button.minimal):not(.performer-count>button.minimal):not(.organized-button)::after, 
.navbar-brand button.minimal.brand-link.d-inline-block.btn.btn-primary::after,
button#operation-menu.minimal.dropdown-toggle.btn.btn-secondary::after,
.card-popovers a.pwPlayer_button::after,
.pagination button.btn.btn-secondary:not(.active):not(:active)::after,
.justify-content-center.btn-toolbar > .mb-2 > select.btn-secondary.form-control::after,
button.tag-list-button.btn.btn-secondary::after,
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter))::after, 
.nav-tabs .nav-item.nav-link::after,
.nav-tabs .nav-link::after,
.show > .dropdown-menu.show .dropdown-item::after {
    visibility: hidden;
}
body :is(:not(.collapse.show.card .input-group):has(> .input-group-append)) button:not(.navbar-buttons a[href$="/new"] > button).btn.btn-primary:not(.scrubber-button):not(.minimal):not([title="Search"]):focus:not(:focus-visible)::after,
.top-nav .navbar-buttons:not(:has(a[href^="/scenes/new"])):not(:has(a[href^="/movies/new"])):not(:has(a[href^="/galleries/new"])):not(:has(a[href^="/performers/new"])):not(:has(a[href^="/studios/new"])):not(:has(a[href^="/tags/new"])) .btn:focus:not(:focus-visible)::after,
.top-nav .navbar-buttons a.nav-utility button.minimal.btn.btn-primary:not(.donate):focus:not(:focus-visible)::after,
.top-nav .navbar-buttons button.minimal.donate.btn.btn-primary:focus:not(:focus-visible)::after,
button.minimal.collapse-button.btn-primary:focus:not(:focus-visible)::after,
.modal-header .close:focus:not(:focus-visible)::after,
.recommendation-row-head>a:focus:not(:focus-visible)::after,
div:not(.pagination)>button:not(.duration-button):not(.scrape-url-button):not(.percent-button).btn.btn-secondary:not(:has(>.fa-plus)):not(:has(>.fa-calendar)):focus:not(:focus-visible)::after,
.btn-danger:has(>:not(.fa-minus)):focus:not(:focus-visible)::after,
.btn-success:focus:not(:focus-visible)::after,
a:not([href^="/scenes"]):not([href^="/images"]):not([href^="/movies"]):not([href^="/scenes/markers"]):not([href^="/galleries"]):not([href^="/performers"]):not([href^="/studios"]):not([href^="/tags"]).minimal:focus:not(:focus-visible)::after, 
button:not(.brand-link).minimal:not(.scene-count>button.minimal):not(:where(.o-counter,.o-count)>button.minimal):not(.image-count>button.minimal):not(.gallery-count>button.minimal):not(.organized>button.minimal):not(.tag-count>button.minimal):not(.performer-count>button.minimal):not(.organized-button):focus:not(:focus-visible)::after, 
.navbar-brand button.minimal.brand-link.d-inline-block.btn.btn-primary:focus:not(:focus-visible)::after,
button#operation-menu.minimal.dropdown-toggle.btn.btn-secondary:focus:not(:focus-visible)::after,
.card-popovers a.pwPlayer_button:focus:not(:focus-visible)::after,
.pagination button.btn.btn-secondary:focus:not(:focus-visible)::after,
.justify-content-center.btn-toolbar > .mb-2 > select.btn-secondary.form-control:focus::after,
button.tag-list-button.btn.btn-secondary:focus:not(:focus-visible)::after,
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter)):focus::after, 
.nav-tabs .nav-item.nav-link:focus::after,
.nav-tabs .nav-link:focus::after,
.nav-tabs>.nav-item:has(>*:not(.btn-secondary):not(.dropdown):not(.o-counter)).active:focus::after, 
.nav-tabs .nav-item.nav-link.active:focus::after,
.nav-tabs .nav-link.active:focus::after,
.show > .dropdown-menu.show .dropdown-item:focus:not(:focus-visible)::after {
    visibility: visible;
}

/* *** ||Circle Buttons *** */
.navbar-dark .navbar-toggler.collapsed::before,
.navbar-dark .navbar-toggler:not(.collapsed)::before {
    content: "";
    display: block;
    position: absolute;
    left: 49%;
    top: 49%;
    width: 2px;
    height: 2px;
    /*margin-left: -46px;
    margin-top: -30px;*/
    background: radial-gradient(circle at center, rgba(var(--btn-toggler-color),var(--btn-hover)) 0%, rgba(var(--btn-toggler-color),var(--btn-hover)) 100%);
    border-radius: 50%;
    opacity: 1;
    transform: scale(0);
}
.top-nav .navbar-buttons:not(:has(a[href^="/scenes/new"])):not(:has(a[href^="/movies/new"])):not(:has(a[href^="/galleries/new"])):not(:has(a[href^="/performers/new"])):not(:has(a[href^="/studios/new"])):not(:has(a[href^="/tags/new"])) .btn:not(.donate)::before,
.top-nav .navbar-buttons a.nav-utility button.minimal.btn.btn-primary:not(.donate)::before,
button[title=Help].nav-utility.minimal.btn.btn-primary:has(>svg.svg-inline--fa.fa-circle-question.fa-icon)::before,
.top-nav .navbar-buttons a.minimal.logout-button.btn.btn-primary::before {
    content: "";
    display: block;
    position: absolute;
    right: 50%;
    top: 50%;
    width: 2px;
    height: 2px;
    background: radial-gradient(circle at center, rgba(var(--btn-toggler-color),var(--btn-hover)) 0%, rgba(var(--btn-toggler-color),var(--btn-hover)) 100%);
    border-radius: 50%;
    opacity: 1;
    transform: scale(0);
}
#performer-page .performer-head .name-icons button:is(.favorite, .not-favorite).btn-primary::before,
button:is(.favorite, .not-favorite).minimal.favorite-button.btn.btn-primary::before {
    content: "";
    display: block;
    position: absolute;
    right: 50%;
    top: 50%;
    width: 2px;
    height: 2px;
    background-image: radial-gradient(circle at center, rgb(255,255,255,0.08) 0%, rgb(255,255,255,0.08) 100%);
    background-color: rgb(var(--split-comp-container));
    background-blend-mode: screen;
    border-radius: 5rem;
    opacity: 1;
    transform: scale(0);
    z-index: -1;
}
#performer-page .performer-head .name-icons button.icon-link.btn-primary:has(>a.twitter)::before {
    content: "";
    display: block;
    position: absolute;
    right: 50%;
    top: 50%;
    width: 2px;
    height: 2px;
    background-image: radial-gradient(circle at center, rgb(255,255,255,0.08) 0%, rgb(255,255,255,0.08) 100%);
    background-color: rgb(var(--twitter-secondary));
    background-blend-mode: screen;
    border-radius: 5rem;
    opacity: 1;
    transform: scale(0);
}

.detail-header.edit button:where(.star-fill-100, .star-fill-90, .star-fill-80, .star-fill-75, .star-fill-70, .star-fill-60, .star-fill-50, .star-fill-40, .star-fill-30, .star-fill-30, .star-fill-25, .star-fill-20, .star-fill-10, .star-fill-0).minimal.btn.btn-secondary::before {
    content: "";
    display: block;
    position: absolute;
    right: 50%;
    top: 50%;
    width: 2px;
    height: 2px;
    background-image: radial-gradient(circle at center, rgb(var(--body-color2)) 0%, rgb(var(--body-color2)) 100%);
    background-color: rgb(var(--star-color),var(--btn-hover));
    background-blend-mode: screen;
    border-radius: 5rem;
    opacity: 1;
    transform: scale(0);
}
button:where(.star-fill-100, .star-fill-90, .star-fill-80, .star-fill-75, .star-fill-70, .star-fill-60, .star-fill-50, .star-fill-40, .star-fill-30, .star-fill-30, .star-fill-25, .star-fill-20, .star-fill-10, .star-fill-0).minimal.btn.btn-secondary::before {
    content: "";
    display: block;
    position: absolute;
    right: 50%;
    top: 50%;
    width: 2px;
    height: 2px;
    background-image: none;
    background-color: rgb(var(--star-color),var(--btn-hover));
    background-blend-mode: screen;
    border-radius: 5rem;
    opacity: 1;
    transform: scale(0);
}
.detail-header .name-icons button.minimal.icon-link.btn.btn-primary:has(>a.link>svg.fa-link)::before {
    content: "";
    display: block;
    position: absolute;
    right: 50%;
    top: 50%;
    width: 2px;
    height: 2px;
    background-image: radial-gradient(circle at center, rgb(255,255,255,0.08) 0%, rgb(255,255,255,0.08) 100%);
    background-color: #092131;
    background-blend-mode: screen;
    border-radius: 5rem;
    opacity: 1;
    transform: scale(0);
}

.navbar-dark .navbar-toggler:not(.collapsed)::before, 
.top-nav .navbar-buttons:not(:has(a[href^="/scenes/new"])):not(:has(a[href^="/movies/new"])):not(:has(a[href^="/galleries/new"])):not(:has(a[href^="/performers/new"])):not(:has(a[href^="/studios/new"])):not(:has(a[href^="/tags/new"])) .btn:not(.donate)::before, 
.top-nav .navbar-buttons a.nav-utility button.minimal.btn.btn-primary:not(.donate)::before,
button[title=Help].nav-utility.minimal.btn.btn-primary:has(>svg.svg-inline--fa.fa-circle-question.fa-icon)::before,
.top-nav .navbar-buttons a.minimal.logout-button.btn.btn-primary::before {
    background: radial-gradient(circle at center, rgba(var(--pry-color),var(--btn-hover)) 0%, rgba(var(--pry-color),var(--btn-hover)) 100%);
}

@keyframes bubble {
    0% {
        opacity: 0;
        transform: scale(0);
        height: 2px;
        width: 2px;
    }
    100% {
        opacity: 1;
        transform: scale(24);
        box-shadow: var(--elevation-1);
    }
}
.navbar-dark .navbar-toggler.collapsed:hover:not(:active):not(.active)::before, 
.navbar-dark .navbar-toggler:hover:not(.collapsed):not(:active):not(.active)::before, 
.top-nav .navbar-buttons:not(:has(a[href^="/scenes/new"])):not(:has(a[href^="/movies/new"])):not(:has(a[href^="/galleries/new"])):not(:has(a[href^="/performers/new"])):not(:has(a[href^="/studios/new"])):not(:has(a[href^="/tags/new"])) .btn:not(.donate):hover:not(:active):not(.active)::before, 
.top-nav .navbar-buttons a.nav-utility button.minimal.btn.btn-primary:not(.donate):hover:not(:active):not(.active)::before,
button[title=Help].nav-utility.minimal.btn.btn-primary:has(>svg.svg-inline--fa.fa-circle-question.fa-icon):hover:not(:active):not(.active)::before,
.top-nav .navbar-buttons a.minimal.logout-button.btn.btn-primary:hover:not(:active):not(.active)::before {
    animation: bubble 0.35s ease-in forwards;
    will-change: animation;
    max-height: 48px;
    min-height: 2px;
    max-width: 48px;
    min-width: 2px;
}
button:is(.favorite, .not-favorite).minimal.favorite-button.btn.btn-primary:hover::before {
    animation: bubble 0.35s ease-in forwards;
    will-change: animation;
    max-height: 40px;
    min-height: 2px;
    max-width: 40px;
    min-width: 2px;
}
.detail-header .name-icons button.minimal.icon-link.btn.btn-primary:has(>a.link>svg.fa-link):hover::before,
button:where(.star-fill-100, .star-fill-90, .star-fill-80, .star-fill-75, .star-fill-70, .star-fill-60, .star-fill-50, .star-fill-40, .star-fill-30, .star-fill-30, .star-fill-25, .star-fill-20, .star-fill-10, .star-fill-0).minimal.btn.btn-secondary:hover::before,
#performer-page .performer-head .name-icons button.icon-link.btn-primary:has(>a.twitter):hover::before,
#performer-page .performer-head .name-icons button.not-favorite.btn-primary:hover::before,
#performer-page .performer-head .name-icons button.favorite.btn-primary:hover::before {
    animation: bubble 0.35s ease-in forwards;
    will-change: animation;
    max-height: 36px;
    min-height: 2px;
    max-width: 36px;
    min-width: 2px;
}
.navbar-dark .navbar-toggler.collapsed::before, 
.navbar-dark .navbar-toggler:not(.collapsed)::before,
.top-nav .navbar-buttons:not(:has(a[href^="/scenes/new"])):not(:has(a[href^="/movies/new"])):not(:has(a[href^="/galleries/new"])):not(:has(a[href^="/performers/new"])):not(:has(a[href^="/studios/new"])):not(:has(a[href^="/tags/new"])) .btn:not(.donate)::before, 
.top-nav .navbar-buttons a.nav-utility button.minimal.btn.btn-primary:not(.donate)::before,
button[title=Help].nav-utility.minimal.btn.btn-primary:has(>svg.svg-inline--fa.fa-circle-question.fa-icon)::before,
.top-nav .navbar-buttons a.minimal.logout-button.btn.btn-primary::before,
.detail-header .name-icons button.minimal.icon-link.btn.btn-primary:has(>a.link>svg.fa-link)::before,
button:where(.star-fill-100, .star-fill-90, .star-fill-80, .star-fill-75, .star-fill-70, .star-fill-60, .star-fill-50, .star-fill-40, .star-fill-30, .star-fill-30, .star-fill-25, .star-fill-20, .star-fill-10, .star-fill-0).minimal.btn.btn-secondary::before,
#performer-page .performer-head .name-icons button.icon-link.btn-primary:has(>a.twitter)::before,
#performer-page .performer-head .name-icons button.not-favorite.btn-primary::before,
#performer-page .performer-head .name-icons button.favorite.btn-primary::before,
button:is(.favorite, .not-favorite).minimal.favorite-button.btn.btn-primary::before {
    visibility: hidden;
}
.navbar-dark .navbar-toggler.collapsed:hover::before, 
.navbar-dark .navbar-toggler:not(.collapsed):hover::before, 
.top-nav .navbar-buttons:not(:has(a[href^="/scenes/new"])):not(:has(a[href^="/movies/new"])):not(:has(a[href^="/galleries/new"])):not(:has(a[href^="/performers/new"])):not(:has(a[href^="/studios/new"])):not(:has(a[href^="/tags/new"])) .btn:not(.donate):hover::before, 
.top-nav .navbar-buttons a.nav-utility button.minimal.btn.btn-primary:not(.donate):hover::before,
button[title=Help].nav-utility.minimal.btn.btn-primary:has(>svg.svg-inline--fa.fa-circle-question.fa-icon):hover::before,
.top-nav .navbar-buttons a.minimal.logout-button.btn.btn-primary:hover::before,
.detail-header .name-icons button.minimal.icon-link.btn.btn-primary:has(>a.link>svg.fa-link):hover::before,
button:where(.star-fill-100, .star-fill-90, .star-fill-80, .star-fill-75, .star-fill-70, .star-fill-60, .star-fill-50, .star-fill-40, .star-fill-30, .star-fill-30, .star-fill-25, .star-fill-20, .star-fill-10, .star-fill-0).minimal.btn.btn-secondary:hover::before,
#performer-page .performer-head .name-icons button.icon-link.btn-primary:has(>a.twitter):hover::before,
#performer-page .performer-head .name-icons button.not-favorite.btn-primary:hover::before,
#performer-page .performer-head .name-icons button.favorite.btn-primary:hover::before,
button:is(.favorite, .not-favorite).minimal.favorite-button.btn.btn-primary:hover::before {
    visibility: visible;
}
/* *** *** */

/* Scene Markers */
/*.scene-tabs .fade.tab-pane.active.show form .form-group:nth-of-type(2) .css-b62m3t-container {
    top: 26px;
    left: -150px;
    margin-right: -100px;
}*/
.scene-tabs .fade.tab-pane.active.show form .form-group:nth-of-type(2) .invalid-feedback {
    top: 26px;
    left: -190px;
    position: relative;    
}
/*.scene-tabs .fade.tab-pane.active.show form .form-group:nth-of-type(2) .duration-input {
    margin-left: 44px;
    margin-right: -112px;
}*/
.scene-tabs .fade.tab-pane.active.show form .form-group:nth-of-type(2) .row > .col-form-label.text-sm-right.text-xl-left.form-label {
    top: -20px;
    left: 8px;
    background-color: transparent;
    padding: 2px 4px;
    max-width: 36px;
    margin-left: -82px;
    margin-bottom: 40px;
}

/* Background-Image Blured on Performer Pages. Added brightness.  */
.detail-header .background-image-container .background-image {
    filter: none;
    filter: blur(16px) brightness(1.3);
}

/* The scene card Popover for Performer-tag-container to align left to right in a row*/
.show.popover:has(.performer-tag-container) {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
}
/*#root:has(.recommendations-container) nav.top-nav.navbar.navbar-dark.bg-dark.fixed-top .navbar-nav .nav-link.active > .btn.btn-primary {
    color: rgb(var(--on-surface-variant));
}
#root:has(.recommendations-container) .top-nav.navbar.navbar-dark.bg-dark.fixed-top .navbar-nav .col-4.col-sm-3.col-md-2.col-lg-auto.nav-link.active::after {
    border-bottom-color: rgb(var(--nav-color2));
}
#root:has(.recommendations-container) .top-nav.navbar.navbar-dark.bg-dark.fixed-top .navbar-nav .nav-link.active:hover {
    background-color: rgba(var(--on-surface),var(--btn-hover));
}*/

/* ||Stash ID */
    /* Has StashId - Perfomer Card */
.peformer-stashid-icon {
    margin-top: 162.5%;
    margin-right: 84%;
    top: 0%;
    right: 0%;
}

#scene-edit-details .form-container .form-group.row > label[for="stash_ids"].form-label.col-form-label {
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0.85px;
    text-shadow: var(--light-text-shadow);
    font-weight: 500;
    color: rgb(var(--on-surface-variant));
    position: relative;
    display: block;
    background-color: transparent;
    transform: translate(0%,0%);
    visibility: visible;
    margin-left: 4px;
    margin-left: 2px;
    margin-bottom: -5%;
    margin-top: auto;
}
button[title="Delete Stash ID"].btn-danger {
    padding: 0;
    width: 32px;
    min-width: 32px;
    height: 32px;
    font-size: 14px;
    margin-top: 5%;
    margin-bottom: -2px;
    margin-left: 20.5%;
    margin-right: auto !important;
}
span.stash-id-pill {
    font-size: 12px;
    font-weight: 500;
    text-shadow: var(--really-light-txt-shadow);
    line-height: 16px;
    letter-spacing: 0.75px;
    vertical-align: middle;
    margin-top: 8px;
}
.stash-id-pill > span {
    background-color: rgb(var(--on-tertiary));
    color: rgb(var(--tertiary));
    border-radius: 8px 0 0 8px;
    padding: 0.4em 4px 0.4em 6px;
}
.stash-id-pill a {
    color: rgb(var(--on-tertiary-container));
    background-color: rgb(var(--tertiary-container));
    border-radius: 0 8px 8px 0;
    padding-right: 6px;
    padding-left: 4px;
    padding-top: 0.4em;
    padding-bottom: 0.4em;
}
.stash-id-pill a:is(:hover, :focus-visible) {
    text-decoration: underline;
    text-decoration-color: currentColor;
    text-decoration-style: solid;
    text-underline-offset: 0.25em;
    text-decoration-thickness: 0.12em;
}
.background-image-container + .detail-container span.stash-id-pill {
    margin-top: -6px;
}
.background-image-container + .detail-container .stash-id-pill > span {
    background-color:transparent;
    color: rgb(var(--on-surface-variant));
    padding: 0.4em 4px 0.4em 0;
}
.background-image-container + .detail-container .stash-id-pill a {
    background-color:transparent;
    color: rgb(var(--on-surface));
}

/* Plugins Package-Manager */
.package-manager table thead {
    background-color: rgb(var(--card-color2));
}
.package-manager .package-manager-toolbar input.clearable-text-field.form-control {
    margin: 0;
}
.package-manager .package-manager-toolbar {
    align-items: center;
}
.package-manager .package-manager-table-container > table {
    color: rgb(var(--description-color));
    border-style: solid;
    border: 2px solid rgb(var(--card-color2));
    margin-bottom: 16px;
    margin-top: 8px;
}
.package-manager .package-manager-table-container .table td {
    border: 0;
}
.package-manager .package-manager-table-container td:first-child {
    display: revert;
    text-align: center;
}

/* Logs */
.logs {
    font-family: var(--MonoFont);
    font-size: 12px;
    font-weight: 200;
    line-height: 16px;
    letter-spacing: 0.078em;
    padding-top: 1rem;
    padding: 16px 22px;
    background-image: linear-gradient(to right, rgba(var(--pry-color),var(--text-field-tint)), rgba(var(--pry-color),var(--text-field-tint)));
    background-color: rgb(var(--body-color2));
    background-blend-mode: screen;
    border-radius: 4px;
    margin: 16px;
    font-variant: tabular-nums slashed-zero;
    text-rendering: optimizeLegibility;
    box-shadow: inset 0 0 0 1px rgb(0,0,0,0);
}

/* --- Range Slider and Thumb decorations --- */
@media (min-width: 576px) {
    .btn-toolbar .d-none.d-sm-inline-flex:has(>.zoom-slider.form-control-range) {
        justify-content: center;
    }
}
input[type=range],
input[type=range].zoom-slider { 
    max-width:100px;
    width:100px;
    align-items: center;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background: none;
    cursor: pointer;
    display: flex;
    height: 100%;
    overflow: hidden;
    padding: 20px 9px 20px 9px;
}
input[type=range].filter-slider {
    max-width: 200px;
    width: 200px;
    align-items: center;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background: none;
    cursor: pointer;
    display: flex;
    height: 100%;
    overflow: hidden;
    padding: 8px 0 7px 0;
}
input[type=range]:focus,
input[type=range].zoom-slider:focus,
input[type=range].filter-slider:focus { 
    outline: none;
    box-shadow: none;
}
input[type=range]:focus:hover,
input[type=range].zoom-slider:focus:hover,
input[type=range].filter-slider:focus:hover {
    outline: none;
    box-shadow: none;
}
/* --- Range Track --- */
input[type=range]::-webkit-slider-runnable-track  {
    background-color: rgb(var(--surface-variant));
    box-shadow: none;
    border: 0;
    border-style: none;
    border-radius: 25px;
    content: "";
    height: 4px;
    transition: background-color .5s ease-in-out;
    pointer-events: none;
}
input[type=range].filter-slider::-webkit-slider-runnable-track  {
    background-color: rgb(86,86,86);
    border: 0 solid #000000;
    border-radius: 25px;
    box-shadow: inset 0 0 0 0.06rem black;
    height: 8px;
    opacity: 0.7;
    transition: opacity .2s;
}
input[type=range].filter-slider.contrast-slider::-webkit-slider-runnable-track  {
    background: linear-gradient(-1deg,white 0%,white 40%,black 60%,black 100%),linear-gradient(90deg,#3d3d3d 0%,rgba(255,255,255,0) 100%);
    background-color: white;
    background-blend-mode: multiply;
}
input[type=range].filter-slider.saturation-slider::-webkit-slider-runnable-track  {
    background: linear-gradient( to right, rgba(74,74,74, 0.6), rgba(144,144,250, 0.6), rgba(90,169,250, 0.6), rgba(38,192,199, 0.6), rgba(63,200,156, 0.6), rgba(88,224,111, 0.6), rgba(163,248,88, 0.6), rgba(255,226,46, 0.6), rgba(255,181,91, 0.6), rgba(255,123,130, 0.6) );
    background-color: black;
}
input[type=range].filter-slider.hue-rotate-slider::-webkit-slider-runnable-track {
    background: linear-gradient(to right,red,orange,yellow,green,cyan,blue,violet,red);
    box-shadow: inset 0 0 0 0.06rem #282a36;
}
input[type=range].filter-slider.red-slider::-webkit-slider-runnable-track  {
    background: linear-gradient( 90deg, transparent, #ff0000 );
    background-color: rgb(62,62,62);
}
input[type=range].filter-slider.blue-slider::-webkit-slider-runnable-track  {
    background: linear-gradient( 90deg, transparent, #0000ff );
    background-color: rgb(62,62,62);
}
input[type=range].filter-slider.green-slider::-webkit-slider-runnable-track  {
    background: linear-gradient( 90deg, transparent, #00ff00 );
    background-color: rgb(62,62,62);
}
input[type=range].filter-slider.gamma-slider::-webkit-slider-runnable-track  {
    background: linear-gradient(to right, rgb(62,62,62),rgb(110,110,110));
}
input[type=range]::-moz-range-track  {
    background-color: rgb(var(--surface-variant));
    border: 0;
    border-style: none;
    border-radius: 25px;
    box-shadow: inset 0 0 0 1px rgb(var(--surface-variant));
    width: 100px;
    height: 3px;
    transition: background-color .5s ease-in-out;
}
input[type=range]::-moz-range-progress {
    background-color: transparent;
    box-shadow: none;
    border-radius: 25px;
    border: 0;
    height: 3px;
    margin-top: 0;
}
input[type=range].filter-slider::-moz-range-track  {
    background-color: rgb(86,86,86);
    border: 0 solid #000000;
    border-radius: 25px;
    box-shadow: inset 0 0 0 0.06rem black;
    width: 200px;
    height: 8px;
}
input[type=range].filter-slider::-moz-range-progress {
    background-color: transparent;
    box-shadow: none;
    border-radius: 25px;
    border: 0;
    height: 8px;
    margin-top: 0;
}
input[type=range].filter-slider.contrast-slider::-moz-range-track  {
    background: linear-gradient(-1deg,white 0%,white 40%,black 60%,black 100%),linear-gradient(90deg,#3d3d3d 0%,rgba(255,255,255,0) 100%);
    background-color: white;
    background-blend-mode: multiply;
}
input[type=range].filter-slider.saturation-slider::-moz-range-track  {
    background: linear-gradient( to right, rgba(74,74,74, 0.6), rgba(144,144,250, 0.6), rgba(90,169,250, 0.6), rgba(38,192,199, 0.6), rgba(63,200,156, 0.6), rgba(88,224,111, 0.6), rgba(163,248,88, 0.6), rgba(255,226,46, 0.6), rgba(255,181,91, 0.6), rgba(255,123,130, 0.6) );
    background-color: black;
}
input[type=range].filter-slider.hue-rotate-slider::-moz-range-track {
    background: linear-gradient(to right,red,orange,yellow,green,cyan,blue,violet,red);
    box-shadow: inset 0 0 0 0.06rem #282a36;
}
input[type=range].filter-slider.red-slider::-moz-range-track  {
    background: linear-gradient( 90deg, transparent, #ff0000 );
    background-color: rgb(62,62,62);
}
input[type=range].filter-slider.blue-slider::-moz-range-track  {
    background: linear-gradient( 90deg, transparent, #0000ff );
    background-color: rgb(62,62,62);
}
input[type=range].filter-slider.green-slider::-moz-range-track  {
    background: linear-gradient( 90deg, transparent, #00ff00 );
    background-color: rgb(62,62,62);
}
input[type=range].filter-slider.gamma-slider::-moz-range-track  {
    background: linear-gradient(to right, rgb(62,62,62),rgb(110,110,110));
}
input[type=range]::-ms-track {
    background-color: transparent;
    border: 0;
    border-style: none;
    border-radius: 25px;
    box-shadow: none;
    color: transparent;
    height: 3px;
    margin-top: 13px;
    width: 100px;
}
input[type=range]::-ms-fill-lower {
    background-color: rgb(var(--surface-variant));
    border: 0;
    border-style: none;
    border-radius: 25px;
    box-shadow: inset 0 0 0 1px rgb(var(--surface-variant));
    transition: background-color .5s ease-in-out;
}
input[type=range]::-ms-fill-upper {
    background-color: rgb(var(--surface-variant));
    border: 0;
    border-radius: 25px;
    box-shadow: inset 0 0 0 1px rgb(var(--surface-variant));
    transition: background-color .5s ease-in-out;
}
input[type=range].filter-slider::-ms-track {
    background-color: transparent;
    border: 0;
    border-color: transparent;
    border-radius: 25px;
    border-width: 0;
    border-style: solid;
    color: transparent;
    height: 8px;
    margin-top: 8px;
    width: 200px;
}
input[type=range].filter-slider::-ms-fill-lower {
    background-color: rgb(86,86,86);
    box-shadow: inset 0 0 0 0.06rem black;
    border-radius: 25px;
}
input[type=range].filter-slider::-ms-fill-upper {
    background-color: transparent;
    box-shadow: none;
    border-radius: 25px;
}
input[type=range].filter-slider.contrast-slider::-ms-fill-lower  {
    background: linear-gradient(-1deg,white 0%,white 40%,black 60%,black 100%),linear-gradient(90deg,#3d3d3d 0%,rgba(255,255,255,0) 100%);
    background-color: white;
    background-blend-mode: multiply;
}
input[type=range].filter-slider.saturation-slider::-ms-fill-lower  {
    background: linear-gradient( to right, rgba(74,74,74, 0.6), rgba(144,144,250, 0.6), rgba(90,169,250, 0.6), rgba(38,192,199, 0.6), rgba(63,200,156, 0.6), rgba(88,224,111, 0.6), rgba(163,248,88, 0.6), rgba(255,226,46, 0.6), rgba(255,181,91, 0.6), rgba(255,123,130, 0.6) );
    background-color: black;
}
input[type=range].filter-slider.hue-rotate-slider::-ms-fill-lower {
    background: linear-gradient(to right,red,orange,yellow,green,cyan,blue,violet,red);
    box-shadow: inset 0 0 0 0.06rem #282a36;
}
input[type=range].filter-slider.red-slider::-ms-fill-lower  {
    background: linear-gradient( 90deg, transparent, #ff0000 );
    background-color: rgb(62,62,62);
}
input[type=range].filter-slider.blue-slider::-ms-fill-lower  {
    background: linear-gradient( 90deg, transparent, #0000ff );
    background-color: rgb(62,62,62);
}
input[type=range].filter-slider.green-slider::-ms-fill-lower  {
    background: linear-gradient( 90deg, transparent, #00ff00 );
    background-color: rgb(62,62,62);
}
input[type=range].filter-slider.gamma-slider::-ms-fill-lower  {
    background: linear-gradient(to right, rgb(62,62,62),rgb(110,110,110));
}

/* Range Focus */
input[type=range]:focus::-webkit-slider-runnable-track {
    background-color: rgb(var(--pry-color));
    border-color: transparent;
    transition: background-color .5s ease-in-out, box-shadow .2s ease-in-out;
}
input[type=range].filter-slider:focus::-webkit-slider-runnable-track {
    opacity: 1;
    transition: opacity .2s;
}

input[type=range]:focus::-moz-range-track {
  background-color: rgb(var(--pry-color));
  border-color: transparent;
  transition: background-color .5s ease-in-out, box-shadow .2s ease-in-out;
}
input[type=range]:focus::-moz-range-progress {
    background-color: rgb(var(--pry-color));
    box-shadow: inset 0 0 0 1px rgb(var(--pry-color));
    transition: background-color .5s ease-in-out, box-shadow .2s ease-in-out;
}
input[type=range].filter-slider:focus::-moz-range-track {
}
input[type=range].filter-slider:focus::-moz-range-progress {
    background-color: transparent;
    box-shadow: none;
}

input[type=range]:focus::-ms-fill-lower {
  background-color: rgb(var(--pry-color));
  box-shadow: inset 0 0 0 1px rgb(var(--pry-color));
  transition: background-color .5s ease-in-out, box-shadow .2s ease-in-out;
}
input[type=range]:focus::-ms-fill-upper {
  background-color: rgb(var(--pry-color));
  box-shadow: inset 0 0 0 1px rgb(var(--pry-color));
  transition: background-color .5s ease-in-out, box-shadow .2s ease-in-out;
}
input[type=range].filter-slider:focus::-ms-fill-lower {
}
input[type=range]:focus::-ms-fill-upper {
  background-color: transparent;
  box-shadow: none;
}

/* Range Thumb */
input[type=range]::-webkit-slider-thumb,
input[type=range]:focus::-webkit-slider-thumb {
    border: 0;
    border-style: none;
    height: 22px;
    width: 22px;
    border-radius: 5rem;
    background-color: rgb(var(--pry-color));
    -webkit-appearance: none;
    appearance: none;
    margin-top: -9px;
    box-shadow: 0 0 0 3px rgb(var(--body-color2)), inset 0 0 0 7px rgb(var(--pry-color));
}
input[type=range].filter-slider::-webkit-slider-thumb,
input[type=range].filter-slider:focus::-webkit-slider-thumb {
    border: 0 solid transparent;
    height: 28px;
    width: 28px;
    border-radius: 50%;
    background: none;
    background-color: #1c1f1d;
    -webkit-appearance: none;
    appearance: none;
    margin-top: -11px;
    box-shadow: 0 0 0 4px #1c1f1d, inset 0 0 0 1px black, inset 0 0 0 7px #fff, inset 0 0 0 8px black;
}

input[type=range]::-moz-range-thumb,
input[type=range]:focus::-moz-range-thumb {
    box-shadow: 0 0 0 3px rgb(var(--body-color2)), inset 0 0 0 7px rgb(var(--pry-color));
    border: 0;
    border-style: none;
    height: 22px;
    width: 22px;
    border-radius: 50%;
    background-color: rgb(var(--pry-color));
    position: relative;
}
input[type=range].filter-slider::-moz-range-thumb,
input[type=range].filter-slider:focus::-moz-range-thumb {
    box-shadow: 0 0 0 4px #1c1f1d, inset 0 0 0 1px black, inset 0 0 0 7px #fff, inset 0 0 0 8px black;
    border: 0 solid transparent;
    height: 28px;
    width: 28px;
    border-radius: 50%;
    background-color: #1c1f1d;
    position: relative;
}

input[type=range]::-ms-thumb,
input[type=range]:focus::-ms-thumb {
    box-shadow: 0 0 0 3px rgb(var(--body-color2)), inset 0 0 0 7px rgb(var(--pry-color));
    border: 0;
    border-style: none;
    height: 22px;
    width: 22px;
    border-radius: 50%;
    background-color: rgb(var(--pry-color));
    -ms-appearance: none;
}
input[type=range].filter-slider::-ms-thumb,
input[type=range].filter-slider:focus::-ms-thumb {
    box-shadow: 0 0 0 4px #1c1f1d, inset 0 0 0 1px black, inset 0 0 0 7px #fff, inset 0 0 0 8px black;
    border: 0 solid transparent;
    height: 28px;
    width: 28px;
    border-radius: 50%;
    background-color: #1c1f1d;
    -ms-appearance: none;
}

input[type=range]:hover::-webkit-slider-thumb,
input[type=range]:hover:focus::-webkit-slider-thumb,
input[type=range]:active:hover::-webkit-slider-thumb,
input[type=range]:active:focus::-webkit-slider-thumb {
    background-color: rgb(var(--pry-color));
    border: 0;
    border-style: none;
    box-shadow: 0 0 0 9px rgba(var(--pry-color), 0.25), inset 0 0 0 7px rgb(var(--pry-color));
    transition: box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color .2s ease-in-out;
}
input[type=range].filter-slider:hover::-webkit-slider-thumb,
input[type=range].filter-slider:hover:focus::-webkit-slider-thumb,
input[type=range].filter-slider:active:hover::-webkit-slider-thumb,
input[type=range].filter-slider:active:focus::-webkit-slider-thumb {
    background-color: #000000;
    border: 1px solid #1c1f1d;
    box-shadow: 0 0 0 4px #1c1f1d, inset 0 0 0 1px #1c1f1d, inset 0 0 0 2px #000000, inset 0 0 0 8px #fff, inset 0 0 0 9px #000000;
    transition: box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color .2s ease-in-out;
}
input[type=range]:focus-visible::-webkit-slider-thumb,
input[type=range].filter-slider:focus-visible::-webkit-slider-thumb {
    outline-color: rgb(var(--focus-ring));
    outline-style: solid;
    outline-width: 0.25rem;
    outline-offset: 3px;
}
input[type=range]:focus:hover::-webkit-slider-thumb,
input[type=range]:active:focus:hover::-webkit-slider-thumb,
input[type=range].filter-slider:focus:hover::-webkit-slider-thumb,
input[type=range].filter-slider:active:focus:hover::-webkit-slider-thumb {
    outline: none;
}

input[type=range]:hover::-moz-range-thumb,
input[type=range]:hover:focus::-moz-range-thumb,
input[type=range]:active:hover::-moz-range-thumb,
input[type=range]:active:focus::-moz-range-thumb {
    background-color: rgb(var(--pry-color));
    border: 0;
    border-style: none;
    box-shadow: 0 0 0 9px rgba(var(--pry-color), 0.25), inset 0 0 0 7px rgb(var(--pry-color));
    transition: box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color .2s ease-in-out;
}
input[type=range].filter-slider:hover::-moz-range-thumb,
input[type=range].filter-slider:hover:focus::-moz-range-thumb,
input[type=range].filter-slider:active:hover::-moz-range-thumb,
input[type=range].filter-slider:active:focus::-moz-range-thumb {
    background-color: #000000;
    border: 1px solid #1c1f1d;
    box-shadow: 0 0 0 4px #1c1f1d, inset 0 0 0 1px #1c1f1d, inset 0 0 0 2px #000000, inset 0 0 0 8px #fff, inset 0 0 0 9px #000000;
    transition: box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color .2s ease-in-out;
}
input[type=range]:focus-visible::-moz-range-thumb,
input[type=range].filter-slider:focus-visible::-moz-range-thumb {
    outline-color: rgb(var(--focus-ring));
    outline-style: solid;
    outline-width: 2px;
    outline-offset: -2px;
}
input[type=range]:focus:hover::-moz-range-thumb,
input[type=range]:active:focus:hover::-moz-range-thumb,
input[type=range].filter-slider:focus:hover::-moz-range-thumb,
input[type=range].filter-slider:active:focus:hover::-moz-range-thumb {
    outline: none;
}

input[type=range]:hover::-ms-thumb,
input[type=range]:hover:focus::-ms-thumb,
input[type=range]:active:hover::-ms-thumb,
input[type=range]:active:focus::-ms-thumb {
    background-color: rgb(var(--pry-color));
    border: 0;
    border-style: none;
    box-shadow: 0 0 0 9px rgba(var(--pry-color), 0.25), inset 0 0 0 7px rgb(var(--pry-color));
    transition: box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color .2s ease-in-out;
}
input[type=range].filter-slider:hover::-ms-thumb,
input[type=range].filter-slider:hover:focus::-ms-thumb,
input[type=range].filter-slider:active:hover::-ms-thumb,
input[type=range].filter-slider:active:focus::-ms-thumb {
    background-color: #000000;
    border: 1px solid #1c1f1d;
    box-shadow: 0 0 0 4px #1c1f1d, inset 0 0 0 1px #1c1f1d, inset 0 0 0 2px #000000, inset 0 0 0 8px #fff, inset 0 0 0 9px #000000;
    transition: box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color .2s ease-in-out;
}
input[type=range]:focus-visible::-ms-thumb,
input[type=range].filter-slider:focus-visible::-ms-thumb {
    outline-color: rgb(var(--focus-ring));
    outline-style: solid;
    outline-width: 2px;
    outline-offset: -2px;
}
input[type=range]:focus:hover::-ms-thumb,
input[type=range]:active:focus:hover::-ms-thumb,
input[type=range].filter-slider:focus:hover::-ms-thumb,
input[type=range].filter-slider:active:focus:hover::-ms-thumb {
    outline: none;
}
input[type=range]::-ms-tooltip {
    display: none;
}
/* *** */

/* - */
`;
// Themes CSS End

// Themes CSS Begin
const modernDark = `
/* Modern Dark Theme by cj13 v1.2 */
:root {
    --nav-color: #212121;
    --body-color: #191919;
    --card-color: #2a2a2a;
    --plex-yelow: #e5a00d;
    --tag-color: #555555;
}
#scrubber-position-indicator {
    background-color: #e5a00d;
}
.scrubber-tags-background {
    background-color: #e5a00d;
    opacity: 30%;
}
body {
    width: 100%;
    height: 100%;
    background: var(--body-color);
}
.text-white {
    color: #cbced2 !important;
}
#root {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 2;
}
div.react-select__menu, div.dropdown-menu {
    background-color: var(--card-color);
}
* {
    scrollbar-color: hsla(0, 0%, 100%, .2) transparent;
}
.bg-dark {
    background-color: var(--nav-color)!important;
}
.card {
    background-color: #30404d;
    border-radius: 3px;
    box-shadow: 0 0 0 1px rgba(16, 22, 26, .4), 0 0 0 rgba(16, 22, 26, 0), 0 0 0 rgba(16, 22, 26, 0);
    padding: 20px;
    background-color: var(--card-color);
}
.text-input, .text-input:focus, .text-input[readonly], .text-input:disabled {
    background-color: var(--card-color);
}
#scrubber-forward {
    background-color: transparent;
    border: 1px solid #555;
}
.scrubber-button {
    background-color: transparent;
    border: 1px solid #555;
}
.bg-secondary {
    background-color: var(--card-color) !important;
}
.text-white {
    color: #eee !important;
}
.border-secondary {
    border-color: #2f3335 !important;
}
.btn-secondary.filter-item.col-1.d-none.d-sm-inline.form-control {
    background-color: rgba(0, 0, 0, .15);
}
.btn-secondary {
    color: #eee;
    background-color: rgba(0, 0, 0, .15);
    border-color: var(--tag-color);
}
.pagination .btn:last-child {
    border-right: 1px solid var(--tag-color);
}
.pagination .btn:first-child {
    border-left: 1px solid var(--tag-color);
}
a {
    color: hsla(0, 0%, 100%, .45);
}
.btn.active {
    background-color: #2f3335;
    color: #f5f8fa;
}
minimal.w-100.active.btn.btn-primary {
    background-color: #2f3335;
    color: #f5f8fa;
}
.btn-primary {
    color: #fff;
    background-color: #cc7b19;
    border-color: #cc7b19;
    font-weight: bold;
}
.btn-primary:hover {
    color: #fff;
    background-color: #e59029;
    border-color: #e59029 font-weight: bold;
}
.nav-tabs .nav-link.active {
    color: #eee;
}
.nav-tabs .nav-link.active:hover {
    border-bottom-color: #eee;
    outline: 0;
}
.nav-tabs .nav-link {
    color: hsla(0,0%,100%,.65);
}
.tag-item {
    background-color: var(--tag-color);
    color: #fff;
}
.input-control, .input-control:focus {
    background-color: rgba(16, 22, 26, .3);
}
#performer-page .image-container .performer {
    background-color: rgba(0, 0, 0, .45);
    box-shadow: 0 0 2px rgba(0, 0, 0, .35);
}
.btn-primary:not(:disabled):not(.disabled).active, .btn-primary:not(:disabled):not(.disabled):active, .show>.btn-primary.dropdown-toggle {
    color: #fff;
    border-color: #eee;
}
.nav-pills .nav-link.active, .nav-pills .show>.nav-link {
    background-color: var(--nav-color);
}
.btn-primary.focus, .btn-primary:focus, .btn-primary:not(:disabled):not(.disabled).active:focus, .btn-primary:not(:disabled):not(.disabled):active:focus, .show>.btn-primary.dropdown-toggle:focus {
    box-shadow: none;
}
.btn-primary:not(:disabled):not(.disabled).active, .btn-primary:not(:disabled):not(.disabled):active, .show>.btn-primary.dropdown-toggle {
    color: #fff;
    background-color: #2f3335;
    border-color: #eee;
}
input[type="range"]::-moz-range-track {
    background: hsla(0, 0%, 100%, .25);
}
input[type="range"]::-moz-range-thumb {
    background: #bcbcbc;
}
div.react-select__control {
    background-color: hsla(0, 0%, 39.2%, .4);
    color: #182026;
    border-color: var(--card-color);
    cursor: pointer;
}
.scene-wall-item-text-container {
    background: radial-gradient(farthest-corner at 50% 50%, rgba(50, 50, 50, .5) 50%, #323232 100%);
    color: #eee;
}
.filter-container, .operation-container {
    background-color: rgba(0, 0, 0, .15);
    box-shadow: none;
    margin-top: -10px;
    padding: 10px;
}
.container-fluid, .container-lg, .container-md, .container-sm, .container-xl {
    width: 100%;
    margin-right: 0px;
    margin-left: 0px;
}
.btn-link {
    font-weight: 500;
    color: #eee;
    text-decoration: none;
}
button.minimal.brand-link.d-none.d-md-inline-block.btn.btn-primary {
    text-transform: uppercase;
    font-weight: bold;
}
a:hover {
    color: hsla(0, 0%, 100%, .7);
}
option {
    background-color: var(--nav-color);
}
.folder-list .btn-link {
    color: #2c2e30;
}
#performer-scraper-popover {
    z-index: 10;
}
.filter-container, .operation-container {
    background-color: transparent;
}
.search-item {
    background-color: var(--card-color);
}
.selected-result {
    background-color: var(--card-color);
}
.selected-result:hover {
    background-color: var(--card-color);
}
.performer-select-active .react-select__control, .studio-select-active .react-select__control {
    background-color: hsla(0, 0%, 39.2%, .4);
}
#scene-edit-details .edit-buttons-container {
    margin: 0px;
    background: var(--body-color);
}
#tasks-panel .tasks-panel-queue {
    background: var(--body-color);
}
.job-table.card {
    background-color: var(--card-color);
}
.modal-header, .modal-body, .modal-footer {
    background-color: #2d3744;
    background-repeat: no-repeat;
    background-size: cover;
    background-attachment: fixed;
   /* background-position: center;
    */
}
.folder-list .btn-link {
    color: #fff;
}
.modal-header, .modal-body, .modal-footer {
    background-color: #30404d;
    color: #f5f8fa;
    background-repeat: no-repeat;
    background-size: cover;
    background-attachment: fixed;
    background-position: center;
}
@media (max-width: 575.98px) and (orientation: portrait) {
    .scene-card-preview-image {
        height: calc(100vw * (9 / 16));
   }
    .gallery-tabs .mr-auto.nav.nav-tabs {
        display: grid;
        grid-auto-flow: column;
        text-align: center;
        left: 0;
        right: 0;
        position: fixed;
   }
    .VideoPlayer.portrait .video-js {
        height: 56.25vw;
   }
    .gallery-container .tab-content {
        top: 3rem;
        position: fixed;
        height: calc(100vh - 6.5rem);
   }
    .gallery-tabs {
        display: none;
   }
    .btn-toolbar {
        padding-top: 1rem;
   }
    body {
        padding: 0rem 0 5rem;
   }
    .scene-tabs .mr-auto.nav.nav-tabs {
        background-color: #121212;
        display: grid;
        grid-auto-flow: column;
        height: 3rem;
        left: 0;
        margin: 0;
        margin-bottom: 0;
        max-height: 3rem;
        padding-bottom: 2.2rem;
        padding-top: 0.1rem;
        position: fixed;
        right: 0;
        text-align: center;
        top: calc(100vw * (9 / 16));
        white-space: nowrap;
        z-index: 20;
   }
    .scene-tabs.order-xl-first.order-last {
        height: calc(100vh - (100vw * (9 / 16) + 8.5rem));
        top: calc((100vw * (9 / 16)) + 5rem);
        position: fixed;
   }
    .tab-content {
        overflow-y: auto;
        overflow-x: hidden;
   }
    .studio-card {
        width: 100%;
        height: 294px;
   }
    .movie-card {
        width: 45%;
   }
    .performer-card-image {
        height: 19rem;
   }
    .performer-card {
        width: 14rem;
        height: 27.5rem;
   }
    .scene-performers .performer-card-image {
        height: 19rem;
   }
    .scene-performers .performer-card {
        width: 14rem;
        height: 27.5rem;
   }
    .movie-card .TruncatedText {
        display: none;
   }
    .nav-tabs .nav-link.active:hover {
        outline: 0;
        border-bottom: 2px solid 
   }
    #performer-details-tab-edit{
        display: none;
   }
    #performer-details-tab-operations{
        display: none;
   }
    .scene-tabs .ml-auto.btn-group {
        position: fixed;
        right: 1rem;
        top: calc((100vw * (9 / 16)) + 2.7rem);
   }
    .stats-element {
        flex-grow: 1;
        margin: auto 0rem;
   }
    .stats {
        margin-left: 0px;
   }
    .top-nav {
        bottom: 0;
        top: auto;
   }
    div[data-rb-event-key="/images"] {
        display: none;
   }
    div[data-rb-event-key="/scenes/markers"] {
        display: none;
   }
    .row.justify-content-center.scene-performers {
        max-height: 450px;
        display: flex;
        flex-direction: column;
        overflow: auto;
        border-top: solid 2px #2d3035;
        border-bottom: solid 2px #2d3035;
        padding-top: .5rem;
        padding-bottom: .5rem;
   }
    .scene-tabs {
        max-height: 100%;
   }
}
dd {
    word-break: break-word;
}
.btn-secondary {
    color: hsla(0,0%,100%,.65);
}
.btn-secondary:hover {
    color: white;
    z-index: 0;
    border-color: var(--nav-color);
    background-color: rgba(0, 0, 0, .15);
}
.btn-secondary:not(:disabled):not(.disabled):active, .btn-secondary:not(:disabled):not(.disabled).active, .show>.btn-secondary.dropdown-toggle {
    background-color: rgba(0, 0, 0, .35);
}
.btn-secondary:focus, .btn-secondary.focus {
    background-color: rgba(0, 0, 0, .35);
}
.scrubber-wrapper {
    background-color: rgba(0, 0, 0, .3);
    border-style: ridge;
    border-color: #555555;
}
a.minimal:hover:not(:disabled), button.minimal:hover:not(:disabled) {
    background: none;
    color: white;
}
.btn-primary:not(:disabled):not(.disabled).active, .btn-primary:not(:disabled):not(.disabled):active, .show>.btn-primary.dropdown-toggle {
    color: var(--plex-yelow);
    border-bottom: solid;
    background: none;
}
a.minimal, button.minimal {
    color: hsla(0,0%,100%,.65);
}
.nav-pills .nav-link.active, .nav-pills .show>.nav-link {
    background: none;
    border-left: solid;
    color: var(--plex-yelow);
}
.nav-link {
    color: hsla(0,0%,100%,.65);
}
.nav-link:hover, .nav-link:focus {
    color: white;
    background-color: hsla(0,0%,100%,.08);
}
.navbar-dark .navbar-nav .nav-link:hover, .navbar-dark .navbar-nav .nav-link:focus {
    background-color: transparent;
}
.btn-secondary:not(:disabled):not(.disabled):active, .btn-secondary:not(:disabled):not(.disabled).active, .show>.btn-secondary.dropdown-toggle {
    background: none;
    color: var(--plex-yelow);
    border-bottom: solid;
}
.nav-tabs .nav-link.active {
    color: var(--plex-yelow);
    background: none;
}
.nav-tabs .nav-link:hover {
    border-bottom: none;
}
.custom-control-input:checked~.custom-control-label:before {
    color: #fff;
    border-color: var(--plex-yelow);
    background-color: var(--plex-yelow);
}
.custom-switch .custom-control-input:disabled:checked~.custom-control-label:before {
    background-color: var(--plex-yelow);
}
.btn-primary.disabled, .btn-primary:disabled {
    color: #fff;
    background-color: #e59029;
    border-color: #e59029;
    font-weight: bold;
}
.btn-primary:focus, .btn-primary.focus {
    background-color: #cc7b19;
    border-color: #cc7b19;
    font-weight: bold;
}
.btn-danger {
    color: hsla(0,0%,100%,.75);
    background-color: #b32;
    border-color: #b32;
    font-weight: bold;
}
.btn-danger:hover {
    color: white;
    background-color: #b32;
    border-color: #b32;
}
.brand-link {
    background-color: var(--nav-color)!important;
}
.hover-popover-content {
    max-width: 32rem;
    text-align: center;
    background: var(--nav-color);
}
.progress-bar {
    background-color: var(--plex-yelow);
}
.modal-header, .modal-body, .modal-footer {
    background-color: var(--body-color);
}
.btn-secondary.disabled, .btn-secondary:disabled {
    background-color: var(--card-color);
    border-color: var(--card-color);
    border-left: none!important;
    border-right: none!important;
}
#queue-viewer .current {
    background-color: var(--card-color);
}
.tab-content .card-popovers .btn {
    padding-left: .4rem;
    padding-right: .4rem;
}
/* .gallery-tabs, .scene-tabs, .scene-player-container {
    background-color: var(--nav-color);
}
*/
.react-select__menu-portal {
    z-index: 2;
}
.video-js .vjs-play-progress {
    background-color: #e5a00d;
}
`;
// Themes CSS End

// Themes CSS Begin
const neonDark = `
/* Neon Dark Theme by Dankonite */
:root
{
	--background-color:#101010;
	--blue-accent:#137cbd;
	--card-radius:.75rem;
	--disabled-color:#181818;
	--font-color:#fff;
	--lighter-gray:#303030;
	--menu-gray:#202020;
	--menu-rounding:1rem;
	--not-card-radius:.25rem;
	--red-delete:#DB3737
}

.btn
{
	border-radius:var(--not-card-radius)
}

.btn-primary:not(:disabled):not(.disabled):not(.brand-link):active,.btn-primary:not(:disabled):not(.disabled).active,.show>.btn-primary.dropdown-toggle
{
	background-color:var(--lighter-gray);
	border-color:var(--blue-accent);
	color:var(--font-color)
}

.dropdown-item
{
	border-radius:var(--menu-rounding)
}

.edit-buttons-container>*
{
	margin-bottom:1rem
}

.fa-chevron-up,.fa-chevron-down
{
	color:var(--blue-accent)
}

.form-control
{
	border-radius:var(--not-card-radius);
	padding-right:1.3rem
}

.input-group-text
{
	background-color:var(--menu-gray);
	border:1px solid var(--blue-accent);
	color:var(--font-color)
}

.input-group.has-validation>.input-group-append>div>div>button
{
	border-bottom-left-radius:0!important;
	border-top-left-radius:0!important
}

.nav-pills .nav-link
{
	border-radius:var(--not-card-radius)
}

.row
{
	margin-left:0;
	margin-right:0
}

.saved-filter-list-menu>div>div
{
	margin-bottom:1rem
}

.search-item
{
	background-color:var(--menu-gray);
	border-radius:.25rem;
	padding:1rem
}

.set-as-default-button
{
	margin-top:1rem
}

.setting-section .setting:not(:last-child)
{
	border-bottom:1px solid var(--blue-accent)
}

a.bg-secondary:hover,a.bg-secondary:focus,button.bg-secondary:hover,button.bg-secondary:focus
{
	background-color:var(--lighter-gray)!important
}

button.brand-link
{
	font-size:0;
	visibility:hidden!important
}

button.brand-link:after
{
	align-items:center;
	border:1px solid var(--blue-accent)!important;
	border-radius:var(--not-card-radius);
	content:"Home";
	display:inline-block;
	font-size:1rem;
	height:40px;
	padding:7px 12px;
	position:relative;
	top:-1px;
	vertical-align:middle;
	visibility:visible
}

button.brand-link:hover:after
{
	background-color:var(--lighter-gray)
}

div.row>h4
{
	margin:0;
	padding:1rem
}

div.row>hr.w-100
{
	padding-bottom:1rem
}

input.bg-secondary.text-white.border-secondary.form-control,.date-input.form-control,.text-input.form-control
{
	height:33.5px
}

@media (max-width: 1199.98px) {
	.brand-link:after
	{
		margin-left:-16px
	}

	.top-nav .btn
	{
		padding:0 12px
	}
}

@media (min-width: 1199.98px) {
	.navbar-collapse>.navbar-nav>div>a
	{
		height:40px
	}
}

@media (min-width: 576px) {
#settings-menu-container
{
	padding:1rem;
	position:fixed
}    
}

.bs-popover-bottom>.arrow:after,.bs-popover-auto[x-placement^=bottom]>.arrow:after
{
	border-bottom-color:var(--blue-accent);
	border-width:0 .5rem .5rem;
	top:1px
}

.btn-toolbar>.btn-group>.dropdown>button,.query-text-field,.form-control,.dropdown,.dropdown-toggle
{
	height:100%
}

.navbar-brand
{
	display:inline-block;
	font-size:1.25rem;
	line-height:inherit;
	margin-right:0;
	padding-bottom:.3125rem;
	padding-top:.3125rem;
	white-space:nowrap
}

.navbar-collapse>.navbar-nav>div>a
{
	border:1px solid var(--blue-accent)
}

.navbar-expand-xl .navbar-nav .nav-link
{
	padding-left:.5rem;
	padding-right:0
}

.setting-section .setting-group:not(:last-child)
{
	border-bottom:1px solid var(--blue-accent)
}

a
{
	color:var(--font-color)
}

h6.col-md-2.col-4
{
	display:flex;
	justify-content:center
}

img
{
	border-bottom:1px solid var(--blue-accent)!important
}

@media(min-width: 576px) {
	.offset-sm-3
	{
		border-left:1px solid var(--blue-accent)
	}
}

.TruncatedText.scene-card__description
{
	font-size:.9rem
}

.brand-link
{
	padding:0
}

.btn-primary
{
	background-color:var(--menu-gray);
	border-color:var(--blue-accent);
	color:var(--font-color)
}

.btn-secondary
{
	background-color:var(--menu-gray);
	border-color:var(--blue-accent);
	color:var(--font-color)
}

.btn-secondary.disabled,.btn-secondary:disabled
{
	background-color:var(--disabled-color);
	border-color:var(--blue-accent);
	color:var(--font-color)
}

.btn-secondary:focus,.btn-secondary.focus
{
	background-color:var(--lighter-gray);
	border-color:var(--blue-accent);
	box-shadow:0 0 .3rem .3rem var(--blue-accent);
	color:var(--font-color)
}

.btn-secondary:hover
{
	background-color:var(--lighter-gray);
	border-color:var(--blue-accent);
	color:var(--font-color)
}

.btn-secondary:not(:disabled):not(.disabled):active,.btn-secondary:not(:disabled):not(.disabled).active,.show>.btn-secondary.dropdown-toggle
{
	background-color:var(--lighter-gray);
	border-color:var(--blue-accent);
	color:var(--font-color)
}

.btn-secondary:not(:disabled):not(.disabled):active:focus,.btn-secondary:not(:disabled):not(.disabled).active:focus,.show>.btn-secondary.dropdown-toggle:focus
{
	box-shadow:var(--blue-accent)
}

.btn-toolbar
{
	justify-content:flex-start;
	padding-top:.5rem
}

.btn:focus,.btn.focus
{
	box-shadow:var(--blue-accent)!important
}

.dropdown-item.disabled,.dropdown-item:disabled
{
	color:#adb5bd
}

.dropdown-menu.show
{
	display:block;
	padding:1rem
}

.form-control::placeholder
{
	color:var(--font-color)
}

.form-control:focus
{
	box-shadow:var(--blue-accent)
}

.nav-menu-toggle
{
	border:1px solid var(--blue-accent)!important
}

.query-text-field:active,.query-text-field:focus
{
	box-shadow:0 0 .3rem .3rem var(--blue-accent)!important
}

.scene-card a,.gallery-card a
{
	color:var(--font-color)
}

body
{
	background-color:var(--background-color);
	color:var(--font-color);
	text-align:left
}

div.navbar-buttons>:not(.mr-2)
{
	border:1px solid var(--blue-accent)!important;
	border-radius:var(--not-card-radius)
}

h5,.h5
{
	font-size:1.1rem
}

hr
{
	border-top:1px solid var(--blue-accent)
}

@media (min-width:576px) {
	.gallery-card
	{
		width:unset!important
	}

	.performer-card
	{
		width:unset!important
	}

	.tag-card-image
	{
		height:180px
	}
}

@media (max-width:576px) {
	.gallery-card
	{
		width:unset!important
	}

	.performer-card
	{
		width:unset!important
	}

	.tag-card-image
	{
		height:120px
	}
}

#scrubber-current-position
{
	background-color:var(--blue-accent);
	height:30px;
	left:50%;
	position:absolute;
	width:2px;
	z-index:1
}

#scrubber-position-indicator
{
	background-color:var(--lighter-gray);
	border-right:2px solid var(--blue-accent);
	height:20px;
	left:-100%;
	position:absolute;
	width:100%;
	z-index:0
}

.badge-info
{
	background-color:var(--menu-gray);
	border:1px solid var(--blue-accent);
	color:var(--font-color)
}

.badge-secondary
{
	background-color:var(--lighter-gray);
	border:1px solid var(--blue-accent);
	border-radius:.25rem;
	color:var(--font-color)
}

.bg-dark
{
	background-color:var(--menu-gray)!important
}

.bg-secondary
{
	background-color:var(--menu-gray)!important
}

.border-secondary
{
	border-color:var(--blue-accent)!important
}

.brand-link
{
	border:1px solid var(--blue-accent)!important
}

.card
{
	background-color:var(--menu-gray);
	border-radius:var(--card-radius)!important;
	box-shadow:var(--blue-accent)
}

.card
{
	border:1px solid var(--blue-accent)
}

.filter-button .badge
{
	border-radius:999px;
	right:-7px;
	top:-6px;
	z-index:3!important
}

.gallery-card
{
	height:min-content!important
}

.gallery-card.card
{
	padding-bottom:0
}

.modal-footer
{
	border-radius:1rem;
	border-top:1px solid var(--blue-accent);
	border-top-left-radius:0;
	border-top-right-radius:0
}

.modal-header
{
	border-bottom:1px solid var(--blue-accent);
	border-bottom-left-radius:0!important;
	border-bottom-right-radius:0!important;
	border-radius:1rem
}

.modal-header,.modal-body,.modal-footer
{
	background-color:var(--menu-gray);
	color:var(--font-color)
}

.nav-pills .nav-link.active,.nav-pills .show>.nav-link
{
	background-color:var(--menu-gray);
	border:1px solid var(--blue-accent);
	color:var(--font-color)
}

.nav-tabs .nav-link.active,.nav-tabs .nav-item.show .nav-link
{
	background-color:var(--menu-gray);
	border-color:var(--blue-accent);
	color:var(--font-color)
}

.nav-tabs .nav-link:hover
{
	border-bottom:2px solid var(--blue-accent)
}

.pagination .btn
{
	border-left:1px solid var(--blue-accent);
	border-right:1px solid var(--blue-accent)
}

.pagination .btn:first-child
{
	border-left:1px solid var(--blue-accent)
}

.pagination .btn:last-child
{
	border-right:1px solid var(--blue-accent)
}

.performer-card .fi
{
	bottom:.3rem;
	filter:drop-shadow(0 0 2px rgba(0,0,0,.9));
	height:2rem;
	position:absolute;
	right:.2rem;
	width:3rem
}

.popover
{
	background-color:var(--menu-gray);
	border:1px solid var(--blue-accent)!important;
	border-radius:var(--card-radius)
}

.popover-header
{
	background-color:var(--lighter-gray);
	border-bottom:1px solid var(--blue-accent)
}

.query-text-field
{
	border:1px solid var(--blue-accent)!important
}

.scene-header>h3>.TruncatedText
{
	text-align:left
}

.scene-specs-overlay,.scene-interactive-speed-overlay,.scene-studio-overlay,span.scene-card__date
{
	font-weight:900!important
}

.scrubber-tags-background
{
	background-color:var(--menu-gray);
	height:20px;
	left:0;
	position:absolute;
	right:0
}

::selection
{
	background-color:var(--lighter-gray)!important;
	color:var(--font-color)!important
}

a.minimal,button.minimal
{
	color:var(--font-color)
}

body ::-webkit-scrollbar-thumb
{
	background:var(--blue-accent)
}

body ::-webkit-scrollbar-thumb:hover
{
	background:var(--blue-accent)
}

body ::-webkit-scrollbar-thumb:window-inactive
{
	background:var(--blue-accent)
}

body ::-webkit-scrollbar-track
{
	background:var(--menu-gray)
}

hr
{
	margin:0
}

@media(orientation:portrait) {
	.performer-card-image
	{
		height:25vh
	}
}

.card.performer-card
{
	padding:0
}

.fa-mars
{
	display:none
}

.fa-transgender-alt
{
	display:none
}

.fa-venus
{
	display:none
}

.performer-card__age
{
	color:var(--font-color);
	text-align:center
}

.slick-list .gallery-card
{
	width:min-content
}

.slick-slide .card
{
	height:min-content
}

.slick-track
{
	margin-bottom:1rem;
	top:0
}

.tag-sub-tags,.studio-child-studios
{
	display:none
}

@media (max-width: 576px) {
	.slick-list .scene-card,.slick-list .studio-card
	{
		width:44vw!important
	}
}

.card-popovers
{
	justify-content:space-around;
	margin-bottom:2px;
	margin-top:2px
}

.card-section
{
	height:100%;
	padding:0 .2rem
}

.scene-specs-overlay
{
	bottom:.2rem;
	right:.2rem
}

.scene-studio-overlay
{
	line-height:.8rem;
	max-width:50%;
	right:.2rem;
	top:.2rem
}

@media (min-width: 1200px),(max-width: 575px) {
	.scene-performers .performer-card
	{
		width:47vw
	}

	.scene-performers .performer-card-image
	{
		height:22.5rem
	}
}

#queue-viewer .current
{
	background-color:var(--menu-gray)
}

#scene-edit-details .edit-buttons-container
{
	background-color:var(--background-color)
}

.edit-buttons>button
{
	margin-left:1px
}

.scene-card__details,.gallery-card__details
{
	margin-bottom:0!important
}

.setting-section .setting>div:last-child
{
	display:flex;
	justify-content:center;
	text-align:right
}

span.scene-card__date
{
	display:flex;
	font-size:.8em;
	justify-content:flex-end;
	margin-right:.2rem
}

@media (min-width: 576px) and (min-height: 600px) {
	#tasks-panel .tasks-panel-queue
	{
		background-color:var(--background-color)
	}
}

.gender-icon
{
	display:none
}

.job-table.card
{
	background-color:var(--menu-gray)
}

.scraper-table tr:nth-child(2n)
{
	background-color:var(--lighter-gray)
}

a.marker-count
{
	display:none
}

a[target='_blank']
{
	display:none
}

button.collapse-button.btn-primary:not(:disabled):not(.disabled):hover,button.collapse-button.btn-primary:not(:disabled):not(.disabled):focus,button.collapse-button.btn-primary:not(:disabled):not(.disabled):active
{
	color:var(--font-color)
}

@media(max-width: 576px) {
	.grid-card
	{
		width:47vw
	}
}

.TruncatedText
{
	text-align:center;
	white-space:pre-line;
	word-break:break-word
}

.gallery-card
{
	width:min-content!important
}

.gallery-card-image
{
	max-height:240px!important;
	width:auto!important
}

.grid-card .progress-bar
{
	background-color:var(--lighter-gray);
	bottom:0
}

.grid-card a .card-section-title
{
	color:var(--font-color);
	display:flex;
	justify-content:center
}

.ml-2.mb-2.d-none.d-sm-inline-flex
{
	display:none!important
}

.tag-card
{
	padding:0;
	width:auto!important
}

body
{
	color:var(--font-color);
	padding:3.6rem 0 0
}

div.mb-2
{
	height:auto
}

@media (max-width: 575.98px) and (orientation: portrait) {
	body
	{
		padding:0
	}
}

@media (min-width: 768px) {
	.offset-md-3
	{
		border-left:1px solid var(--blue-accent)
	}
}

.card
{
	background-color:var(--menu-gray);
	padding:0
}

.container,.container-fluid,.container-xl,.container-lg,.container-md,.container-sm
{
	padding-left:0;
	padding-right:0
}

.d-flex.justify-content-center.mb-2.wrap-tags.filter-tags
{
	margin:0!important
}

.input-control,.input-control:focus,.input-control:disabled
{
	background-color:var(--lighter-gray)
}

.input-control,.text-input
{
	border:1px solid var(--blue-accent);
	color:var(--font-color)
}

.navbar-buttons>.mr-2,.card hr
{
	margin:0!important
}

.preview-button .fa-icon
{
	color:var(--font-color)
}

.rating-banner
{
	display:none!important
}

.scene-card-preview,.gallery-card-image,.tag-card-image,.image-card-preview
{
	width:100%
}

.slick-dots li button:before
{
	content:"."
}

.slick-dots li.slick-active button:before
{
	color:var(--blue-accent);
	opacity:.75
}

.tag-item
{
	background-color:var(--lighter-gray);
	border:1px solid var(--blue-accent);
	color:var(--font-color)
}

.tag-item .btn
{
	color:var(--font-color)
}

.text-input,.text-input:focus,.text-input[readonly],.text-input:disabled
{
	background-color:var(--lighter-gray)
}

.top-nav
{
	border-bottom:1px solid var(--blue-accent);
	padding:0 2rem!important
}

a.nav-utility,button[title='Help'],.nav-menu-toggle
{
	margin-left:.5rem
}

button.brand-link,.top-nav .navbar-buttons .btn
{
	height:40px
}

div.react-select__control
{
	background-color:var(--lighter-gray);
	border-color:var(--blue-accent)!important;
	color:var(--font-color)
}

div.react-select__control .react-select__multi-value,div.react-select__multi-value__label,div.react-select__multi-value__remove
{
	background-color:var(--menu-gray);
	color:var(--font-color)!important
}

div.react-select__menu,div.dropdown-menu
{
	background-color:var(--menu-gray);
	border:1px solid var(--blue-accent);
	color:var(--font-color)
}

div.react-select__multi-value
{
	border:1px solid var(--blue-accent);
	border-radius:999px
}

div.react-select__multi-value__label
{
	border-bottom-left-radius:999px;
	border-top-left-radius:999px;
	padding-right:8px
}

div.react-select__multi-value__remove
{
	border-bottom-right-radius:999px;
	border-top-right-radius:999px;
	padding-left:0
}

div.react-select__multi-value__remove:hover
{
	background-color:var(--red-delete)
}

div.react-select__placeholder
{
	color:var(--font-color)
}

div[id='settings-menu-container']
{
	padding-top:.5rem
}

div[role='group'].ml-auto.btn-group>div
{
	margin-right:.5rem;
	margin-top:.5rem
}

@media (max-width: 575.98px) and (orientation: portrait) {
	.container,.container-fluid,.container-xl,.container-lg,.container-nd,.container-sm
	{
		padding-top:3.5rem!important
	}

	.top-nav
	{
		bottom:unset;
		top:auto
	}
}

.grid-card a .card-section-title
{
	display:flex;
	justify-content:center
}

.markdown blockquote,.markdown pre
{
	background-color:var(--lighter-gray)
}

.markdown code
{
	background-color:transparent;
	color:var(--font-color)
}

.markdown table tr:nth-child(2n)
{
	background-color:var(--lighter-gray)
}

.details-list>*:nth-child(4n), .details-list>*:nth-child(4n - 1) {
    background-color: var(--menu-gray);
}
dl.details-list {
    grid-column-gap:0;
}
dt {
    padding-right: .5rem;
}
dd {
    margin-bottom: 0;
    padding-left: .5rem;
    border-left: 1px solid var(--blue-accent);
}
#performer-page .performer-image-container .performer {
    border-radius:var(--menu-rounding);
    border: 0!important;
}
.recommendations-container-edit .recommendation-row {
    background-color: var(--menu-gray);
    border-radius: 1rem;
    border:1px solid var(--blue-accent);
    margin-bottom: 10px;
}
.recommendations-container-edit.recommendations-container>div>div:first-of-type {
    margin-top: calc(1rem + 10px);
}
`;
// Themes CSS End

// Themes CSS Begin
const night = `
/*
Night theme Version 0.1.
*/

body {
	color: #bb0009;
	background-color: #000000;
	
}

.bg-dark {
	background-color: #1a1a1b!important;
}

.card {
	background-color: #30404d;
	border-radius: 3px;
	box-shadow: 0 0 0 1px rgba(16, 22, 26, .4), 0 0 0 rgba(16, 22, 26, 0), 0 0 0 rgba(16, 22, 26, 0);
	padding: 20px;
	background-color: rgba(0, 0, 0, .3);
}

.bg-secondary {
	background-color: #313437 !important;
}

.text-white {
	color: #bb0009 !important;
}

.border-secondary {
	border-color: #2f3335 !important;
}

.btn-secondary.filter-item.col-1.d-none.d-sm-inline.form-control {
	background-color: rgba(0, 0, 0, .15);
}

.btn-secondary {
	color: #bb0009;
	background-color: rgba(0, 0, 0, .15);
}

.btn-primary {
	color: #bb0009;
	background-color: #bb0009;
}

a {
	color: hsla(0, 0%, 100%, .45);
}

.btn.active {
	background-color: #2f3335;
	color: #bb0009;
}

minimal.w-100.active.btn.btn-primary {
	background-color: #bb0009;
	color: #bb0009;
}

.btn-primary {
	color: #fff;
	background-color: #1a1a1b;
	border-color: #374242;
}

.nav-tabs .nav-link.active {
	color: #bb0009;
}

.nav-tabs .nav-link.active:hover {
	border-bottom-color: #bb0009;
	outline: 0;
}

.btn-primary.btn.donate.minimal {
  display: none;
}

.btn-primary.btn.help-button.minimal {
	display: none;
}

.changelog {
  display: none;
}

.nav-tabs .nav-link {
	outline: 0;
	color  #bb0009;
}

.input-control,
.input-control:focus {
	background-color: rgba(16, 22, 26, .3);
}

#performer-page .image-container .performer {
	background-color: rgba(0, 0, 0, .45);
	box-shadow: 0 0 2px rgba(0, 0, 0, .35);
}

.btn-primary:not(:disabled):not(.disabled).active,
.btn-primary:not(:disabled):not(.disabled):active,
.show>.btn-primary.dropdown-toggle {
	color: #fff;
	border-color: #bb0009;
}

.nav-pills .nav-link.active,
.nav-pills .show>.nav-link {
	background-color: #1a1a1b;
}



.btn-primary:not(:disabled):not(.disabled).active,
.btn-primary:not(:disabled):not(.disabled):active,
.show>.btn-primary.dropdown-toggle {
	color: #fff;
	background-color: #2f3335;
	border-color: #bb0009;
}

input[type="range"]::-moz-range-track {
	background: hsla(0, 0%, 100%, .25);
}

input[type="range"]::-moz-range-thumb {
	background: #bcbcbc;
}

div.react-select__control {
	background-color: hsla(0, 0%, 39.2%, .4);
	color: #182026;
	border-color: #394b59;
	cursor: pointer;
}

.scene-wall-item-text-container {
	background: radial-gradient(farthest-corner at 50% 50%, rgba(50, 50, 50, .5) 50%, #323232 100%);
	color: #bb0009;
}

.btn-link {
	font-weight: 500;
	color: #bb0009;
	text-decoration: none;
}

button.minimal.brand-link.d-none.d-md-inline-block.btn.btn-primary {
	text-transform: uppercase;
	font-weight: bold;
	color: #bb0009
}

a.minimal {
	text-transform: uppercase;
	font-weight: bold;
	color: #bb0009
}
a:hover {
	color: hsla(0, 0%, 100%, .7);
}

option {
	background-color: #1a1a1b;
}
.scrubber-tags-background {
    background-color: #202351;
}

.btn-primary.btn.settings-button.minimal {
	color: #007dd0;
}

button.minimal.btn.btn-primary {
	color:  #007dd0;
}

.btn-primary.btn.logout-button.minimal {
	color:  #00bb2f;
}

.scrubber-viewport {
	background-color:  #1f062d;
}
`;
// Themes CSS End

// Themes CSS Begin
const plex = `
/*
StashApp Plex Theme - Fidelio 2020 v1.0.3
 
!CHANGE PATH FOR BACKGROUND in Body and Root in case it does not load!
You can put image files into .stash folder or upload it on imgur, or upload it to your gallery and then link it.


TODO:
fix blue borders
*/

body {
	background-image: url("https://user-images.githubusercontent.com/63812189/79506691-4af78900-7feb-11ea-883e-87b8e05ceb1c.png");
	width: 100%;
	height: 100%;
	background-size: cover;
	background-repeat: no-repeat;
	background-color: #3f4245;
	background-attachment: fixed;
	background-position: center;
}

#root {
	background: rgba(0, 0, 0, 0) url("https://user-images.githubusercontent.com/63812189/79506696-4c28b600-7feb-11ea-8176-12a46454d87a.png") repeat scroll 0% 0%;
	position: absolute;
	width: 100%;
	height: 100%;
	z-index: 2;
}

* {
	scrollbar-color: hsla(0, 0%, 100%, .2) transparent;
}

.bg-dark {
	background-color: #1f2326!important;
}

.card {
	background-color: #30404d;
	border-radius: 3px;
	box-shadow: 0 0 0 1px rgba(16, 22, 26, .4), 0 0 0 rgba(16, 22, 26, 0), 0 0 0 rgba(16, 22, 26, 0);
	padding: 20px;
	background-color: rgba(0, 0, 0, .3);
}

.bg-secondary {
	background-color: #313437 !important;
}

.text-white {
	color: #eee !important;
}

.border-secondary {
	border-color: #2f3335 !important;
}

.btn-secondary.filter-item.col-1.d-none.d-sm-inline.form-control {
	background-color: rgba(0, 0, 0, .15);
}

.btn-secondary {
	color: #eee;
	background-color: rgba(0, 0, 0, .15);
}

a {
	color: hsla(0, 0%, 100%, .45);
}

.btn.active {
	background-color: #2f3335;
	color: #f5f8fa;
}

minimal.w-100.active.btn.btn-primary {
	background-color: #2f3335;
	color: #f5f8fa;
}

.btn-primary {
	color: #fff;
	background-color: #1f2326;
	border-color: #374242;
}

.nav-tabs .nav-link.active {
	color: #eee;
}

.nav-tabs .nav-link.active:hover {
	border-bottom-color: #eee;
	outline: 0;
}

.nav-tabs .nav-link {
	outline: 0;
}

.input-control,
.input-control:focus {
	background-color: rgba(16, 22, 26, .3);
}

#performer-page .image-container .performer {
	background-color: rgba(0, 0, 0, .45);
	box-shadow: 0 0 2px rgba(0, 0, 0, .35);
}

.btn-primary:not(:disabled):not(.disabled).active,
.btn-primary:not(:disabled):not(.disabled):active,
.show>.btn-primary.dropdown-toggle {
	color: #fff;
	border-color: #eee;
}

.nav-pills .nav-link.active,
.nav-pills .show>.nav-link {
	background-color: #1f2326;
}

.btn-primary.focus,
.btn-primary:focus,
.btn-primary:not(:disabled):not(.disabled).active:focus,
.btn-primary:not(:disabled):not(.disabled):active:focus,
.show>.btn-primary.dropdown-toggle:focus {
	box-shadow: none;
}

.btn-primary:not(:disabled):not(.disabled).active,
.btn-primary:not(:disabled):not(.disabled):active,
.show>.btn-primary.dropdown-toggle {
	color: #fff;
	background-color: #2f3335;
	border-color: #eee;
}

input[type="range"]::-moz-range-track {
	background: hsla(0, 0%, 100%, .25);
}

input[type="range"]::-moz-range-thumb {
	background: #bcbcbc;
}

div.react-select__control {
	background-color: hsla(0, 0%, 39.2%, .4);
	color: #182026;
	border-color: #394b59;
	cursor: pointer;
}

.scene-wall-item-text-container {
	background: radial-gradient(farthest-corner at 50% 50%, rgba(50, 50, 50, .5) 50%, #323232 100%);
	color: #eee;
}

.filter-container,
.operation-container {
	background-color: rgba(0, 0, 0, .15);
	box-shadow: none;
	margin-top: -10px;
	padding: 10px;
}

.container-fluid,
.container-lg,
.container-md,
.container-sm,
.container-xl {
	width: 100%;
	margin-right: 0px;
	margin-left: 0px;
}

.btn-link {
	font-weight: 500;
	color: #eee;
	text-decoration: none;
}

button.minimal.brand-link.d-none.d-md-inline-block.btn.btn-primary {
	text-transform: uppercase;
	font-weight: bold;
}

a:hover {
	color: hsla(0, 0%, 100%, .7);
}

option {
	background-color: #1f2326;
}
.folder-list .btn-link {
    color: #2c2e30;
}

#performer-scraper-popover {
  z-index: 10;
}
`;
// Themes CSS End

// Themes CSS Begin
const plexBetterStyles = `
/* Author: tetrax */

.btn-secondary {
    color: #eee;
    background-color: #00000026 !important;
    border: none;
}
.btn.disabled,
.btn:disabled {
    opacity: 0.5 !important;
}
.btn.active {
    background-color: #2f3335;
    color: #f5f8fa;
}
.btn-secondary:not(:disabled):not(.disabled):active:focus,
.btn-secondary:not(:disabled):not(.disabled).active:focus,
.show > .btn-secondary.dropdown-toggle:focus {
    box-shadow: unset;
}
.btn-secondary:not(:disabled):not(.disabled):active,
.btn-secondary:not(:disabled):not(.disabled).active,
.show > .btn-secondary.dropdown-toggle {
    background-color: #0000004d !important;
    border: unset;
}
.btn-primary:not(:disabled):not(.disabled).active,
.btn-primary:not(:disabled):not(.disabled):active,
.show > .btn-primary.dropdown-toggle {
    color: #eee;
    border-color: #eee;
    background-color: #00000026;
}
.btn-primary:not(:disabled):not(.disabled):focus {
    background-color: #2f3335;
}
.btn-primary.focus,
.btn-primary:focus,
.btn-primary:not(:disabled):not(.disabled).active:focus,
.btn-primary:not(:disabled):not(.disabled):active:focus,
.show > .btn-primary.dropdown-toggle:focus {
    box-shadow: none;
}
.pagination .btn {
    border-left: unset;
    border-right: unset;
}
.btn-success.disabled,
.btn-success:disabled,
.btn-success:hover,
.btn-success,
.btn-primary.disabled,
.btn-primary:disabled,
.btn-primary:hover,
.btn-primary {
    color: #000;
    background-color: #d49c21;
    font-weight: 500;
    border: none;
}
.image-card.card,
.gallery-card.card {
    width: unset !important;
}
@media (max-width: 576px) {
    .scene-card-preview,
    .image-card-preview {
        height: auto !important;
    }
    .tag-card-image,
    .gallery-card-image {
        max-height: unset !important;
    }
    .slick-slider .image-card-preview {
        height: 24rem !important;
    }
    .slick-slide .card {
        height: auto;
    }
}
@media (min-width: 576px) {
    .scene-card-preview {
        height: auto !important;
    }
    .zoom-0 .image-card-preview:not(.portrait) {
        height: 180px;
    }
    body:not(:has(.slick-track)) .card.grid-card[class*="scene-"],
    body:not(:has(.slick-track)) .card.grid-card[class*="image-"],
    body:not(:has(.slick-track)) .card.grid-card[class*="gallery-"],
    body:not(:has(.slick-track)) .card.grid-card[class*="performer-"],
    body:not(:has(.slick-track)) .card.grid-card[class*="studio-"],
    body:not(:has(.slick-track)) .card.grid-card[class*="tag-"],
    body:not(:has(.slick-track)) .card.grid-card[class*="movie-"] {
        transition: transform 0.1s ease;
    }
    body:not(:has(.slick-track)) .card.grid-card[class*="scene-"]:hover,
    body:not(:has(.slick-track)) .card.grid-card[class*="image-"]:hover,
    body:not(:has(.slick-track)) .card.grid-card[class*="gallery-"]:hover,
    body:not(:has(.slick-track)) .card.grid-card[class*="performer-"]:hover,
    body:not(:has(.slick-track)) .card.grid-card[class*="studio-"]:hover,
    body:not(:has(.slick-track)) .card.grid-card[class*="tag-"]:hover,
    body:not(:has(.slick-track)) .card.grid-card[class*="movie-"]:hover {
        transform: scale(1.1);
        z-index: 1;
        background-color: #d49c21 !important;
    }
    body:not(:has(.slick-track)) .card.grid-card[class*="scene-"]:hover .card-section *,
    body:not(:has(.slick-track)) .card.grid-card[class*="image-"]:hover .card-section *,
    body:not(:has(.slick-track)) .card.grid-card[class*="gallery-"]:hover .card-section *,
    body:not(:has(.slick-track)) .card.grid-card[class*="performer-"]:hover .card-section *,
    body:not(:has(.slick-track)) .card.grid-card[class*="studio-"]:hover .card-section *,
    body:not(:has(.slick-track)) .card.grid-card[class*="tag-"]:hover .card-section *,
    body:not(:has(.slick-track)) .card.grid-card[class*="movie-"]:hover .card-section * {
        color: #000 !important;
    }
    .card:hover .rating-banner {
        opacity: 0;
    }
}
.job-table.card,
.card {
    border-radius: 5px;
    background-color: #0000004d !important;
}
.StudioTagger-studio,
.search-item,
.PerformerTagger-performer {
    background-color: #00000026 !important;
}
.StudioTagger-studio .studio-card img {
    background-color: unset !important;
}
.selected-result,
.search-result,
.search-result:hover {
    background-color: #00000026 !important;
}
.search-result .performer-select-active .react-select__control,
.search-result .studio-select-active .react-select__control {
    background-color: #00000026;
}
.rating-banner {
    background-color: #0006;
    color: #eee;
    top: -14px;
    left: -58px;
    padding-top: 40px;
    transition: opacity 0.5s;
}
.card hr {
    display: none;
}
.preview-button {
    height: unset;
    width: unset;
    right: 0;
    bottom: 0;
}
.preview-button .fa-icon {
    color: #eee;
    height: 2em;
    transition: opacity 0.2s;
    width: 2em;
}
.skeleton-card {
    background-color: #0000004d;
}
.modifier-options .modifier-option.selected {
    background-color: #d49c21 !important;
    font-weight: 400;
}
.modifier-options .modifier-option {
    background-color: #00000026;
    color: #eee !important;
    font-weight: 400;
}
.query-text-field {
    background-color: #00000026 !important;
}
.mr-2.mb-2.btn-group:not(.dropdown) > .dropdown > button,
.mx-2.mb-2:not(.dropdown) > .dropdown > button {
    padding: 0.45rem 0.75rem;
}
.btn-group > .btn:not(:first-child):has(svg[data-icon="tags"]) {
    border-top-left-radius: 0.25rem;
    border-bottom-left-radius: 0.25rem;
}
.btn-group > .btn:not(:first-child),
.btn-group > .btn-group:not(:first-child) {
    margin-left: unset;
}
.input-group-prepend {
    margin-right: unset;
}
.filter-container,
.operation-container {
    margin: 10px 0;
}
.popover {
    background-color: #0000004d !important;
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
}
.tooltip-inner {
    background-color: #00000080;
}
.tooltip {
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    padding: 0;
    padding-top: 0.4rem;
}
@media (min-width: 576px) {
    .top-nav .navbar-brand a:focus,
    .top-nav .navbar-brand a:hover,
    .top-nav .navbar-brand a:active,
    .top-nav .navbar-brand button:focus,
    .top-nav .navbar-brand button:hover,
    .top-nav .navbar-brand button:active {
        background-color: unset !important;
    }
}
.top-nav .btn.active:not(.disabled),
.top-nav .btn.active.minimal:not(.disabled),
.top-nav a:active,
.top-nav a.minimal:hover:not(:disabled),
.top-nav button.minimal:hover:not(:disabled) {
    background: #0003;
    color: #eee;
}
@media (max-width: 576px) {
    .top-nav .btn.active:not(.disabled),
    .top-nav .btn.active.minimal:not(.disabled),
    .top-nav a:active,
    .top-nav a.minimal:hover:not(:disabled),
    .top-nav button.minimal:hover:not(:disabled) {
        border-radius: 10px;
    }
}
.top-nav.bg-dark {
    background-image: url(https://raw.githubusercontent.com/Tetrax-10/stash-stuffs/main/Themes/PlexBetterStyles/assets/plex-background.png);
    background-size: cover;
    background-repeat: no-repeat;
    background-attachment: fixed;
    background-position: center;
}
.navbar-collapse.bg-dark {
    background-color: unset !important;
}
.top-nav .navbar-buttons button.minimal:hover:not(:disabled),
.top-nav .navbar-buttons a.minimal:hover:not(:disabled) {
    background: unset;
}
body {
    background-image: url(https://raw.githubusercontent.com/Tetrax-10/stash-stuffs/main/Themes/PlexBetterStyles/assets/plex-background.png);
    width: 100%;
    height: 100%;
    background-size: cover;
    background-repeat: no-repeat;
    background-color: #3f4245;
    background-attachment: fixed;
    background-position: center;
}
#root {
    background: #0000 url(https://raw.githubusercontent.com/Tetrax-10/stash-stuffs/main/Themes/PlexBetterStyles/assets/plex-noise.png) repeat scroll 0% 0%;
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 2;
}
.bg-dark {
    background-color: #1f2326 !important;
}
.text-white {
    color: #eee !important;
}
.border-secondary {
    border-color: #2f3335 !important;
}
.input-control,
.text-input {
    box-shadow: none;
}
.text-input,
.text-input:focus,
.text-input[readonly],
.text-input:disabled {
    background-color: #00000026;
}
.input-control,
.input-control:focus,
.input-control:disabled {
    background-color: #00000026;
}
div.react-select__control {
    background-color: #00000026;
    border: none;
}
option {
    background-color: #1f2326;
}
div.react-select__menu,
div.dropdown-menu {
    background-color: unset !important;
    background: url(https://raw.githubusercontent.com/Tetrax-10/stash-stuffs/main/Themes/PlexBetterStyles/assets/plex-background.png) !important;
}
div.dropdown-menu .bg-secondary {
    background-color: unset !important;
}
div.dropdown-menu a:hover,
div.dropdown-menu button:hover {
    background-color: #00000026 !important;
}
.scene-divider.d-none.d-xl-block {
    visibility: hidden;
}
div[class*="-divider"].d-none.d-xl-block:not(.scene-divider) {
    display: none !important;
}
a:hover,
a,
.btn-link:hover,
.btn-link {
    color: #f7c600;
    text-decoration: none;
}
input[type="range"].zoom-slider::-webkit-slider-runnable-track {
    background: #fff3;
    border-radius: 25px;
}
input[type="range"].zoom-slider::-webkit-slider-thumb {
    background: #ddd;
    border-radius: 50%;
}
input[type="range"].zoom-slider:focus::-webkit-slider-runnable-track {
    background: #fff3;
}
input[type="range"].zoom-slider::-moz-range-track {
    background: #fff3;
    border-radius: 25px;
}
input[type="range"].zoom-slider::-moz-range-thumb {
    background: #ddd;
    border-radius: 25px;
}
input[type="range"].zoom-slider::-ms-fill-lower {
    background: #fff3;
    border-radius: 50px;
}
input[type="range"].zoom-slider::-ms-fill-upper {
    background: #fff3;
    border-radius: 50px;
}
input[type="range"].zoom-slider::-ms-thumb {
    background: #ddd;
    border-radius: 50%;
}
input[type="range"].zoom-slider:focus::-ms-fill-lower {
    background: #fff3;
}
input[type="range"].zoom-slider:focus::-ms-fill-upper {
    background: #fff3;
}
.badge-info {
    color: #000;
    background-color: #d49c21;
}
.tag-item {
    background-color: #0003 !important;
    color: #eee !important;
}
.tag-item > button {
    color: #fff !important;
}
.tab-content,
.scene-tabs {
    scrollbar-width: none !important;
}
.tab-content::-webkit-scrollbar,
.scene-tabs::-webkit-scrollbar {
    display: none !important;
}
html ::-webkit-scrollbar {
    width: 10px;
    background-color: transparent;
}
html ::-webkit-scrollbar-thumb {
    background-color: #2b2b2b;
    border-radius: 6px;
}
.rating-stars .btn-secondary {
    background-color: unset !important;
}
.badge-secondary {
    color: #000;
    background-color: #d49c21;
}
.modal-header,
.modal-body,
.modal-footer {
    background-image: url(https://raw.githubusercontent.com/Tetrax-10/stash-stuffs/main/Themes/PlexBetterStyles/assets/plex-background.png);
    background-size: cover;
    background-repeat: no-repeat;
    background-color: #3f4245;
    background-attachment: fixed;
    background-position: center;
}
.markdown blockquote,
.markdown pre,
.markdown table tr:nth-child(2n) {
    background-color: #00000026 !important;
}
.markdown code {
    background-color: unset !important;
    color: #f7c600;
}
@media (max-width: 576px) {
    .performer-card-image {
        height: unset;
    }
}
.card.performer-card {
    padding: 0 0 0.5rem;
}
.detail-header:not(:has(.background-image)) {
    background-color: unset;
}
.detail-body nav {
    border-bottom: none;
}
a.minimal.link.btn[target="_blank"][rel="noopener noreferrer"].twitter,
a.minimal.link.btn[target="_blank"][rel="noopener noreferrer"].twitter:hover {
    color: #1da1f2 !important;
}
a.minimal.link.btn[target="_blank"][rel="noopener noreferrer"].instagram,
a.minimal.link.btn[target="_blank"][rel="noopener noreferrer"].instagram:hover {
    color: #ff498e !important;
}
.nav-tabs .nav-link.active:hover,
.nav-tabs .nav-link.active {
    background-color: #00000026;
    border-bottom: 2px solid;
    color: #eee;
}
.nav-tabs .nav-link:hover {
    border-bottom: none;
}
#scene-edit-details .edit-buttons-container {
    background-color: #00000026;
    margin: unset;
    margin-bottom: 10px;
    border-radius: 5px;
}
.tab-content #scene-edit-details .edit-buttons-container {
    background: linear-gradient(to right, #353e3f, #464f4d);
}
.stash-id-pill span {
    background-color: #d49c21;
    color: #000;
}
.stash-id-pill a {
    background-color: #00000026;
}
#queue-viewer .queue-controls {
    background-color: unset;
}
#queue-viewer .current {
    background-color: #00000026;
}
.table-list table thead {
    background-color: #0003;
}
.table-list tbody tr:hover {
    background-color: #00000026;
}
.table-striped tr:nth-child(odd) td {
    background-color: #0000000d !important;
}
#tasks-panel .tasks-panel-queue {
    position: unset;
}
#tasks-panel .tasks-panel-queue {
    background: #0000;
}
#settings-container .card {
    background-color: #00000026 !important;
}
.nav-pills .nav-link.active,
.nav-pills .show > .nav-link {
    background-color: #d49c21;
}
#settings-menu-container .nav-pills .nav-link.active,
#settings-menu-container .nav-pills .show > .nav-link {
    color: #000;
    font-weight: 500;
}
code {
    font-size: unset;
    color: #f7c600;
}
.custom-control-input:checked ~ .custom-control-label:before {
    color: #fff;
    border-color: #d49c21;
    background-color: #d49c21;
}
.custom-control-label:before {
    background-color: #0000004d;
    border: 1px solid rgba(0, 0, 0, 0.3);
}
.custom-control-input[disabled] ~ .custom-control-label:before,
.custom-control-input:disabled ~ .custom-control-label:before {
    background-color: #0000004d;
}
#settings-menu-container a:hover {
    color: #f7c600;
}
#stash-table .bg-dark {
    background-color: #00000026 !important;
}
.scraper-table tr:nth-child(2n) {
    background-color: #00000026;
}
.setting-section .setting .value {
    color: #f7c600;
}
.package-manager table thead {
    background-color: #0000;
}
.clearable-text-field,
.clearable-text-field:active,
.clearable-text-field:focus {
    background-color: #00000026 !important;
    border-color: #00000026 !important;
}
#settings-container .btn-primary:not(:disabled):not(.disabled):not(.collapse-button).active,
#settings-container .btn-primary:not(:disabled):not(.disabled):not(.collapse-button):active,
#settings-container .btn-primary:not(:disabled):not(.disabled):not(.collapse-button):hover,
#settings-container .btn-primary:not(:disabled):not(.disabled):not(.collapse-button):focus,
#settings-container .btn-primary:not(:disabled):not(.disabled):not(.collapse-button) {
    color: #000;
    background-color: #d49c21;
}
#settings-container .btn-secondary {
    color: #000;
    background-color: #d49c21 !important;
    font-weight: 500;
    border: none;
}
.bg-secondary {
    background-color: #00000026 !important;
    border: none !important;
}
a.minimal.link.btn[target="_blank"][rel="noopener noreferrer"] {
    color: #f7c600 !important;
    background-color: unset !important;
}
.studio-card.card a:hover,
.studio-card.card a {
    color: #f7c600;
}
.input-group-text {
    background-color: #00000026;
    border: none;
}
`;
// Themes CSS End

// Themes CSS Begin
const pornHub = `
/* Author: ronilaukkarinen */
/* stylelint-disable selector-max-specificity, declaration-no-important, selector-type-no-unknown, selector-max-class, a11y/no-outline-none, no-descending-specificity, selector-max-pseudo-class, property-disallowed-list, font-weight-notation, max-line-length, a11y/no-display-none, a11y/font-size-is-readable */
/* Pornhub inspired stash theme */
/* Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');

/* Variables */
:root {
  --color-black: #000;
  --color-text: #c6c6c6;
  --color-text-dim: #969696;
  --color-border: var(--color-black);
  --color-hubs: #f90;
  --color-cod-gray: #151515;
  --color-silver: #cacaca;
  --color-dark: #1b1b1b;
  --color-dim: #2f2f2f;
  --color-icon-toggled: #5faa01;
  --color-star: #f5c518;
  --color-white: #fff;
  --color-favorite: #c71d1d;
}

body {
  background-attachment: fixed;
  background-color: var(--color-black);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  color: var(--color-text);
  font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen-Sans, Ubuntu, Cantarell, Helvetica Neue, sans-serif;
  height: 100%;
  padding: 6rem 0 0;
  /* background-image: url("https://user-images.githubusercontent.com/63812189/79506691-4af78900-7feb-11ea-883e-87b8e05ceb1c.png"); */
  width: 100%;
}

body.login {
  padding-top: 0 !important;
}

@media (max-width: 1200px) {
  body {
    padding-top: 0 !important;
  }

  .main.container-fluid {
    padding-top: 2.2rem !important;
  }
}

.top-nav .navbar-toggler {
  width: auto !important;
}

.top-nav a[href="/scenes/new"] button.btn {
  color: var(--color-hubs);
  font-size: 14px !important;
}

body .badge,
body a,
body .tag-item {
  transition: all 100ms;
}

body div,
body p,
body a {
  font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen-Sans, Ubuntu, Cantarell, Helvetica Neue, sans-serif;
}

.show-carat.dropdown .btn,
.fa-icon,
.btn.minimal {
  color: var(--color-silver) !important;
}

.rating-stars .set {
  color: var(--color-star) !important;
}

.organized-button.organized svg {
  color: var(--color-icon-toggled) !important;
}

.favorite svg,
.favorite {
  color: var(--color-favorite) !important;
  filter: none !important;
}

.thumbnail-section .favorite svg {
  height: 20px;
  width: 20px;
}

.show-carat.dropdown .btn,
.btn.minimal {
  background-color: transparent !important;
  border: 0 !important;
}

#root {
  height: 100%;
  /* background: rgba(0, 0, 0, 0) url("https://user-images.githubusercontent.com/63812189/79506696-4c28b600-7feb-11ea-8176-12a46454d87a.png") repeat scroll 0% 0%; */
  position: absolute;
  width: 100%;
  z-index: 2;
}

* {
  scrollbar-color: hsl(0deg 0% 100% / .2) transparent;
}

.bg-dark {
  background-color: var(--color-black) !important;
}

.card {
  background-color: var(--color-black);
  background-color: rgb(0 0 0 / .3);
  border-radius: 3px;
  box-shadow: 0 0 0 1px rgb(16 22 26 / .4), 0 0 0 rgb(16 22 26 / 0), 0 0 0 rgb(16 22 26 / 0);
  padding: 20px;
}

.bg-secondary {
  background-color: var(--color-black) !important;
}

.pagination .btn {
  align-items: center;
  appearance: none;
  background-color: var(--color-cod-gray) !important;
  border: none;
  border-radius: 4px;
  color: var(--color-text) !important;
  cursor: pointer;
  display: inline-flex;
  font-size: 20px !important;
  font-weight: 700;
  height: 60px !important;
  justify-content: center;
  margin: 0 4px !important;
  min-width: 60px !important;
  outline: 0 none;
  padding: 0 20px;
  position: relative;
  text-align: center;
  text-decoration: none;
  vertical-align: top;
}

.pagination .btn:hover,
.pagination .btn:focus {
  background-color: var(--color-dim) !important;
}

.pagination .btn:first-of-type,
.pagination .btn:last-of-type {
  background: var(--color-black) !important;
}

.pagination .btn.active {
  background: var(--color-hubs) !important;
}

.text-white,
body p {
  color: var(--color-text) !important;
}

.border-secondary {
  border-color: var(--color-border) !important;
}

.btn-secondary.filter-item.col-1.d-none.d-sm-inline.form-control {
  background-color: rgb(0 0 0 / .15);
}

.btn.active,
.btn-secondary {
  color: var(--color-black) !important;
  font-weight: 700;
}

.btn-primary.disabled,
.btn-primary:disabled,
.btn-primary:hover,
.btn-primary:focus,
.btn-primary.focus,
minimal.w-100.active.btn.btn-primary,
.btn-primary {
  background-color: var(--color-hubs);
  border-color: var(--color-hubs);
  box-shadow: none !important;
  color: var(--color-black);
  font-weight: 700;
  outline: 0 !important;
}

.nav-tabs .nav-link.active:hover,
.nav-tabs .nav-link.active:focus {
  border-bottom-color: var(--color-text);
  outline: 0;
}

.nav-tabs .nav-link {
  outline: 0;
}

.btn-primary:not(:disabled):not(.disabled).active,
.btn-primary:not(:disabled):not(.disabled):active,
.show > .btn-primary.dropdown-toggle {
  border-color: var(--color-text);
  color: var(--color-text);
}

.nav-pills .nav-link.active,
.nav-pills .show > .nav-link {
  background-color: var(--color-black);
}

input[type="range"]::-moz-range-track {
  background: hsl(0deg 0% 100% / .25);
}

input[type="range"]::-moz-range-thumb {
  background: #bcbcbc;
}

div.react-select__control {
  background-color: hsl(0deg 0% 39.2% / .4);
  border-color: #394b59;
  color: #182026;
  cursor: pointer;
}

.navbar-nav a,
.navbar-nav button {
  background: none !important;
  border: 0 !important;
  box-shadow: none !important;
}

.TruncatedText {
  line-height: 1.3;
}

.navbar-nav {
  gap: 1rem;
}

.scene-wall-item-text-container {
  background: radial-gradient(farthest-corner at 50% 50%, rgb(50 50 50 / .5) 50%, #323232 100%);
  color: #eee;
}

body .scene-header {
  color: var(--color-white);
  font-size: 17px;
  font-weight: 700;
  word-break: break-word;
  word-wrap: break-word;
}

.filter-container,
.operation-container {
  box-shadow: none;
  color: var(--color-text-dim) !important;
  margin-top: -10px;
  padding: 10px;
}

.container-fluid,
.container-lg,
.container-md,
.container-sm,
.container-xl {
  margin-left: 0;
  margin-right: 0;
  width: 100%;
}

.btn-link {
  color: #eee;
  font-weight: 500;
  text-decoration: none;
}

button.minimal.brand-link.d-none.d-md-inline-block.btn.btn-primary {
  font-weight: bold;
  text-transform: uppercase;
}

a:hover,
a:focus {
  color: hsl(0deg 0% 100% / .7);
}

option {
  background-color: var(--color-black);
  color: var(--color-white);
}

select:focus > option:checked,
select option:hover,
option:checked,
option:hover,
option:focus {
  background-color: var(--color-hubs) !important;
  color: var(--color-black) !important;
}

.folder-list .btn-link {
  color: #2c2e30;
}

#performer-scraper-popover {
  z-index: 10;
}

body {
  background: var(--color-black) !important;
}

.card {
  background: var(--color-black) !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
/* .btn-primary {
  color: #fff;
  background-color: #131313 !important;;
  border-color: #131313 !important;;
} */

.nav-pills .nav-link.active,
.nav-pills .show > .nav-link {
  background-color: #131313 !important;
  border-color: #131313 !important;
}

#tasks-panel .tasks-panel-queue {
  background-color: var(--color-black) !important;
}

.top-nav .bg-dark,
.top-nav.navbar {
  background: var(--color-dark) !important;
}

body .top-nav {
  border-radius: 0 !important;
  padding: 10px 15px !important;
}

.top-nav .btn {
  border: 0 !important;
  border-radius: 0 !important;
  display: inline-flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  font-size: 16px !important;
  font-weight: 400 !important;
  gap: 8px;
  padding: 6px 8px !important;
}

.top-nav .btn:hover svg,
.top-nav .btn:focus svg,
.top-nav .btn:hover,
.top-nav .btn:focus {
  color: var(--color-white) !important;
  opacity: 1 !important;
}

.top-nav .btn .fa-icon {
  margin: 0 !important;
}

body .top-nav .navbar-brand {
  margin-left: 0 !important;
  margin-right: 1.5rem;
  padding: 0 !important;
}

body .top-nav .navbar-brand button {
  color: var(--color-white) !important;
  display: inline-block !important;
  font-weight: 700 !important;
  padding: 0 !important;
}

body .top-nav .navbar-brand button::after {
  background: var(--color-hubs);
  border-radius: 3px;
  color: var(--color-black);
  content: 'hub';
  display: inline-block;
  font-weight: 700 !important;
  margin: 0 0 0 3px;
  padding: 0 2px;
}

.top-nav .btn.active {
  border: 0 !important;
  color: var(--color-white) !important;
}

.navbar-dark .navbar-toggler {
  border-color: transparent !important;
}

button[title="Donate"] {
  display: none !important;
}

* {
  outline: none !important;
}

.grid-card a .card-section-title,
.section-title {
  color: var(--color-text) !important;
  font-size: 15px !important;
  line-height: 17px !important;
}

.card-section > a + span,
.card-section > a + span + p {
  color: var(--color-text-dim) !important;
}

.bg-secondary,
.btn-secondary,
.border-secondary {
  background-color: var(--color-hubs) !important;
  border-color: var(--color-black) !important;
}

/* [Scenes tab] Allow for longer string when displaying "Studio as Text" on scene thumbnails */
.scene-studio-overlay {
  font-weight: 600 !important;
  opacity: 1 !important;
  text-overflow: ellipsis !important;
  width: 60% !important;
}

/* [Scenes tab] Hide studio logo/text from scene card */
.scene-studio-overlay {
  display: none;
}

/* [Scenes tab] Fit more thumbnails on each row */
.grid {
  padding: 0 !important;
}

/* [Scenes tab] Make the list of tags take up less width */
.bs-popover-bottom {
  max-width: 500px;
}

/* [Scenes tab] Adjust the mouse over behaviour in wall mode */
@media (min-width: 576px) {
  .wall-item:hover::before,
  .wall-item:focus::before {
    opacity: 0;
  }

  .wall-item:hover .wall-item-container,
  .wall-item:focus .wall-item-container {
    transform: scale(1.5);
  }
}

/* [Scenes tab] Disable zoom on hover in wall mode */
.wall-item:hover .wall-item-container,
.wall-item:focus .wall-item-container {
  transform: none;
}

.wall-item::before {
  opacity: 0 !important;
}

/* [Scenes tab] Hide the scene scrubber and max out the player's height */
.scrubber-wrapper {
  display: none;
}

/* [Scenes Tab] - Hide the truncated text on scene card */
.TruncatedText.scene-card__description {
  display: none;
}

/*
.performer-image-container {
  flex: 0 0 50%;
  max-width: 50%;
}*/

/* Changing .col-md-8 settings also affects studios and tags display. 50% should be good enough. */
.col-md-8 {
  flex: 0 0 50%;
  max-width: 50%;
}

/* [Performers tab] Move the buttons in the Performer's edit panel to the top instead of bottom (in newer version of Stash, the buttons are already positioned both at top and bottom.  */
form#performer-edit {
  display: flex;
  flex-direction: column;
}

#performer-edit > .row {
  order: 1;
}

#performer-edit > .row:last-child {
  margin-bottom: 1rem;
  order: 0;
}

/* [Performers tab] Move the tags row in the Performer's edit panel to the second position (just after name).  */
form#performer-edit {
  display: flex;
  flex-direction: column;
}

#performer-edit > .row:nth-child(21) {
  order: -1;
}

#performer-edit > .row:first-child {
  order: -2;
}

.scene-tabs .studio-logo {
  display: none !important;
}

/* Custom rating banner */
body .rating-banner {
  background: transparent;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  color: #fff;
  display: block;
  font-size: .86rem;
  font-weight: 400;
  height: 0;
  left: 0;
  letter-spacing: 1px;
  line-height: 1.6rem;
  margin: 6px 10px;
  padding: 10px;
  position: absolute;
  text-indent: 0;
  top: 0;
  transform: none;
  visibility: hidden;
  width: 88px;
}

body .rating-banner {
  background: none;
}

body .rating-banner::after {
  background: var(--color-star);
  border-radius: 5px;
  color: var(--color-black);
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  height: 30px;
  left: 0;
  margin-top: 5px;
  padding: 5px;
  position: absolute;
  text-indent: 0;
  top: 0;
  visibility: visible;
  width: 30px;
}

body .rating-banner.rating-3::after {
  content: '3';
}

body .rating-banner.rating-4::after {
  content: '4';
}

body .rating-banner.rating-5::after {
  content: '5';
}

.wall-item-text {
  display: none !important;
}

body .scene-card-preview-video,
.scene-card-preview.portrait .scene-card-preview-image,
.scene-card-preview.portrait .scene-card-preview-video,
.gallery-card-preview.portrait .scene-card-preview-image,
.gallery-card-preview.portrait .scene-card-preview-video {
  object-fit: cover !important;
  object-position: center !important;
}

.bs-popover-bottom > .arrow::after,
.bs-popover-auto[x-placement^="bottom"] > .arrow::after,
.bs-popover-bottom > .arrow::before,
.bs-popover-auto[x-placement^="bottom"] > .arrow::before {
  border-bottom-color: var(--color-cod-gray) !important;
}

[role="tooltip"],
.popover,
.input-control,
.input-control:focus,
.input-control:disabled,
.dropdown-menu,
.dropdown-menu .bg-secondary,
.dropdown-menu .btn-secondary,
.dropdown-menu a,
.scraper-group .btn,
.scraper-group input,
[role="toolbar"] ::-webkit-keygen-select,
[role="toolbar"] input,
[role="toolbar"] .btn,
[role="toolbar"] .btn-secondary {
  background-color: var(--color-cod-gray) !important;
  border-color: var(--color-cod-gray) !important;
  color: var(--color-silver) !important;
}

.tag-item {
  background: var(--color-dark);
  border-radius: 8px;
  color: var(--color-white);
  display: inline-block;
  font-size: 14px;
  font-weight: 400;
  margin-bottom: 8px;
  padding: 8px 18px;
  text-transform: capitalize;
  white-space: nowrap;
}

.tag-item:hover,
.tag-item:focus {
  background: var(--color-dim);
}

.tag-item:first-of-type {
  margin-left: 0;
}

.row h6 {
  margin-top: 10px;
}

body .nav-tabs .nav-link {
  border-bottom: 1px solid transparent !important;
  border-radius: 0 !important;
  color: var(--color-text);
  font-size: 11px;
  padding: 8px 15px;
}

.nav-tabs .nav-link.active,
.nav-tabs .nav-item.show .nav-link,
body .nav-tabs .nav-link.active {
  background-color: var(--color-black) !important;
  border-bottom: 1px solid var(--color-hubs) !important;
  color: var(--color-white) !important;
}

@media (min-width: 1200px) {
  body .navbar-expand-xl .navbar-nav .nav-link {
    padding-left: 0;
    padding-right: 0;
  }
}

body .text-muted {
  color: var(--color-text-dim) !important;
}

/* Range input */
input::-webkit-slider-runnable-track,
input::-moz-range-track,
input::-ms-track,
input,
input[type="range"] {
  accent-color: var(--color-hubs) !important;
  appearance: none;
}

.custom-control-input:checked ~ .custom-control-label::before {
  background-color: var(--color-hubs) !important;
  border-color: var(--color-hubs) !important;
}

input[type="range"] {
  appearance: none;
  height: 38px;
  margin: 10px 0;
  width: 100%;
}

input[type="range"]:focus {
  outline: none;
}

input[type="range"]::-webkit-slider-runnable-track {
  background: var(--color-hubs);
  border-radius: 5px;
  cursor: pointer;
  height: 8px;
  width: 100%;
}

input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  background: #fff;
  border-radius: 5px;
  cursor: pointer;
  height: 20px;
  width: 8px;
}

input[type="range"]:focus::-webkit-slider-runnable-track {
  background: var(--color-hubs);
}

input[type="range"]::-moz-range-track {
  background: var(--color-hubs);
  border-radius: 5px;
  cursor: pointer;
  height: 10px;
  width: 100%;
}

input[type="range"]::-moz-range-thumb {
  background: #fff;
  border-radius: 5px;
  cursor: pointer;
  height: 30px;
  width: 12px;
}

input[type="range"]::-ms-track {
  background: transparent;
  border-color: transparent;
  color: transparent;
  cursor: pointer;
  height: 10px;
  width: 100%;
}

input[type="range"]::-ms-fill-lower {
  background: var(--color-hubs);
  border-radius: 10px;
}

input[type="range"]::-ms-fill-upper {
  background: var(--color-hubs);
  border-radius: 10px;
}

input[type="range"]::-ms-thumb {
  background: #fff;
  border-radius: 5px;
  cursor: pointer;
  height: 30px;
  margin-top: 1px;
  width: 12px;
}

input[type="range"]:focus::-ms-fill-lower {
  background: var(--color-hubs);
}

input[type="range"]:focus::-ms-fill-upper {
  background: var(--color-hubs);
}

.top-nav .navbar-buttons .btn[title="Help"],
.top-nav .navbar-buttons .btn.donate {
  display: none !important;
}

.stats-element .title {
  color: var(--color-white) !important;
  font-weight: 700 !important;
}

div[role="toolbar"] + .d-flex > .tag-item.badge.badge-secondary {
  align-items: center;
  background: none !important;
  bottom: 0;
  display: inline-flex;
  gap: 10px;
}

div[role="toolbar"] + .d-flex > .tag-item.badge.badge-secondary button[type="button"] {
  align-items: center;
  background: none !important;
  bottom: 0 !important;
  display: inline-flex;
  margin: 0 !important;
}

.recommendation-row.studio-recommendations,
.recommendation-row.movie-recommendations {
  display: none !important;
}

a {
  color: var(--color-hubs);
}

.btn,
.btn-primary,
.btn-secondary {
  border-radius: 3px !important;
}

/* Slick fixes */
.slick-slider .slick-prev,
.slick-slider .slick-next {
  display: none !important;
}

.recommendations-container {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

h2 {
  text-transform: unset !important;
}

.recommendation-row-head {
  position: relative;
  z-index: 100;
}

.recommendation-row-head a {
  font-size: 14px;
}

@media (max-width: 1200px) {
  .container,
  .container-xl,
  .container-lg,
  .container-md,
  .container-sm {
    padding-left: 0 !important;
    padding-right: 0 !important;
    width: unset !important;
  }

  .filter-container {
    flex-wrap: wrap !important;
    margin: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  .top-nav .navbar-buttons {
    margin-left: unset !important;
    margin-right: unset !important;
  }

  .fixed-top {
    justify-content: space-between !important;
    margin-left: unset !important;
    margin-right: unset !important;
    position: unset !important;
  }

  .navbar-dark .navbar-nav .nav-link {
    display: block;
    flex-basis: 100%;
    max-width: 100%;
    width: 100%;
  }

  .navbar-nav {
    gap: 0;
  }

  .navbar-dark .navbar-nav .nav-link a {
    gap: 14px;
    justify-content: flex-start !important;
    padding-bottom: 15px !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    padding-top: 15px !important;
  }

  .top-nav .btn .fa-icon {
    height: 22px;
    width: 22px;
  }

  .top-nav .navbar-collapse .navbar-nav {
    justify-content: flex-start;
    padding-bottom: 0;
    padding-top: 1rem;
  }

  .pagination .btn {
    font-size: 16px !important;
    height: 40px !important;
    min-width: 40px !important;
  }

  .slick-slide .card {
    height: unset;
  }
}

[data-rb-event-key="https://opencollective.com/stashapp"] {
  display: none !important;
}

@media (max-width: 576px) {
  .top-nav .navbar-collapse .navbar-nav {
    padding-bottom: 1rem;
    padding-top: 0;
  }
}
`;
// Themes CSS End

// Themes CSS Begin
const pulsar = `
/*	StashApp Pulsar Theme - Fonzie 2020-21 v1.8.1  	 */
/* ---------------------------------------------------- */
/* --------- Updated to Stash version 0.12.0 ---------- */

/* 
	Bug Fixes: Overlap of Help & Ssettings" buttons in the navbar, as well 
	as the Identify task

	Complete overhaul of the Settings page
	
	Bug Fix: Background-color in the navigation bar
   
	Adjustments to version 0.10.0 which includes moving the movie-, image- 
	and gallery-counter to the bottom of the performer image when you hover 
	over the card, and increasing the size of the star rating in the highest 
	zoom level.   	
   
   
*/



/* ===================== General ===================== */

body {
	background-image:url("https://i.imgur.com/gQtSoev.jpg");	/*	Aphonus		*/
/*	background-image:url("https://i.imgur.com/6BBd6aa.jpg");	/*	Plex		*/
/*	background-image:url("https://i.imgur.com/xAzxryr.jpg");	/*	Almora		*/
/*	background-image:url("https://i.imgur.com/0iN75zD.jpg");	/*	Dacirus		*/
/*	background-image:url("https://i.imgur.com/g5ECcdD.jpg");	/*	Drionope	*/
/*	background-image:url("https://i.imgur.com/dhVsc3d.jpg");	/*	Elein		*/
/*	background-image:url("https://i.imgur.com/B5hdvQG.jpg");	/*	FreePhion	*/
/*	background-image:url("https://i.imgur.com/LcSat6V.jpg");	/*	Lilac		*/
/*	background-image:url("https://i.imgur.com/kn9wixj.jpg");	/*	Nolrirus	*/
/*	background-image:url("https://i.imgur.com/190rDim.jpg");	/*	Ongion		*/
/*	background-image:url("https://i.imgur.com/IpvdJVn.jpg");	/*	PurpleRough	*/
/*	background-image:url("https://i.imgur.com/hAHylub.jpg");	/*	Tesioria	*/
/*	background-image:url("https://i.imgur.com/QKiFSvE.jpg");	/*	Ichix		*/
/*	background-image:url("https://i.imgur.com/8cIqGWj.jpg");	/*	SeaGreen	*/
/*	background-image:url("https://i.imgur.com/WNXNwV3.jpg");	/*	BrownBlur	*/
/*	background-image:url("./custom/background.jpg");		/*	Local Background	*/

	font-family:Helvetica, Verdana;
	width: 100%;
	height: 100%;
	padding: 0 0 0;
	background-size: cover;
	background-repeat: no-repeat;
	background-color:#127aa5;
	background-attachment: fixed;
	background-position: center;
	color: #f9fbfd;
}

h1,h2,h3,h4,h5,h6 {	font-family:Helvetica, Verdana;}
:root {
	--HeaderFont: Helvetica, "Helvetica Neue", "The Sans", "Segoe UI";
	--std-txt-shadow: 2px 2px 1px #000;
	--light-txt-shadow: 1px 2px 1px #222;
	--white: #ffffff;
	--stars: url("https://i.imgur.com/YM1nCqo.png");
}


/* --- The Home button in the top left corner of each page. Remove the last 3 lines if you don't like the logo --- */
button.minimal.brand-link.d-none.d-md-inline-block.btn.btn-primary, 
button.minimal.brand-link.d-inline-block.btn.btn-primary {
	text-transform: uppercase;
	font-weight: bold;
	margin-left:1px;
	background-image:url("./favicon.ico");
	padding-left:40px;
	background-repeat: no-repeat;
}

/* --- Makes the background of the Navigation Bar at the Top half-transparent --- */
nav.bg-dark {background: rgba(10, 20, 25, 0.50)!important;}
.bg-dark {background:none !important;background-color:none !Important}
.form-group .bg-dark {background: rgba(10, 20, 25, 0.20)!important;}

.navbar-buttons.navbar-nav a.nav-utility {margin-right:9px}

/* --- The space between the Navigation Bar and the rest of the page --- */
.main { margin-top:18px }
.top-nav { padding: .13rem 1rem; }


/* --- Changes how the Bar at the top of the page behaves --- */
.fixed-bottom, .fixed-top { position: relative !important; top:0px !important} 


/* The pagination at the top and at the bottom of the Scenes/Performer/Images/... pages; 
transparent background, rounded corners, etc. */
.filter-container, .operation-container {
	background-color: rgba(0, 0, 0, .22);
	box-shadow: none;
	margin-top: 6px;
	border-radius: 5px;
	padding: 5px;
}


/* --- Changes the space between the button in the top right corner of the page --- */
.order-2 button { margin-left: 4px }

/* --- Space between the items in the Nav bar --- */
.nav-link > .minimal {  margin: 0px;}


/* Each item on the Scenes/Performers/Tags/... pages */
.card {
	padding: 20px; 
	margin: 4px 0.5% 14px;
	/* --- Adds a glowing shimmer effect --- */
	background-image: linear-gradient(130deg, rgba(60, 70, 85,0.21), rgba(150, 155, 160,0.30), rgba(35, 40, 45,0.22), rgba(160, 160, 165,0.21), rgba(50, 60, 65,0.30)); 
	background-color: rgba(16, 20, 25, .25); 
	box-shadow: 2px 2px 6px rgba(0, 0, 0, .55);
	/* --- Increases the rounded borders of each item on the Scenes/Performers/... pages for 6px in 10px --- */
	border-radius: 10px;
}

/* --- Removes the glowing shimmer effect on the start page & the settings for readability purpose --- */
.mx-auto.card, .changelog-version.card {
	background-image: none !important; 
	background-color: rgba(16, 20, 25, .40) !important; 
}

/* --- Color that is used within .card secments --- */
.text-muted {	color: #f0f0f0 !important}


.bg-secondary {
	background: none;
	background-color: rgba(10, 25, 30, .62) !important;
}
 
.text-white {	color: #f0f0f0 }
.border-secondary {	border-color: #2f3335 }
 
.btn-secondary.filter-item.col-1.d-none.d-sm-inline.form-control {
    background-color: rgba(0, 0, 0, .08);
}

/* --- Changes the color and the background of the buttons and elements in the toolbar (Search, Sort by, # of Items, etc.) --- */
.btn-secondary {
    color: #f2f2f2;
    background-color: rgba(0, 0, 0, .08);
    border-color: #3c3f45;
}
 
a {	color: hsla(0, 10%, 95%, .75);}



/* --- Changes the color of the active page in the Navgation Bar --- */ 
.btn-primary:not(:disabled):not(.disabled).active,
.btn-primary:not(:disabled):not(.disabled):active,
.show>.btn-primary.dropdown-toggle {
	color: #fff;
	background-color: rgba(22, 50, 60, .75);
	border-color: #fff;
}

/* --- No border of the active element in the Navgation Bar --- */
.btn-primary.focus,
.btn-primary:focus,
.btn-primary:not(:disabled):not(.disabled).active:focus,
.btn-primary:not(:disabled):not(.disabled):active:focus,
.show>.btn-primary.dropdown-toggle:focus {box-shadow: none;}

.btn-primary:not(:disabled):not(.disabled).active,
.btn-primary:not(:disabled):not(.disabled):active,
.show>.btn-primary.dropdown-toggle {
	color: #fff;
	border-color: #eee;
}

.container-fluid,.container-lg,.container-md,.container-sm,.container-xl {
	width: 100%;
	margin-right: 0px;
	margin-left: 0px;
}





/* ===================== Performer ========================= */


/* --- 0.90 - Section moves Movie-, Image- & Gallery-Count to the bottom of the performer image when hovered over --- */

.performer-card .card-popovers .movie-count,
.performer-card .card-popovers .image-count,
.performer-card .card-popovers .gallery-count
{
	z-index:300;
    position:absolute;
    top:-270%;
	opacity:0.0;
}

/* --- Highlight the bottom of the performer card when hovered over --- */
.performer-card.grid-card:hover {
	background-image: linear-gradient(130deg, rgba(50, 60, 75,0.25), rgba(150, 155, 160,0.32), rgba(35, 40, 45,0.26), rgba(160, 160, 165,0.27), rgba(50, 60, 65,0.37));
	background-color: rgba(62, 72, 80, .26);
}

/* --- When hovered over blend them in ---*/
.performer-card.grid-card:hover .card-popovers .movie-count,
.performer-card.grid-card:hover .card-popovers .image-count,
.performer-card.grid-card:hover .card-popovers .gallery-count {opacity: 1.0;transition: opacity .7s;}

/* --- 3 items gets a shadow ---*/
.performer-card .card-section .movie-count span,
.performer-card .card-section .movie-count button.minimal,
.performer-card .card-section .image-count span,
.performer-card .card-section .image-count button.minimal,
.performer-card .card-section .gallery-count span,
.performer-card .card-section .gallery-count button.minimal
{text-shadow: 2px 2px 1px #000, 1px 1px 1px #000, 4px 4px 5px #333, 9px 0px 5px #333, -3px 2px 4px #333, -7px 0px 5px #333, 
10px 2px 5px #000, 4px 14px 5px #333, 9px 0px 3px #333, -7px 2px 4px #333, -17px 0px 5px #333, -1px -9px 5px #333, 3px -8px 6px #444;
}

.performer-card .card-section .movie-count .svg-inline--fa.fa-w-16 {
	box-shadow: 1px 1px 1px rgba(0, 0, 0, .99), 1px 1px 3px rgba(0,0,0, .70), -5px 2px 5px rgba(0, 0, 0, .55);
}

/* --- Positioning of the 3 items ---*/
.performer-card .card-popovers .movie-count {left:0.2%;}
.performer-card .card-popovers .image-count {left:32.8%}
.performer-card .card-popovers .gallery-count {right:1.3%}

.performer-card .movie-count a.minimal:hover:not(:disabled), .performer-card .movie-count button.minimal:hover:not(:disabled),
.performer-card .image-count a.minimal:hover:not(:disabled), .performer-card .image-count button.minimal:hover:not(:disabled),
.performer-card .gallery-count a.minimal:hover:not(:disabled), .performer-card .gallery-count button.minimal:hover:not(:disabled)
{
	background-color:rgba(20,80,110,0.92);
    color:#fff;
}

/* --- Affects the Scenes- and Tags-Counter --- */
a.minimal:hover:not(:disabled), button.minimal:hover:not(:disabled) {background: rgba(138,155,168,.25);color:#fff;}
div.performer-card div.card-popovers
{
	margin-bottom:-3px;
	margin-left:1%;
	margin-top:-4px;
	margin-right: -3px;
	justify-content: flex-end;
	text-align:right;
}

div.card-section hr {display:none}


/* --- Changes the width of the Performer Card from 280px to a dynamic system and therefore the size of the image --- */
/* --- In Full screen HD 1920x1080 you now see 8 performers per row instead of 6 --- */
/*.performer-card-image, .performer-card, .card-image {  min-width: 160px; width: calc(108px + 10.625vw / 2); max-width: 230px }  */
/*.performer-card-image, .performer-card, .card-image {  min-width: 160px; width: calc(108px + 19vw / 3.6);width:212px; max-width: 230px } */
.performer-card-image, .performer-card, .card-image {  min-width: 160px; width: calc(100px + 11.2vw / 1.92);max-width: 230px } 


/* --- Changes the height of the Performer Card to keep the 2x3 picture ratio --- */
/*.performer-card-image, .justify-content-center .card-image { min-height:240px; height: calc((108px + 10.625vw / 2) * 1.5); max-height: 345px}  */
.performer-card-image, .justify-content-center .card-image { min-height:240px; height: calc((112px + 19vw / 3.6) * 1.5); max-height: 345px;} 
.performer-card-image, .justify-content-center .card-image { min-height:240px; height: calc((100px + 11.2vw / 1.92) * 1.5); max-height: 345px;} 

@media (max-width: 575px), (min-width: 1200px) {
.scene-performers .performer-card-image { height: auto; }
.scene-performers .performer-card { width: auto; }
}


/* --- Fixes an issue of the card when watching a scene --- */
.image-section { display: cover;}

/* --- The name of the Performer. Different font, less space to the left & to the top, Text-Shadow --- */
.text-truncate, .card.performer-card .TruncatedText {
	margin-left:-1.5%; 
	margin-top: -2px; 
	width: 120%; 
	font-family: var(--HeaderFont);
	font-size: 112%; 
	line-height:130%; 
	font-weight:bold; 
	text-shadow: var(--std-txt-shadow);
}

/* --- Makes the Performer Name smaller when the screen is too small --- */
@media (max-width: 1200px) { .card.performer-card .TruncatedText { font-size: 104%; } }



/* --- Moves the Flag icon from the right side of the card to the left and makes the Flag image a little bit bigger --- */
.performer-card .flag-icon {
    height: 2rem;
    left: 0.6rem;
    bottom: 0.10rem;
    width: 28px; 
}

/* --- Age and # of Scenes move from the left side to the right of the card --- */
.performer-card .text-muted {text-align:right;margin-top:-2px;margin-bottom:1px;width:44%;margin-left:56%}


/* --- Minimum height for the section in case Age and Nationality is missing and elements would overlap --- */
.performer-card .card-section {min-height:82px}

/* --- "removes" the term 'old.' from "xx years old." when the resolution gets to small --- */ 
@media (max-width: 1700px) {
div.card.performer-card .text-muted {text-align:right;margin-top:-2px;margin-bottom:1px;margin-right:-33px; height:20px; max-height:20px; overflow: hidden;
}
}

/* --- To prevent overlapping in the performer card when watching a scene --- */
@media (max-width: 2000px) {
.tab-content div.card.performer-card .text-muted {margin-top:22px;margin-right:-3px}
.tab-content .performer-card.card .rating-1, 
.tab-content .performer-card.card .rating-2, 
.tab-content .performer-card.card .rating-3, 
.tab-content .performer-card.card .rating-4, 
.tab-content .performer-card.card .rating-5 {bottom: 53px !important;}
}


/* --- Text Shadow for the "Stars in x scenes" link --- */
div.card.performer-card div.text-muted a {text-shadow: 1px 2px 2px #333}

/* --- Makes the card section (Name, Age, Flag, # of scenes) more compact --- */
.card-section { margin-bottom: -7px !important; padding: .5rem 0.7rem 0 !important;}
.card-section span {margin-bottom:3px}
@media (max-width: 1500px) {	.card-section span {font-size:13px}	}

div.card-section hr {display:none}




/* --- Changes regarding the Favorite <3 --- */
.performer-card .favorite {
    color: #f33;
    -webkit-filter: drop-shadow(2px 2px 3px rgba(0, 0, 0, .95));
	filter: drop-shadow(2px 2px 3px rgba(0, 0, 0, .95));
	right: 3px;
	top: 5px;
}



/* --- Turns the Rating Banner in the top left corner into a Star Rating under the performer name --- */
.performer-card.card .rating-1, .performer-card.card .rating-2, .performer-card.card .rating-3, 
.performer-card.card .rating-4, .performer-card.card .rating-5
{
	background:none;
	background-size: 97px 18px;
	background-image:var(--stars);
	-webkit-transform:rotate(0deg);
	transform:rotate(0deg);
	padding:0;
	padding-bottom:1px;
	box-shadow: 0px 0px 0px rgba(0, 0, 0, .00);
	left:6px;
	width:97px;
	height:18px;
	text-align:left;
	position:absolute;
	top:auto;
	bottom: 34px;
	font-size:0.001rem;
}

/* --- Display only X amount of stars  -- */
div.performer-card.card .rating-banner.rating-1 {width:20px}
div.performer-card.card .rating-banner.rating-2 {width:39px}
div.performer-card.card .rating-banner.rating-3 {width:59px} 
div.performer-card.card .rating-banner.rating-4 {width:78px}  
div.performer-card.card .rating-banner.rating-5 {width:97px}  


.performer-card .btn {padding: .375rem .013rem}
.performer-card .btn {padding: .34rem .25rem}
.performer-card .fa-icon {margin: 0 2px}
.performer-card .card-popovers .fa-icon {margin-right: 4px}
.performer-card .svg-inline--fa.fa-w-18, .performer-card .svg-inline--fa.fa-w-16 {height: 0.88em}
.performer-card .favorite .svg-inline--fa.fa-w-16 {height:1.5rem}


.performer-card .card-popovers .btn-primary {
    margin: 0 0px 0 6px;
}



/* --- PerformerTagger Changes --- */

.PerformerTagger-performer {
	background-image: linear-gradient(130deg, rgba(50, 60, 75,0.25), rgba(150, 155, 160,0.32), rgba(35, 40, 45,0.26), rgba(160, 160, 165,0.27), rgba(50, 60, 65,0.37)); 
	background-color: rgba(16, 20, 25, .23); 
	box-shadow: 2px 2px 6px rgba(0, 0, 0, .70);
	border-radius: 8px;
	margin: 1.1%;
  }
  
.tagger-container .input-group-text  {background:none;border:0;margin-right:5px;padding-left:0}
.PerformerTagger-details {	margin-left: 1.25rem; width:23.5rem;}

.tagger-container .btn-link{text-shadow: 1px 2px 3px #000;}
.tagger-container, .PerformerTagger {	max-width: 1850px;}

.PerformerTagger-header h2 {	
	font-family: Helvetica, "Helvetica Neue", "Segoe UI" !important; 
	font-size: 2rem; 
	line-height:130%; 
	font-weight:bold; 
	text-shadow: 2px 2px 1px #000 !important
}

.PerformerTagger-thumb {height: 50px;}

.modal-backdrop 	 {	background-color: rgba(16, 20, 25, .25);}
.modal-backdrop.show {	opacity: 0.1;	}

.performer-create-modal {	max-width: 1300px; font-family: Helvetica, "Helvetica Neue", "Segoe UI" !important; }
.performer-create-modal .image-selection .performer-image { height: 95%; }
.performer-create-modal .image-selection {height: 485px;}

.performer-create-modal .no-gutters .TruncatedText {
	font-family: var(--HeaderFont);
	font-size: 115%;
	padding-top:2px;
	line-height:120%; 
	font-weight:bold; 
	text-shadow: var(--std-txt-shadow);
}
.performer-create-modal-field strong {margin-left: 6px}
.modal-footer {border-top: 0}






/* ========================= Performer Page ================================= */
/* === The page that you see when you click on the picture of a Performer === */

/* --- The picture of the Performer on the left. 3D effect thanks to background shadows and more rounded corners --- */
#performer-page .performer-image-container .performer 
{
    background-color: rgba(0, 0, 0, .48);
    box-shadow: 6px 6px 11px rgba(0, 10, 10, .62);
    border-radius: 14px !important;
}

/* --- Without this the shadow at the bottom from the previous Selector will not be correctly displayed --- */
.performer-image-container {padding-bottom: 11px}


/* --- The following 15 Selectors change the way the details box is displayed --- */
#performer-details-tabpane-details .text-input, #performer-details-tabpane-details .text-input:disabled, 
#performer-details-tabpane-details .text-input[readonly] {background-color: rgba(16,22,26,0.0);}
#performer-details-tabpane-details a { text-shadow: var(--light-txt-shadow)}

.text-input, input.form-control-plaintext { background-color:none;}
#performer-details .input-control, .text-input {box-shadow: none;}

div.react-select__control, #performer-details-tabpane-details {background-color: rgba(15,20,30,0.26); max-width:1000px}
#performer-details-tabpane-details {border-radius: 10px}
#performer-details-tabpane-edit {max-width:1000px}

div.react-select__control .css-12jo7m5 {text-shadow: none; }

@media (min-width: 1200px) {
	#performer-details-tabpane-details td { padding: 9px; }
	table#performer-details tbody tr td:nth-child(1), td:first-child {padding-left: 22px; width: 185px;}
}
@media (max-width: 1200px) {
	table#performer-details tbody tr td:nth-child(1), td:first-child {padding-left: 11px; }
	#performer-page .performer-head {    margin-bottom: 1rem; }
	#performer-page { margin: 0 -6px 0 -15px; }
}
#performer-details-tabpane-details tr:nth-child(odd) {     background-color: rgba(16,22,26,0.1); }
table#performer-details {color:#FFF; text-shadow: 1px 1px 1px #000;}



/* --- Changes the way the name of the performer is displayed --- */
.performer-head h2 {font-family: var(--HeaderFont); font-weight:bold; text-shadow: 2px 2px 2px #111 }

/* --- Leave some space between the name and the Fav/Link/Twitter/IG icons --- */
#performer-page .performer-head .name-icons {margin-left: 22px}

/* --- Highlighter for active Details/Scenes/Images/Edit/Operations --- */
.nav-tabs .nav-item.show .nav-link, .nav-tabs .nav-link.active {
	background-color: rgba(5,30,35,0.46);
}


/* --- Changes the display of Performer Details Tab in the 0.9 version are arranged --- */
#performer-details-tabpane-details dl.row, dl.details-list dt, dl.details-list dd{ margin:0 0px;padding: 8px 10px 9px 14px}
#performer-details-tabpane-details dl.row:nth-child(odd),
#performer-details-tabpane-details dl.details-list dt:nth-of-type(odd),
#performer-details-tabpane-details dl.details-list dd:nth-of-type(odd) {	background-color: rgba(16,22,26,0.1);}
#performer-details-tabpane-details dt.col-xl-2,
#performer-details-tabpane-details dl.details-list dt {	text-shadow: var(--std-txt-shadow); font-weight: normal;}
#performer-details-tabpane-details ul.pl-0 {margin-bottom: 0rem;}
#performer-details-tabpane-details dl.details-list { grid-column-gap: 0}


/* --- Resets the fields in Performer Edit Tab in the 0.5 developmental version back to way it was in the 0.5 version --- */
#performer-edit {margin:0 0 0 10px}
#performer-edit .col-sm-auto, #performer-edit .col-sm-6, #performer-edit .col-md-auto, #performer-edit .col-lg-6, #performer-edit .col-sm-4, #performer-edit .col-sm-8 { width: 100%;max-width: 100%; flex: 0 0 100%; }
#performer-edit .col-sm-auto div, #performer-edit label.form-label { float:left; width:17%;}
#performer-edit .col-sm-auto div, #performer-edit label.form-label { font-weight:normal; color: #FFF; text-shadow: var(--std-txt-shadow); }

#performer-edit select.form-control, #performer-edit .input-group, #performer-edit .text-input.form-control { float:right; width:83%; }
#performer-edit .form-group, .col-12 button.mr-2 {margin-bottom: 0.35rem}
#performer-edit .mt-3 label.form-label { float:none; width:auto; }

#performer-edit select.form-control, #performer-edit .input-group, #performer-edit .text-input.form-control {width: 100%;}
#performer-edit textarea.text-input {min-height: 9ex;}

#performer-edit .form-group:nth-child(17) .text-input.form-control {width:85%;}

@media (max-width: 750px) {
#performer-edit .col-sm-auto div, #performer-edit label.form-label { float:left; width:22%;}
#performer-edit select.form-control, #performer-edit .input-group, #performer-edit .text-input.form-control { float:right; width:78%; }
}

@media (max-width: 500px) {
#performer-edit .col-sm-auto div, #performer-edit label.form-label { float:left; width:60%;}
#performer-edit li.mb-1, 
#performer-edit select.form-control, 
#performer-edit .input-group, #performer-edit .text-input.form-control { float:left; width:89%; }
}

#performer-edit .form-group .mr-2 {margin-right:0!important}






/* ======================= Scenes ======================== */


/* --- Remove the comments if you don't want to see the Description Text of the scenes --- */
/* .card-section p {display:none} */


/* --- Remove the comments if you don't want to see the Resolution of the Video (480p, 540p, 720p, 1080p) --- */
 .overlay-resolution {display:none} 



/* --- The name of the Scene. Different font, less space to the left and to the top, Text-Shadow --- */
h5.card-section-title, .scene-tabs .scene-header {	
	font-family: var(--HeaderFont);
	font-size: 1.25rem;
	font-weight:bold;
	line-height:132%;
	text-shadow: var(--std-txt-shadow);
}
.scene-tabs .scene-header { font-size: 24px; margin-bottom:16px }
.scene-tabs .studio-logo {	margin-top: 0}

#TruncatedText .tooltip-inner {width:365px; max-width:365px}
.tooltip-inner {	font-family: var(--HeaderFont);
	background-color: rgba(16, 20, 25, .99); 
	box-shadow: 2px 2px 6px rgba(0, 0, 0, .55);
 font-weight:bold;font-size:14px;}

/* --- Removes the horizontal line that separates the date/description text from the Tags/Performer/etc. icons --- */
.scene-card.card hr, .scene-card.card>hr{	border-top: 0px solid rgba(0,0,0,.1);	}


/* --- Changes regarding the Scene Logo --- */
.scene-studio-overlay {
	opacity: .80;
	top: -1px;
	right: 2px;
}

/* --- The Resolution and the Time/Length of the video in the bottom right corner to make it easier to read --- */
.scene-specs-overlay {
	font-family: Arial, Verdana,"Segoe UI" !important;
	bottom:1px;
	color: #FFF;
	font-weight: bold;
	bottom:1.4%;
	letter-spacing: 0.035rem;
	text-shadow: 2px 2px 1px #000, 4px 4px 5px #444, 7px 0px 5px #444, -3px 2px 5px #444, -5px 0px 5px #444, -1px -4px 5px #444, 3px -2px 6px #444;
}
.overlay-resolution {color:#eee;}

/* --- Changes the spaces between the items on the Scenes page --- */
.zoom-0 {margin: 4px 0.50% 10px}


.scene-card-link {height:195px; overflow:hidden;}


/* --- Tightens the space between the Tags-, Performer-, O-Counter-, Gallery- and Movie-Icons --- */
.btn-primary { margin:0 -3px 0 -9px}

/* --- Moves the Tags-, Performer-, O-Counter-, Gallery- and Movie-Icon from below the description to the bottom right corner of the card --- */
.scene-popovers, .card-popovers { 
	min-width:0;
	margin-bottom: 3px;
	margin-top:-40px;
	justify-content: flex-end;
}

/* --- Adds an invisible dot after the description text, Also leaves ~80 pixels space to enforce a line break, 
so it leaves some space in the bottom right corner of the card for the icons in the Selector above --- */
.card-section p:after 
{
	font-size: 1px;
	color: rgba(0,0,0, .01);
	padding-right: 3.2vw; 
	margin-right: 2.8vw; 
	content: " ";
}




/* -- The whole section replaces the ratings banner with a star rating in the bottom left corner --- */ 
.scene-card.card .rating-1 {width:22px}
.scene-card.card .rating-2 {width:43px}
.scene-card.card .rating-3 {width:65px} 
.scene-card.card .rating-4 {width:86px}  
.scene-card.card .rating-5 {background:none; width:108px}
.rating-1, .rating-2, .rating-3, .rating-4, .scene-card.card .rating-5 {
	background:none;
	background-image:var(--stars);
	height:20px;
	background-size: 108px 20px;
} 

.scene-card.card .rating-banner {
	padding:0;
	left:5px;
	top:89%;
	background-position: left;
	font-size: .01rem;
	-webkit-transform: rotate(0deg);
	transform: rotate(0deg);
}


.scene-card.zoom-0.grid-card.card .rating-banner {top: 87%}
.scene-card.zoom-2.grid-card.card .rating-banner {top: 90%}
.scene-card.zoom-3.grid-card.card .rating-banner {top: 92%}

.scene-card.zoom-3.grid-card.card .rating-1, .scene-card.zoom-3.grid-card.card .rating-2, .scene-card.zoom-3.grid-card.card .rating-3, .scene-card.zoom-3.grid-card.card .rating-4, .scene-card.zoom-3.grid-card.card .rating-5 {
	background:none;
	background-image:var(--stars);
	height:28px;
	background-size: 151px 28px;
} 

.scene-card.zoom-3.grid-card.card .rating-1 {width:30px}
.scene-card.zoom-3.grid-card.card .rating-2 {width:60px}
.scene-card.zoom-3.grid-card.card .rating-3 {width:91px} 
.scene-card.zoom-3.grid-card.card .rating-4 {width:121px}  
.scene-card.zoom-3.grid-card.card .rating-5 {width:151px}



/* --- Improves how the Preview Videos in the Wall View are displayed --- */
.wall-item-container {width: 100%; background-color: rgba(0, 0, 0, .10); overflow:hidden }
.wall-item-media { height:100%; background-color: rgba(0, 0, 0, .0);overflow:hidden }
.wall-item-anchor { width: 102%; overflow:hidden }
.wall-item-text {margin-bottom:0px; color: #111; text-shadow: 1px 1px 1px #fff }	


.scene-popovers .fa-icon {margin-right: 2px;}

/* --- Changes the Organized Button color when watching a video. Organized = Green, Not Organized = Red --- */
.organized-button.not-organized { color: rgba(207,10,20,.8); }
.organized-button.organized {	color: #06e62e;}


/* --- Changes the font in the File Info section --- */
div.scene-file-info .TruncatedText, div.scene-file-info .text-truncate {
	margin-left:-1.5%; 
	margin-top: -1px; 
	width: 120%; 
	font-family: var(--HeaderFont);
	font-size: 110%; 
	line-height:120%; 
	font-weight:bold; 
	text-shadow: var(--std-txt-shadow);
}


#scene-edit-details .pl-0 {
    padding-left: 10px!important;
}


/* Zoom 0 */
.zoom-0 { width:290px}
.zoom-0 .video-section {height:181px;}
.zoom-0 .scene-card-preview-image, .zoom-0 .scene-card-preview { height:195px; }
.zoom-0 .scene-card-preview, .zoom-0 .scene-card-preview-video, .zoom-0 .scene-card-video {
	width: 290px;
	min-height:181px;
	max-height: 200px;
}

/* Zoom 1 */
.zoom-1 { min-width: 300px; width: calc(234px + 24vw /3.84);max-width: 430px}
/* Improves the way the scene picture is displayed when the resolution isn't 16:9 (e.g. 4:3) --- */
.zoom-1 .video-section {height:calc((234px + 24vw / 3.84)/1.63);max-height: 258px}
.zoom-1 .scene-card-preview-image, .zoom-1 .scene-card-preview { height:98%; max-height: 260px}

.zoom-1 .scene-card-preview, .zoom-1 .scene-card-preview-video, .zoom-1 .scene-card-video {
	min-width: 300px; width: calc(228px + 17vw / 1.92);max-width: 470px;
	height:calc((234px + 26vw / 3.84)/1.63);
	max-height: 265px;
}

/* Zoom 2 */
.zoom-2 { min-width: 350px; width: calc(315px + 26vw / 3.84);max-width: 495px}
.zoom-2 .video-section {height:calc((334px + 26vw / 3.84) /1.63);max-height:295px}
.zoom-2 .scene-card-preview-image, .zoom-2 .scene-card-preview { height:calc((334px + 26vw / 3.84) /1.63); max-height:292px}

.zoom-2 .scene-card-preview, .zoom-2 .scene-card-preview-video, .zoom-2 .scene-card-video {
	min-width: 350px; width: calc(332px + 28vw / 3.84);max-width: 530px;
	height:calc((335px + 28vw / 3.84) /1.63);
	max-height: 298px;
}


/* Zoom 3 */
.zoom-3 { min-width: 400px; width: calc(530px + 18vw / 5.76);max-width: 590px}
.zoom-3 .video-section {height:375px;}
.zoom-3 .scene-card-preview-image, .zoom-3 .scene-card-preview { height:395px; }
.zoom-3 .scene-card-preview, .zoom-3 .scene-card-preview-video, .zoom-3 .scene-card-video {
	width: 600px;
	min-height:385px;
	max-height: 400px;
}


.zoom-0 .video-section, .zoom-1 .video-section, .zoom-2 .video-section, .zoom-3 .video-section 
{object-fit: cover !important;overflow:hidden;}

.zoom-0 .scene-card-preview, .zoom-0 .scene-card-preview-video, .zoom-0 .scene-card-video,
.zoom-1 .scene-card-preview, .zoom-1 .scene-card-preview-video, .zoom-1 .scene-card-video, 
.zoom-2 .scene-card-preview, .zoom-2 .scene-card-preview-video, .zoom-2 .scene-card-video,
.zoom-3 .scene-card-preview, .zoom-3 .scene-card-preview-video, .zoom-3 .scene-card-video {
	object-fit: cover !important;
	margin-top:-2%;
	margin-left:-6px;
	transform: scale(1.04);
}

/* --- Shrink the Player Height just a little bit to avoid the scroll bar --- */
#jwplayer-container {    height: calc(99.5vh - 4rem);}
.scene-tabs {	max-height: calc(99vh - 4rem); }

div.tagger-container .btn-link { 	
	font-family: var(--HeaderFont);
	font-size: 110%; 
	color: #ddf; 
	text-shadow: var(--std-txt-shadow); 
}


/* --- Changes the color of the scrape button when editing a scene --- */
.scrape-url-button{background-color: rgba(20,120,20,.50);}
.scrape-url-button:hover{background-color: rgba(20,150,20,.65);}
.scrape-url-button:disabled {  background-color: rgba(30,00,00,.40);	}


.scene-tabs .scene-header {margin-top: 0;margin-bottom: 15px}
.scene-tabs h1.text-center {margin-bottom: 30px}

#queue-viewer .current {background-color: rgba(25,60,40,0.40);}
#queue-viewer .mb-2:hover, #queue-viewer .my-2:hover {background-color: rgba(15,20,30,0.28);}

#scene-edit-details .edit-buttons-container {
	background-color: rgba(0,0,0,0.0);
	position: relative; 
	margin-bottom:15px;
}

#scene-edit-details .form-group {margin-bottom:0.65rem;}





/* ============== Studio ================= */


.studio-card {	padding: 0 4px 14px;}

.studio-details input.form-control-plaintext {	background-color: rgba(16,22,26,.0); }
.studio-details .react-select__control--is-disabled  {	background: none; border:0}

.studio-details .form-group, .studio-details td { padding: 8px; }
.studio-details table td:nth-child(1) {color:#FFF; text-shadow: 1px 1px 1px #000;}

.studio-card-image {max-height: 175px; height:175px}
.studio-card-image {min-width: 260px; width: calc(244px + 19vw / 3.8); max-width: 360px; margin: 0 1px;}
.studio-card .card-section {	margin-top: 22px;}

@media (min-width: 1200px) {
.pl-xl-5, .px-xl-5 {
    padding-left: 1rem!important; 
    padding-right: 1rem!important;
} }

.no-gutters .TruncatedText, .tag-card .TruncatedText, div.card.studio-card .TruncatedText, .tagger-container .TruncatedText  {
	font-family: var(--HeaderFont);
	font-size: 125%; 
	line-height:125%; 
	font-weight:bold; 
	text-shadow: var(--std-txt-shadow);
}

.no-gutters .TruncatedText {font-size: 115%;}

/* --- The following 15 Selectors modify the info box on the left after clicking on a movie --- */
.studio-details .text-input, #performer-details-tabpane-details .text-input:disabled, 
.studio-details .text-input[readonly] {background-color: rgba(16,22,26,0.0);}

.text-input, input.form-control-plaintext { background-color:none;}
.studio-details .input-control, .text-input {box-shadow: none;}

.studio-details table { margin-top: 20px; background-color: rgba(15,20,30,0.20); border-radius: 10px; margin-bottom:20px;}
.studio-details .form-group {background-color: rgba(15,20,30,0.20); margin:0;}

.studio-details table div.react-select__control {background: none; border: 0px;margin:0}
.studio-details table .css-1hwfws3 { padding:0px; }

.studio-details .form-group, .movie-details td { padding: 8px; }
.studio-details .form-group td:nth-child(1), 
.studio-details table tbody tr td:nth-child(1), td:first-child {padding-left: 12px; width: 130px;}

.studio-details table tr:nth-child(odd) {     background-color: rgba(16,22,26,0.1); }
.studio-details .form-group, .studio-details table td:nth-child(1) {color:#FFF; text-shadow: 1px 1px 1px #000;}


.studio-card.card .rating-1, .studio-card.card .rating-2, .studio-card.card .rating-3, 
.studio-card.card .rating-4, .studio-card.card .rating-5
{
	background:none;
	height: 25px;
	background-size: 135px 25px;
	background-image:var(--stars);
	-webkit-transform:rotate(0deg);
	transform:rotate(0deg);
	padding:0;
	padding-bottom:1px;
	box-shadow: 0px 0px 0px rgba(0, 0, 0, .00);
	left:10px;
	text-align:left;
	position:absolute;
	top:auto;
	bottom: 24% !important;
	font-size:0.001rem;
}

.studio-card.card .rating-5{width:135px;} 
.studio-card.card .rating-4{width:109px;} 
.studio-card.card .rating-3{width:81px;} 
.studio-card.card .rating-2{width:55px;} 
.studio-card.card .rating-1{width:28px;} 

div.studio-card.card .card-popovers { margin-top:-34px;margin-right:-7px}
.studio-card.card .card-section div:nth-child(2) {margin-bottom:6px;margin-top:-3px;}

div.studio-details dl.details-list {grid-column-gap:0}
.studio-details dt, .studio-details dd {padding: 6px 0 8px 8px}







/* ============== TAGS =============== */

.tag-card.card hr, .tag-card.card>hr{border-top: 0px solid rgba(0,0,0,0.0)}

.tag-card {margin: 4px 0.5% 10px; padding:0px;}


@media (min-width: 1200px){
.row.pl-xl-5, .row.px-xl-5 {
	padding-left: 0.2rem!important; 
	padding-right: 0.2rem!important;
}
}

.tag-card.zoom-0 {
	min-width: 230px; width: calc(205px + 18vw / 1.1); max-width: 354px;
	min-height:168px; height:auto;
/*	height:calc(130px + 14vw / 1.1); max-height:250px;*/
}
.tag-card.zoom-0 .tag-card-image {	min-height: 100px; max-height: 210px; height: calc(95px + 15vw / 1.1)}

.tag-card.zoom-1 {
	min-width: 260px; width: calc(238px + 25vw / 2.3); max-width: 460px;
	min-height:193px; height:auto; max-height:335px;
}
.tag-card.zoom-1 .tag-card-image {	min-height: 120px; max-height: 260px; height: calc(100px + 19vw / 2.3);}

.tag-card.zoom-2 {
	min-width: 290px; width: calc(280px + 38vw / 2.45); max-width: 650px;
	min-height:170px; height:auto; max-height:505px;
}
.tag-card.zoom-2 .tag-card-image {	min-height: 175px; max-height: 435px; height: calc(120px + 26vw / 2.45);}

#tags .card {padding:0 0 10px 0; }
.tag-card-header {height:190px;overflow:hidden;}

.zoom-0 .tab-pane .card-image { height:210px }
.zoom-0 .tag-card-image, .zoom-1 .tag-card-image, .zoom-2 .tag-card-image {
zoom: 101%;
object-fit: cover;
overflow:hidden;
width: 101%;
margin-top: -2px;
margin-left: -1%;
}

.tag-card .scene-popovers, .tag-card .card-popovers { 
	width:60%;
	margin-left:40%;
	justify-content: flex-end;
	float:right;
	margin-bottom: 15px;
	margin-top:-34px;
	padding-left:17px;
}

.tag-sub-tags,.tag-parent-tags {margin-bottom:8px}


/* --- Moves the Tag name into the Tag Picture --- */
.tag-details .text-input[readonly] {background-color: rgba(0,0,0,.0)}
.tag-details .table td:first-child {display:none}
.tag-details .logo {margin-bottom: 12px;}

.tag-details .form-control-plaintext, .tag-details h2 {
	margin-top:-76px;
	margin-left:0%;
	font-weight: bold;
	font-family: Helvetica, "Helvetica Neue", "Segoe UI" !important;
	letter-spacing: 0.11rem;
	font-size:44px;
	text-shadow: 2px 2px 3px #111, 4px 4px 4px #282828, 6px 1px 4px #282828, -3px 3px 3px #444, -2px -2px 4px #282828;
	text-align:center; 
}
@media (max-width: 1300px) {.tag-details .form-control-plaintext {font-size:26px; 	margin-top:-50px;}}

.tag-details .logo { min-width:300px}





/* ==============  MOVIES ==============  */

/* --- Changes the width of the items so only the front cover is displayed. Also replaces the ratings banner with a star rating --- */

.movie-card .text-truncate, div.card.movie-card .TruncatedText {
	font-size: 17px !important;
	font-family: var(--HeaderFont);
	text-shadow: var(--std-txt-shadow);
	font-weight: bold;
	max-width:210px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

div.movie-card.grid-card.card .card-section p {margin-bottom:-8px}
div.movie-card.grid-card.card .card-section {margin-bottom: -0px !important}
div.movie-card.grid-card.card .card-popovers {
	padding-top:35px;
	margin-bottom:-11px;
	width:60%;
	margin-left:40%;
	justify-content:flex-end;
	float:right;
}

div.movie-card .card-section span {position:absolute;margin-top:-3px;margin-bottom:6px}



.movie-card-header {height:320px}

.movie-card-header .rating-banner {
	font-size: .001rem;
	padding: 8px 41px 6px;
	line-height: 1.1rem;
	transform: rotate(0deg);
	left: 3px;
	top: 317px !important;
	height: 25px;
	background-size: 135px 25px;
	background-position: left;
}

.movie-card-header .rating-1 {width:28px}
.movie-card-header .rating-2 {width:55px}
.movie-card-header .rating-3 {width:83px}
.movie-card-header .rating-4 {width:110px}
.movie-card-header .rating-5 {width:138px}

.movie-card-header .rating-5 {
	background:none;
	background-image:var(--stars);
	height: 25px;
	background-size: 135px 25px;
}

.movie-card-image {
	height:345px;
	max-height: 345px;
	width:240px;
}




/* --- The following 15 Selectors modify the info box on the left after clicking on a movie --- */
.movie-details .text-input, #performer-details-tabpane-details .text-input:disabled, 
.movie-details .text-input[readonly] {background-color: rgba(16,22,26,0.0);}

.text-input, input.form-control-plaintext { background-color:none;}
.movie-details .input-control, .text-input {box-shadow: none;}

.movie-details table { margin-top: 20px; background-color: rgba(15,20,30,0.20); border-radius: 10px 10px 0px 0px; margin-bottom:0;}
.movie-details .form-group {background-color: rgba(15,20,30,0.20); margin:0;}

.movie-details table div.react-select__control {background: none; border: 0px;margin:0}
.movie-details table .css-1hwfws3 { padding:0px; }

.movie-details .form-group, .movie-details td { padding: 8px; }
.movie-details .form-group td:nth-child(1), 
.movie-details table tbody tr td:nth-child(1), td:first-child {padding-left: 12px; width: 120px;}

.movie-details table tr:nth-child(odd) {     background-color: rgba(16,22,26,0.1); }
.movie-details .form-group, .movie-details table td:nth-child(1) {color:#FFF; text-shadow: 1px 1px 1px #000;}



/* --- 0.60 dev adjustments --- */
.studio-details .studio-details, .movie-details .movie-details {background-color: rgba(15,20,30,0.20); border-radius: 10px; margin-bottom:15px; }
.movie-details .movie-details dt.col-3 {padding:4px 0 4px 16px; width: 120px;}
.movie-details .movie-details dd.col-9 {padding:4px 16px 4px 3px;}
.studio-details dl.details-list dt:nth-of-type(odd),
.studio-details dl.details-list dd:nth-of-type(odd),
.movie-details dl.details-list dt:nth-of-type(odd),
.movie-details dl.details-list dd:nth-of-type(odd),
.movie-details dl.row:nth-child(odd) { background-color: rgba(16,22,26,0.1); margin-right:0px}
.movie-details dl.details-list { grid-column-gap: 0}
.studio-details h2, .movie-details .movie-details h2 {	font-family: var(--HeaderFont);font-weight:bold;text-shadow: var(--std-txt-shadow);padding:7px 0 5px 12px;}

.movie-details .movie-images {margin:0 5px 20px 5px;}
.movie-details .movie-images img {border-radius: 14px; max-height:580px;}
.movie-details .movie-image-container{
	margin:0.3rem;
	margin-right:0.8rem;
	background-color: rgba(0, 0, 0, .48);
	box-shadow: 6px 6px 11px rgba(0, 10, 10, .62);
}

form#movie-edit { margin-bottom:15px}





/* ==============  IMAGES ==============  */

div.image-card .rating-banner {
	font-size: .002rem;
	padding: 8px 41px 6px;
	line-height: 1.1rem;
	transform: rotate(0deg);
	left: 3px;
	top: 72% !important;
	height: 25px;
	background-size: 135px 25px;
	background-position: left;
}

div.image-card .rating-1 {width:28px}
div.image-card .rating-2 {width:55px}
div.image-card .rating-3 {width:83px} 
div.image-card .rating-4 {width:110px}  
div.image-card .rating-5 {width:138px}

div.image-card .rating-5 {
	background:none;
	background-image:var(--stars);
	height: 25px;
	background-size: 135px 25px;
}

div.image-card .scene-popovers, div.image-card .card-popovers {
	margin-top: -2px;
	justify-content: flex-end;
}
div.image-card hr, .scene-card.card>hr{
	border-top: 0px solid rgba(0,0,0,.1);
}







/* ==============  GALLERIES ==============  */

div.gallery-card hr, .scene-card.card>hr{
	border-top: 0px solid rgba(0,0,0,.1); 
}

div.gallery-card .rating-banner {
	font-size: .002rem;
	padding: 8px 4px 6px;
	line-height: 1.1rem;
	transform: rotate(0deg);
	left: 3px;
	top: 70% !important;
	height: 25px;
	background-size: 135px 25px;
	background-position: left;
}

div.gallery-card .rating-1 {width:28px !important}
div.gallery-card .rating-2 {width:55px !important}
div.gallery-card .rating-3 {width:83px !important} 
div.gallery-card .rating-4 {width:110px}  
div.gallery-card .rating-5 {width:137px}

div.gallery-card .rating-5 {
	background:none;
	background-image:var(--stars);
	height: 25px;
	background-size: 135px 25px;
}

div.gallery-card .scene-popovers, div.gallery-card .card-popovers {
	margin-bottom: -8px;
	margin-top: -48px; 
	justify-content: flex-end;
}








/* ==============  MISC ==============  */

/* --- When comments are removed the first paginationIndex ("1-x of XXX - time - size") will disappear --- */
/* .paginationIndex:first-of-type {display:none} */


.svg-inline--fa.fa-w-18 {width: 1.4em;}

/* --- Makes the Zoom Slider on the Scenes, Images, Galleries and Tags pages longer and therefore easier to use --- */
input[type=range].zoom-slider{ max-width:140px;width:140px; }

/* --- Changes the zoom slider color --- */
input[type=range]::-webkit-slider-runnable-track {background-color: #88afcc !important;}


.tag-details .logo {
    background-color: rgba(0, 0, 0, .48);
    box-shadow: 3px 3px 5px rgba(0, 0, 0, .42);
    border-radius: 9px !important;
}

.search-item {
    background-color: none;
    background-color: rgba(16,22,26,0.27);
}

.btn-secondary.disabled, .btn-secondary:disabled {
    background-color: none;
    background-color: rgba(16,22,26,0.67);
}

/* --- Edit & Delete buttons when clicking on a studio, tag or movie --- */
.details-edit {margin-left:3%}

/* --- Adds a text shadow to the statistics on the startpage --- */
.stats .title {
	text-shadow: 2px 2px 4px #282828;
}


.popover {
	padding:2px;
	background-color: rgba(5,30,35,0.85); 
	box-shadow: 3px 3px 6px rgba(20, 20, 20, .8);
}
.hover-popover-content {
	background-image: linear-gradient(160deg, rgba(230,255,240,0.80), rgba(120,130,155, 0.45), rgba(180,190,225, 0.45), rgba(120,130,165, 0.55), rgba(255,235,235,0.70)); 
	background-color: rgba(205,210,225,0.31) !important; 
}

.tag-item {
	font: normal 13px "Lucida Grande", sans-serif, Arial, Verdana;
	background-image: linear-gradient(210deg, rgba(30,95,140,0.36), rgba(10,60,95, 0.45), rgba(20,65,105, 0.88), rgba(5,90,140,0.35)); 
	background-color: rgba(20,80,110,0.9); 
	color: #fff;
	letter-spacing: 0.07rem;
	line-height: 18px;
	margin: 3px 3px;
	padding: 6px 8px;
}

/* --- Adjust the lengths of the Performer, Movies and Tags fields while editing a scene while the scene plays --- */
#scene-edit-details .col-sm-9 {
    flex: 0 0 100%;
    max-width: 100%;
}

/* --- Cuts the name of Performers, Movies and Tags short if they go longer than the length of the field --- */
div.react-select__control .react-select__multi-value {
  max-width: 285px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}




.input-control, .input-control:disabled, .input-control:focus, .modal-body div.react-select__control, .modal-body .form-control {
	background: rgba(15,15,20,0.36);
}


.scraper-table tr:nth-child(2n) {    background: rgba(15,15,20,0.18);}

.nav-pills .nav-link.active, .nav-pills .show>.nav-link { 	background: rgba(15,15,20,0.50);}


.btn-secondary:not(:disabled):not(.disabled).active, 
.btn-secondary:not(:disabled):not(.disabled):active, 
.show>.btn-secondary.dropdown-toggle { 	background: rgba(15,15,20,0.50);}


/* --- Background when searching for a scene in Tagger view --- */
.search-result { 	background: rgba(0,0,0,0.22);}
.selected-result { 	background: rgba(25,120,25,0.28);}
.search-result:hover { background: rgba(12,62,75,0.35);}


.markdown table tr:nth-child(2n) {background: rgba(25,20,25,0.20);}
.markdown code, .markdown blockquote, .markdown pre {background: rgba(25,20,25,0.30);}


/* --- Changes the size of the Custom CSS field in the settings --- */
#configuration-tabs-tabpane-interface textarea.text-input { min-width:60ex; max-width:55vw !important; min-height:50ex;}


div.dropdown-menu,div.react-select__menu{background-color:rgba(35,37,44,0.55);color:#f5f8fa}

div.dropdown-menu .dropdown-item, div.dropdown-menu .react-select__option, div.react-select__menu .dropdown-item, div.react-select__menu .react-select__option
{color:#f5f8fa;background-color:rgba(35,37,44,0.55);}

div.dropdown-menu .dropdown-item:focus,div.dropdown-menu .dropdown-item:hover,div.dropdown-menu .react-select__option--is-focused,div.react-select__menu .dropdown-item:focus,div.react-select__menu .dropdown-item:hover,div.react-select__menu .react-select__option--is-focused{background-color:rgba(24,130,195,0.85)}


.toast-container {
    left: 74%;
    top: 1rem;
}

/* --- Settings / About adjustments --- */
#configuration-tabs-tabpane-about .table {width:100%}
#configuration-tabs-tabpane-about .table td {padding-top:18px}



/* Folder when doing selective scan or configuration */
.input-group .form-control {color: #c9e0e7; }



/* --- Overhaul of the Popoup Edit Boxes --- */
@media (min-width: 576px) {
	#setting-dialog .modal-content .modal-body textarea {min-height:350px; height:75vh !important}
	.modal-dialog {max-width: 880px}
	.modal-dialog .modal-content .form-group .multi-set {width:82%;margin-top:12px; flex: 0 0 82%; max-width:82%;}
	.modal-dialog .modal-content .form-group .col-9 {flex: 0 0 82%;max-width: 82%;}
	.modal-dialog .modal-content .col-3 {    flex: 0 0 18%; max-width: 18%;}
	.modal-dialog .modal-content .form-group > .form-label {margin-top:0px;flex: 0 0 18%;    max-width: 18%;text-shadow: var(--std-txt-shadow);}
	.modal-dialog .modal-content .form-group {display: flex; flex-wrap: wrap;}
	.modal-dialog .modal-content .btn-group>.btn:not(:first-child), .btn-group>.btn-group:not(:first-child) {margin-left: 2px}
	.modal-dialog .modal-content .form-label[for~="movies"],
	.modal-dialog .modal-content .form-label[for~="tags"],
	.modal-dialog .modal-content .form-label[for~="performers"] {margin-top:48px;}
	.modal-dialog .modal-content .button-group-above {margin-left:9px}
	.modal-dialog .scraper-sources.form-group h5 {margin-top:20px}
	.modal-dialog .modal-content .field-options-table {width:98%}

	.modal-dialog.modal-lg .modal-content .form-group {display: inline;}
}


div.modal-body b, .form-label h6 {text-shadow: var(--std-txt-shadow);}

.modal-body .btn-primary:not(:disabled):not(.disabled).active, .modal-body .btn-primary:not(:disabled):not(.disabled):active {
color: #fff; 
     background-color: #008558; 
     border-color: #0d5683;
}

.modal-body .btn-primary {
    color: #fff;
    background-color: #666;
    border-color: #666;
}


/* --- several Performer and Scene Scaping changes --- */
.modal-content, .modal-lg, .modal-xl  {
	max-width: 1400px; 
	width:100%;
} 

.modal-header, .modal-body, .modal-footer {	background: rgba(50,90,105,0.96);}
.modal-body {padding-bottom:2rem;}
.performer-create-modal {max-width:1300px;}

.modal-body .col-form-label, .modal-body .col-6, .modal-footer, .modal-header .col-form-label {text-shadow: var(--std-txt-shadow);}

.modal-body .col-6 strong {font-weight: normal; font-size:14px}
.modal-body .no-gutters {margin-bottom: 8px}

.modal-body .dialog-container .col-lg-3 {
	flex: 0 0 12%;
	max-width: 12%;
	text-shadow: var(--std-txt-shadow);
}

.modal-body .dialog-container .offset-lg-3{margin-left:12%;} 
.modal-body .dialog-container .col-lg-9{flex:0 0 88%; max-width:88%;} 





.input-group-prepend div.dropdown-menu
{
	background: rgba(50,90,105,0.94);
	padding:15px;
	box-shadow: 2px 2px 6px rgba(0, 0, 0, .70);
}

.saved-filter-list .dropdown-item-container .dropdown-item {
    margin-top:3px;
}
.set-as-default-button {margin-top: 8px;}

.grid-card .card-check { top:.9rem;width: 1.5rem;}

.btn-group>.btn-group:not(:last-child)>.btn, .btn-group>.btn:not(:last-child):not(.dropdown-toggle)
  {border-left: 1px solid #394b59;}    
.btn-group>.btn-group:not(:first-child), .btn-group>.btn:not(:first-child) {border-right: 1px solid #394b59;}


div.gallery-card.grid-card.card p div.TruncatedText,
div.movie-card.grid-card.card hr, div.movie-card.grid-card.card p {display:none}



/* --- Spacing out the paginationIndex --- */
.paginationIndex {color:#f3f3f3;margin-bottom:8px}
.paginationIndex .scenes-stats, .images-stats {margin-top:-3px; color:#9999a9}
.paginationIndex .scenes-stats:before, .images-stats:before
{
	font-size: 16px;
	margin-left:18px;
	margin-right:12px;
	color:#ccc;
	content: "-";
}









/* ==============  SETTINGS ==============  */

#settings-container {
	padding-left:230px;
	background-image: none !important;
	background-color: rgba(16, 20, 25, .40) !important;
	box-shadow: 2px 2px 7px rgb(0 0 0 / 75%);
	border-radius: 10px;
	padding-top:25px;
	min-height:450px;
}

#settings-container .card {
	margin-bottom:25px;
	background-image: none !important;
	background-color: rgba(16, 20, 25, .00);
	box-shadow: 0px 0px 0px rgb(0 0 0 / 75%);
	border-radius: 0px;
}

#settings-container .bg-dark {background-color: rgba(16, 20, 25, .12) !important;}

.form-group>.form-group {margin-top:0.5em; margin-bottom: 0.5rem}


#configuration-tabs-tabpane-tasks>.form-group {margin-bottom:2rem; margin-top:1em}

#configuration-tabs-tabpane-tasks h6 {     margin-top:3.5em; font-weight:bold; margin-bottom:1em;  }
#configuration-tabs-tabpane-tasks h5 {     margin-top:2.0em; font-weight:bold; 	letter-spacing: 0.09rem; }

.form-group h4 {margin-top:2em}


#parser-container.mx-auto {max-width:1400px;margin-right:auto !important}
.scene-parser-row .parser-field-title {width: 62ch}

.job-table.card {
	margin-top:-32px !important;
	background-color: rgba(16, 20, 25, .20) !important;
	border-radius: 10px !important;
}


.mx-auto {margin-right: 1% !important}
.mx-auto.card .row .col-md-2 .flex-column { position:fixed;min-height:400px}
.mx-auto.card>.row {min-height:360px}

.loading-indicator {opacity:80%; zoom:2}




/* --- Settings - Tasks ---- */


#configuration-tabs-tabpane-tasks>.form-group .card {
    padding: 20px;
    margin: 4px 0.40% 14px;
    background-image: none;
    background-color: rgba(16, 20, 25, .00);
    box-shadow: none;
    border-radius: 10px;
}

#tasks-panel h1 {margin-top: 3em}
.setting-section h1, #tasks-panel h1 {font-size: 1.55rem; max-width:180px}


@media (min-width: 576px) and (min-height: 600px) {
#tasks-panel .tasks-panel-queue {
    background: none !important;
    margin-top: -2.6rem;
    padding-bottom: .25rem;
    padding-top: 0rem;
    position: relative;
    top: 0rem;
    z-index: 2;
}
}

#tasks-panel hr {border-top: 0px solid rgba(140,142,160,.38);}
#tasks-panel h1 {margin-top:1.8em;}
#tasks-panel h1 {margin-top:0.8em;}

#configuration-tabs-tabpane-tasks {margin-top:40px}

#configuration-tabs-tabpane-tasks .form-group:last-child .setting-section .setting div:last-child {
    margin-right: 0% !important;
    margin-left: 0px;
    margin-top: 2px;
}

#configuration-tabs-tabpane-tasks .setting-section .sub-heading {margin-bottom:1em}
#configuration-tabs-tabpane-tasks .setting-section .collapsible-section  {margin-bottom:3em}
#configuration-tabs-tabpane-tasks #video-preview-settings  button { width:250px;margin-top:22px;margin-left:-57px}
#configuration-tabs-tabpane-tasks .tasks-panel-tasks .setting-section:nth-child(3) {margin-top:5em}

.tasks-panel-tasks .setting a { color: #ccccd3;}






@media (min-width: 1000px) {
	#settings-container .card {margin-top:-43px; margin-left:255px}
}



#settings-container .col-form-label {
    padding-top: calc(.55rem);
    padding-bottom: calc(.55rem);
}

.setting-section .setting-group>.setting:not(:first-child), .setting-section .setting-group .collapsible-section .setting {
    margin-left: 4rem; 
}

.setting-section .setting h3 {
    font-size: 1.4rem;
    margin:0.6em 0 0.4em;   
}

.setting-section:not(:first-child) {margin-top: 1em}
.setting-section .setting-group>.setting:not(:first-child).sub-setting, .setting-section .setting-group .collapsible-section .setting.sub-setting {    padding-left: 3rem;}



@media (min-width: 1200px) {
	.offset-xl-2 {
		max-width:1250px;
		margin-left:15%;
		margin-right:auto;
	}

	#settings-container .tab-content, .mx-auto {	max-width: none}
}

.setting-section .setting:not(:last-child) {	border-bottom: 0px solid #000 }






/* --- Checkboxes instead of Switches ---*/

.custom-switch {padding-left:2.25rem}
.custom-control {
    min-height: 1.5rem;
    padding-left: 0.5rem;
    margin-right:1em;
}
.custom-control-input:checked~.custom-control-label:before {
    color: rgb(0 0 0 / 0%);
    border-color: rgb(0 0 0 / 0%);
    background-color: rgb(0 0 0 / 0%);
}
.custom-switch .custom-control-label:before {
    pointer-events: auto;
    border-radius: 0;
}
.custom-switch .custom-control-input:checked~.custom-control-label:after {
    background-color: blue;
    transform: auto;
}
.custom-switch .custom-control-label:after {
    top: auto;
    left: auto;
    width: auto;
    height: auto;
    background-color: blue;
    border-radius: 0;
    transform: none;
    transition: none;
}

.custom-control-label:before {display:none} 
.custom-control-input {
	position: absolute;
	top:2px;
	left: 0;
	z-index: -1;
	width: 1.2rem;
	height: 1.35rem;
     opacity: 1;
     background-color:#10659a;
     color:#10659a;
}




.setting-section {margin-bottom:0.8em}
.setting-section .setting-group>.setting:not(:first-child), .setting-section .setting-group .collapsible-section .setting {
	padding-bottom: 3px;
	padding-top: 4px;
	margin-right: 0rem;
}
.setting-section .sub-heading {
	font-size:.9rem;
	margin-top:0.5rem;
	margin-bottom:3rem;
}


/* --- Settings - Interface ---- */


@media (min-width: 768px) {
.offset-md-3 {margin-left: 1%;}
#settings-menu-container {margin-left:1%; z-index:9; width:200px; padding-top:25px;}

	#configuration-tabs-tabpane-interface .setting-section:first-child .card  .setting div:nth-child(2) { width:64%;min-width:300px;padding-top:6px}
	#configuration-tabs-tabpane-interface .setting-section:first-child .card .setting div .sub-heading {margin-top:-28px; margin-left:255px;width:700px}
	#language .input-control { width:250px}
	
	#configuration-tabs-tabpane-interface .setting-section .setting-group>.setting:not(:first-child) {margin-left:275px}
	#configuration-tabs-tabpane-interface .setting-section .setting-group>.setting:nth-child(2) {margin-top: -40px}
	#configuration-tabs-tabpane-interface .setting-section:first-child h3 {    font-size: 1.55rem;}
}

@media (min-width: 1200px) {
	.offset-md-3 {margin-left: 14%;margin-right:2%}
	.setting-section h1, #tasks-panel h1 { max-width:220px;}
	#settings-menu-container {
		padding-top:25px;
		margin-left:14% !important;
		z-index:9;
		width:205px;
	}
}

@media (max-width: 768px) {
	.offset-md-3 {margin-left: 1%;}
	#settings-menu-container {margin-left:1%; z-index:9;width:180px;	padding-top:25px;}
	#settings-container {    padding-left: 180px;}
	.setting-section h1, #tasks-panel h1 { max-width:300px;}
}

@media (max-width: 576px) {
	.offset-sm-3 {margin-left: 1%;}
	#settings-menu-container {margin-left:1%;z-index:9;width:160px;	padding-top:25px;}
	#settings-container {padding-left: 10px;}
}

@media (max-width: 1004px) {
	.setting-section h1, #tasks-panel h1 { max-width:400px;}
	.job-table.card {margin-top:2px !important;}
}




.markdown table tr:nth-child(2n),
.modal-body .nav-link:hover,
#settings-menu-container .nav-link:hover {background-color: rgba(10, 20, 20, .15)}



@media (min-width: 1000px) {
	#settings-container #configuration-tabs-tabpane-interface .setting-section > .setting { padding: 15px 0px;}
	#settings-container #configuration-tabs-tabpane-interface .setting-section .setting-group .setting>div:first-item{margin-left: 4% !important;}	
	
	#settings-container #stash-table {margin-top:25px}
	#configuration-tabs-tabpane-interface .setting-section:first-child .card {	margin-top: -5px;	margin-left: -1%}		

	#language .input-control { width:250px}

	#configuration-tabs-tabpane-interface .setting-section:first-child .card > .setting div:nth-child(1) { width:255px}


	#configuration-tabs-tabpane-interface .setting-section:first-child .card  .setting div:nth-child(2) { width:68%;padding-top:6px}
	#configuration-tabs-tabpane-interface .setting-section:first-child .card .setting div .sub-heading {margin-top:-28px; margin-left:255px;width:700px}

	#configuration-tabs-tabpane-interface #language {margin-bottom:15px}
	#configuration-tabs-tabpane-library #stashes .sub-heading {margin-top:-26px; margin-left:235px;width:700px}
	
}



#configuration-tabs-tabpane-metadata-providers .setting,
#configuration-tabs-tabpane-security .setting,
#configuration-tabs-tabpane-tasks .setting,
#configuration-tabs-tabpane-system .setting-section .setting,
#settings-dlna .setting-section .setting,
#configuration-tabs-tabpane-interface .setting-section .setting {padding-top:0; padding-bottom:0}


#configuration-tabs-tabpane-interface .setting-section:nth-child(1) h1 {display:none}

#configuration-tabs-tabpane-interface .setting-section .setting-group>.setting:not(:first-child) h3 {
    font-size: 1rem;
    margin-left:2em;
}

#configuration-tabs-tabpane-interface .setting-section .setting-group .setting>div:last-child {
    margin-right: 95% !important;
    margin-left:0px;
    margin-top:-32px;
}

.setting-section .setting>div:first-child {max-width:415px}

#configuration-tabs-tabpane-interface .setting-section .setting>div:last-child {
    min-width: 20px;
    text-align: left;
    width:38%;
    
}

#configuration-tabs-tabpane-interface h3 {font-size:1.25em}

#wall-preview .input-control {width:160px}

.setting-section .setting-group>.setting:not(:first-child), .setting-section .setting-group .collapsible-section .setting {
    padding-top: 0px;
    padding-bottom: 0px;
    margin-right: 0rem;
    line-height:100%;
    margin-top:-3px;
    margin-bottom:-4px;
}

#configuration-tabs-tabpane-interface .setting-section:nth-child(7) .setting {margin-left:15px !important}
#configuration-tabs-tabpane-interface .setting-section:nth-child(7) .setting:nth-child(1) {margin-left: 0px !important;}


#settings-dlna h5 {margin-bottom:70px}
#settings-dlna .form-group h5{margin-left:255px;margin-top:-30px}

#configuration-tabs-tabpane-metadata-providers #stash-boxes .sub-heading {margin-top:-28px; margin-left:235px;width:700px;font-size:14px}

.scraper-table tr:nth-child(2n) {background-color: rgba(16, 20, 25, .12)}



/* --- Library ---*/
.stash-row .col-md-2 {padding-left:4%}
#configuration-tabs-tabpane-library .setting-section .setting {padding:0}



#configuration-tabs-tabpane-security .setting-section,
#configuration-tabs-tabpane-tasks .setting-section,
#configuration-tabs-tabpane-tasks .setting-group{max-width:915px}

#configuration-tabs-tabpane-logs .setting-section,
#configuration-tabs-tabpane-metadata-providers .setting-section,
#configuration-tabs-tabpane-services .setting-section,
#configuration-tabs-tabpane-system  .setting-section,
#configuration-tabs-tabpane-library .setting-section:not(:first-child),
#configuration-tabs-tabpane-interface .setting-section {max-width:810px}

#configuration-tabs-tabpane-security .setting-section .setting>div:last-child,
#configuration-tabs-tabpane-metadata-providers .setting-section .setting>div:last-child,
#configuration-tabs-tabpane-services .setting-section .setting>div:last-child,
#configuration-tabs-tabpane-system .setting-section .setting>div:last-child,
#configuration-tabs-tabpane-library .setting-section .setting>div:last-child,
#configuration-tabs-tabpane-interface .setting-section .setting>div:last-child,
#configuration-tabs-tabpane-tasks .setting-section .setting>div:last-child {
    min-width: 20px;
    text-align: right;
    width:auto;
    
}

#configuration-tabs-tabpane-tasks .setting-section .collapsible-section .setting div:last-child {
    margin-right: 95% !important;
    margin-left: -12px;
    margin-top: -15px;
}



#configuration-tabs-tabpane-system .setting-section .sub-heading {margin-bottom: 1.2rem}
`;
// Themes CSS End

// Themes CSS Begin
const pulsarLight = `
/*		Light Pulsar Theme - Fonzie 2021 v0.3.1		 */
/* ---------------------------------------------------- */
/* --------- Updated to Stash version 0.12.0 ---------- */

/* 
	Bug Fixes: Overlap of Help & Ssettings" buttons in the navbar, as well 
	as the Identify task

	Complete overhaul of the Settings page

	Bug Fix: Background-color in the navigation bar
   
	Adjustments to version 0.10.0 which includes moving the movie-, image- 
	and gallery-counter to the bottom of the performer image when you hover 
	over the card, and increasing the size of the star rating in the highest 
	zoom level.   	
*/


/* ===================== General ===================== */

body {
	background-image:url("https://i.imgur.com/UwICmXP.jpg");	/* Flower			*/
/*	background-image:url("https://i.imgur.com/zqt3MFY.jpg");	/* Green Leaves 	*/
/*	background-image:url("https://i.imgur.com/vCotzwB.jpg");	/* White Desert	*/
/*	background-image:url("https://i.imgur.com/Lverfqy.jpg");	/* Tropic Beach	*/
/*	background-image:url("https://i.imgur.com/4jrpuyR.jpg");	/* White Blue Waves	*/
/*	background-image:url("https://i.imgur.com/KUtfQzs.jpg");	/* Bright Lights	*/

	width: 100%;
	height: 100%;
	padding: 0 0 0;
	background-size: cover;
	background-repeat: no-repeat;
	background-color:#127aa5;
	background-attachment: fixed;
	background-position: center;
	color: #f9fbfd;
	color:#000;
}

h1, h2, h3{ 	color:#fff;}

:root {
	--HeaderFont: Helvetica, "Helvetica Neue", "The Sans", "Segoe UI";
	--std-txt-shadow: 2px 2px 1px #000;
	--light-txt-shadow: 1px 1px 3px #555;
	--white: #ffffff;
	--stars: url("https://i.imgur.com/YM1nCqo.png");
	--fourTwo: 0.35;
}


/* --- The Home button in the top left corner of each page. Remove the last 3 lines if you don't like the logo --- */
button.minimal.brand-link.d-none.d-md-inline-block.btn.btn-primary,
button.minimal.brand-link.d-inline-block.btn.btn-primary {
	text-transform: uppercase;
	font-weight: bold;
	margin-left:1px;
	background-image:url("./favicon.ico");
	padding-left:40px;
	background-repeat: no-repeat;
}

/* --- Makes the background of the Navigation Bar at the Top half-transparent --- */
nav.bg-dark {background: rgba(100, 200, 250, var(--fourTwo))!important;color:#000}
.bg-dark {background:none !important;background-color:none !Important}
.form-group .bg-dark {background: rgba(10, 20, 25, 0.20)!important;}

.navbar-buttons.navbar-nav a.nav-utility {margin-right:9px}


/* --- The space between the Navigation Bar and the rest of the page --- */
.main { margin-top:18px }
.top-nav { padding: .13rem 1rem; }


/* --- Changes how the Bar at the top of the page behaves --- */
.fixed-bottom, .fixed-top { position: relative !important; top:0px !important} 


/* The pagination at the top and at the bottom of the Scenes/Performer/Images/... pages; 
transparent background, rounded corners, etc. */
.filter-container, .operation-container {
	background-color: rgba(100, 150, 160, .35);
	box-shadow: none;
	margin-top: 6px;
	border-radius: 5px;
	padding: 5px;
}


/* --- Changes the space between the button in the top right corner of the page --- */
.order-2 button { margin-left: 4px }

/* --- Space between the items in the Nav bar --- */
.nav-link > .minimal {  margin: 0px;}


/* Each item on the Scenes/Performers/Tags/... pages */
.card {
	padding: 20px; 
	margin: 4px 0.5% 14px;
	/* --- Adds a glowing shimmer effect --- */
	background-image: linear-gradient(130deg, rgba(60, 70, 85,0.21), rgba(150, 155, 160,0.30), rgba(35, 40, 45,0.20), rgba(160, 160, 165,0.21), rgba(70, 80, 85,0.27)); 
	background-color: rgba(106, 120, 125, .25); 
	box-shadow: 2px 2px 6px rgba(0, 0, 0, .55);
	/* --- Increases the rounded borders of each item on the Scenes/Performers/... pages for 6px in 10px --- */
	border-radius: 10px;
}

/* --- Removes the glowing shimmer effect on the start page & the settings for readability purpose --- */
.mx-auto.card, .changelog-version.card {
	background-image: none !important; 
	background-color: rgba(16, 20, 25, .40) !important; 
}

/* --- Color that is used within .card secments --- */
.text-muted {	color: #eee !important;   	text-shadow: 1px 1px 2px #000;}


.bg-secondary {
	background: none;
	background-color: rgba(10, 25, 30, .3) !important;
}
 
.text-white {	color: #333 }
.border-secondary {	border-color: #2f3335 }
 
.btn-secondary.filter-item.col-1.d-none.d-sm-inline.form-control {
    background-color: rgba(0, 0, 0, .08);
}

/* --- Changes the color and the background of the buttons and elements in the toolbar (Search, Sort by, # of Items, etc.) --- */
.btn-secondary {
    color: #eef;
    background-color: rgba(45, 45, 45, .28);
    border-color: #3c3f45;
}
.btn-toolbar .btn-secondary {    color: #404049;     background-color: rgba(130, 130, 140, .28);}

 
a {	color: hsla(0, 10%, 10%, .85);}



/* --- Changes the color of the active page in the Navgation Bar --- */ 
.btn-primary:not(:disabled):not(.disabled).active,
.btn-primary:not(:disabled):not(.disabled):active,
.show>.btn-primary.dropdown-toggle {
	color: #fff;
	background-color: rgba(15, 150, 205, .6);
	border-color: #fff;
}

/* --- No border of the active element in the Navgation Bar --- */
.btn-primary.focus,
.btn-primary:focus,
.btn-primary:not(:disabled):not(.disabled).active:focus,
.btn-primary:not(:disabled):not(.disabled):active:focus,
.show>.btn-primary.dropdown-toggle:focus {box-shadow: none;}

.btn-primary:not(:disabled):not(.disabled).active,
.btn-primary:not(:disabled):not(.disabled):active,
.show>.btn-primary.dropdown-toggle {
	color: #fff;
	border-color: #eee;
    text-shadow: 1px 1px 2px #333;
    }

.container-fluid,.container-lg,.container-md,.container-sm,.container-xl {
	width: 100%;
	margin-right: 0px;
	margin-left: 0px;
}





/* ===================== Performer ========================= */


/* --- 0.90 - Section moves Movie-, Image- & Gallery-Count to the bottom of the performer image when hovered over --- */
.performer-card .card-popovers .movie-count,
.performer-card .card-popovers .image-count,
.performer-card .card-popovers .gallery-count
{
	z-index:300;
    position:absolute;
    top:-270%;
	opacity:0.0;
}

/* --- Highlight the bottom of the performer card when hovered over --- */
.performer-card.grid-card:hover {
	background-image: linear-gradient(130deg, rgba(50, 60, 75,0.25), rgba(150, 155, 160,0.32), rgba(35, 40, 45,0.26), rgba(160, 160, 165,0.27), rgba(50, 60, 65,0.37));
	background-color: rgba(102, 112, 120, .25);
}

/* --- When hovered over blend them in ---*/
.performer-card.grid-card:hover .card-popovers .movie-count,
.performer-card.grid-card:hover .card-popovers .image-count,
.performer-card.grid-card:hover .card-popovers .gallery-count {opacity: 1.0;transition: opacity .7s;}

/* --- 3 items gets a shadow ---*/
.performer-card .card-section .movie-count span,
.performer-card .card-section .movie-count button.minimal,
.performer-card .card-section .image-count span,
.performer-card .card-section .image-count button.minimal,
.performer-card .card-section .gallery-count span,
.performer-card .card-section .gallery-count button.minimal
{text-shadow: 2px 2px 1px #000, 1px 1px 1px #000, 4px 4px 5px #333, 9px 0px 5px #333, -3px 2px 4px #333, -7px 0px 5px #333, -1px -6px 5px #333, 3px -2px 6px #444;}

/* --- Positioning of the 3 items ---*/
.performer-card .card-popovers .movie-count {left:0.2%;}
.performer-card .card-popovers .image-count {left:32.8%}
.performer-card .card-popovers .gallery-count {right:1.3%}

.performer-card .movie-count a.minimal:hover:not(:disabled), .performer-card .movie-count button.minimal:hover:not(:disabled),
.performer-card .image-count a.minimal:hover:not(:disabled), .performer-card .image-count button.minimal:hover:not(:disabled),
.performer-card .gallery-count a.minimal:hover:not(:disabled), .performer-card .gallery-count button.minimal:hover:not(:disabled)
{
	background-color:rgba(20,80,110,0.92);
    color:#fff;
}

/* --- Affects the Scenes- and Tags-Counter --- */
a.minimal:hover:not(:disabled), button.minimal:hover:not(:disabled) {background: rgba(138,155,168,.45);color:#fff;}
div.performer-card div.card-popovers
{
	margin-bottom:-3px;
	margin-left:3%;
	margin-top:-4px;
	margin-right: -1px;
	justify-content: flex-end;
	text-align:right;
}

div.card-section hr {display:none}



/* --- Changes the width of the Performer Card from 280px to a dynamic system and therefore the size of the image --- */
/* --- In Full screen HD 1920x1080 you now see 8 performers per row instead of 6 --- */
/*.performer-card-image, .performer-card, .card-image {  min-width: 160px; width: calc(108px + 10.625vw / 2); max-width: 230px }  */
/*.performer-card-image, .performer-card, .card-image {  min-width: 160px; width: calc(108px + 19vw / 3.6);width:212px; max-width: 230px } */
.performer-card-image, .performer-card, .card-image {  min-width: 160px; width: calc(100px + 11.2vw / 1.92);max-width: 230px } 


/* --- Changes the height of the Performer Card to keep the 2x3 picture ratio --- */
/*.performer-card-image, .justify-content-center .card-image { min-height:240px; height: calc((108px + 10.625vw / 2) * 1.5); max-height: 345px}  */
.performer-card-image, .justify-content-center .card-image { min-height:240px; height: calc((112px + 19vw / 3.6) * 1.5); max-height: 345px;} 
.performer-card-image, .justify-content-center .card-image { min-height:240px; height: calc((100px + 11.2vw / 1.92) * 1.5); max-height: 345px;} 

@media (max-width: 575px), (min-width: 1200px) {
.scene-performers .performer-card-image { height: auto; }
.scene-performers .performer-card { width: auto; }
}


/* --- Fixes an issue of the card when watching a scene --- */
.image-section { display: cover;}

/* --- The name of the Performer. Different font, less space to the left & to the top, Text-Shadow --- */
.text-truncate, .card.performer-card .TruncatedText {
	margin-left:-1.5%; 
	margin-top: -2px; 
	width: 120%; 
	font-family: var(--HeaderFont);
	font-size: 112%; 
	line-height:130%; 
	font-weight:bold; 
	text-shadow: var(--std-txt-shadow);
}

/* --- Makes the Performer Name smaller when the screen is too small --- */
@media (max-width: 1200px) { .card.performer-card .TruncatedText { font-size: 104%; } }



/* --- Moves the Flag icon from the right side of the card to the left and makes the Flag image a little bit bigger --- */
.performer-card .flag-icon {
    height: 2rem;
    left: 0.6rem;
    bottom: 0.10rem;
    width: 28px; 
}

/* --- Age and # of Scenes move from the left side to the right of the card --- */
/* --- Also makes sure that when playing a scenes "XX years old in this scene" doesn't overlap with the star rating --- */
.performer-card .text-muted {text-align:right;margin-top:-2px;margin-bottom:1px;width:46%;margin-left:54%}



/* --- "removes" the term 'old.' from "xx years old." when the resolution gets to small --- */ 
@media (max-width: 1520px) {
div.card.performer-card .text-muted {text-align:right;margin-top:-2px;margin-bottom:1px;margin-right:-33px;max-height:20px;overflow:hidden;}
}

/* --- To prevent overlapping in the performer card when watching a scene --- */
@media (max-width: 2000px) {
.tab-content div.card.performer-card .text-muted {margin-top:22px;margin-right:-3px}
.tab-content .performer-card.card .rating-1, 
.tab-content .performer-card.card .rating-2, 
.tab-content .performer-card.card .rating-3, 
.tab-content .performer-card.card .rating-4, 
.tab-content .performer-card.card .rating-5 {bottom: 53px !important;}
}


/* --- Text Shadow for the "Stars in x scenes" link --- */
div.card.performer-card div.text-muted a {text-shadow: 1px 2px 2px #333}

/* --- Minimum height for the section in case Age is missing and elements would overlap --- */
.performer-card .card-section {min-height:82px}

/* --- Makes the card section (Name, Age, Flag, # of scenes) more compact --- */
.card-section { margin-bottom: -8px !important; padding: .5rem 0.7rem 0 !important;}
.card-section span {margin-bottom:3px}
@media (max-width: 1500px) {	.card-section span {font-size:11px}	}

div.card-section hr {display:none}




/* --- Changes regarding the Favorite <3 --- */
.performer-card .favorite {
    color: #f33;
    -webkit-filter: drop-shadow(2px 2px 3px rgba(0, 0, 0, .95));
	filter: drop-shadow(2px 2px 3px rgba(0, 0, 0, .95));
	right: 3px;
	top: 5px;
}



/* --- Turns the Rating Banner in the top left corner into a Star Rating under the performer name --- */
.performer-card.card .rating-1, .performer-card.card .rating-2, .performer-card.card .rating-3, 
.performer-card.card .rating-4, .performer-card.card .rating-5
{
	background:none;
	background-size: 97px 18px;
	background-image:var(--stars);
	-webkit-transform:rotate(0deg);
	transform:rotate(0deg);
	padding:0;
	padding-bottom:1px;
	box-shadow: 0px 0px 0px rgba(0, 0, 0, .00);
	left:6px;
	width:97px;
	height:18px;
	text-align:left;
	position:absolute;
	top:auto;
	bottom: 34px;
	font-size:0.001rem;
}

/* --- Display only X amount of stars  -- */
div.performer-card.card .rating-banner.rating-1 {width:20px}
div.performer-card.card .rating-banner.rating-2 {width:39px}
div.performer-card.card .rating-banner.rating-3 {width:59px} 
div.performer-card.card .rating-banner.rating-4 {width:78px}  
div.performer-card.card .rating-banner.rating-5 {width:97px}  


.performer-card .btn {padding: .34rem .013rem}
.performer-card .fa-icon {margin: 0 2px}
.performer-card .card-popovers .fa-icon {margin-right: 3px}
.performer-card .svg-inline--fa.fa-w-18, .performer-card .svg-inline--fa.fa-w-16 {height: 0.88em}
.performer-card .favorite .svg-inline--fa.fa-w-16 {height:1.5rem}


.performer-card .card-popovers .btn-primary {
    margin: 0 2px 0 11px;
}



/* --- PerformerTagger Changes --- */

.PerformerTagger-performer {
	background-image: linear-gradient(130deg, rgba(50, 60, 75,0.25), rgba(150, 155, 160,0.32), rgba(35, 40, 45,0.26), rgba(160, 160, 165,0.27), rgba(50, 60, 65,0.37)); 
	background-color: rgba(16, 20, 25, .23); 
	box-shadow: 2px 2px 6px rgba(0, 0, 0, .70);
	border-radius: 8px;
	margin: 1.1%;
  }
  
.tagger-container .input-group-text  {background:none;border:0;margin-right:5px;padding-left:0}
.PerformerTagger-details {	margin-left: 1.25rem; width:23.5rem;}

.tagger-container .btn-link{text-shadow: 1px 2px 3px #000;}
.tagger-container, .PerformerTagger {	max-width: 1850px;}

.PerformerTagger-header h2 {	
	font-family: Helvetica, "Helvetica Neue", "Segoe UI" !important; 
	font-size: 2rem; 
	line-height:130%; 
	font-weight:bold; 
	text-shadow: 2px 2px 1px #000 !important
}

.PerformerTagger-thumb {height: 145px;}
.PerformerTagger-performer-search button.col-6 {width:300px !important; flex-basis:100%;flex: 0 0 100%;
    max-width: 100%;}
.PerformerTagger-performer .performer-card {height:252px !important;}

.modal-backdrop 	 {	background-color: rgba(16, 20, 25, .25);}
.modal-backdrop.show {	opacity: 0.1;	}

.performer-create-modal {	max-width: 1300px; font-family: Helvetica, "Helvetica Neue", "Segoe UI" !important; }
.performer-create-modal .image-selection .performer-image { height: 95%; }
.performer-create-modal .image-selection {height: 485px;}

.performer-create-modal .no-gutters .TruncatedText {
	font-family: var(--HeaderFont);
	font-size: 115%;
	padding-top:2px;
	line-height:120%; 
	font-weight:bold; 
	text-shadow: var(--std-txt-shadow);
}
.performer-create-modal-field strong {margin-left: 6px}
.modal-footer {border-top: 0}






/* ========================= Performer Page ================================= */
/* === The page that you see when you click on the picture of a Performer === */

/* --- The picture of the Performer on the left. 3D effect thanks to background shadows and more rounded corners --- */
#performer-page .performer-image-container .performer 
{
    background-color: rgba(0, 0, 0, .48);
    box-shadow: 6px 6px 11px rgba(0, 10, 10, .62);
    border-radius: 14px !important;
}

/* --- Without this the shadow at the bottom from the previous Selector will not be correctly displayed --- */
.performer-image-container {padding-bottom: 11px}


/* --- The following 15 Selectors change the way the details box is displayed --- */
#performer-details-tabpane-details .text-input, #performer-details-tabpane-details .text-input:disabled, 
#performer-details-tabpane-details .text-input[readonly] {background-color: rgba(200,220,246,0.0);}
#performer-details-tabpane-details a { text-shadow: var(--light-txt-shadow)}

.text-input, input.form-control-plaintext { background-color:none;}
#performer-details .input-control, .text-input {box-shadow: none;}

div.react-select__control, #performer-details-tabpane-details {
	background-color: rgba(225,230,250,0.36); 
	border:1px solid #999; 
	max-width:1000px;
	box-shadow: 6px 6px 12px rgba(0, 10, 10, .22);
}
#performer-details-tabpane-details {border-radius: 10px}
#performer-details-tabpane-edit {max-width:1000px}

div.react-select__control .css-12jo7m5 {text-shadow: none; }

@media (min-width: 1200px) {
	#performer-details-tabpane-details td { padding: 9px; }
	table#performer-details tbody tr td:nth-child(1), td:first-child {padding-left: 22px; width: 185px;}
}
@media (max-width: 1200px) {
	table#performer-details tbody tr td:nth-child(1), td:first-child {padding-left: 11px; }
	#performer-page .performer-head {    margin-bottom: 1rem; }
	#performer-page { margin: 0 -6px 0 -15px; }
}
#performer-details-tabpane-details tr:nth-child(odd) {     background-color: rgba(16,22,26,0.1); }
table#performer-details {color:#FFF; text-shadow: 1px 1px 1px #000;}



/* --- Changes the way the name of the performer is displayed --- */
.performer-head h2 {font-family: var(--HeaderFont); font-weight:bold; text-shadow: 2px 2px 2px #111 }

/* --- Leave some space between the name and the Fav/Link/Twitter/IG icons --- */
#performer-page .performer-head .name-icons {margin-left: 22px}

/* --- Highlighter for active Details/Scenes/Images/Edit/Operations --- */
.nav-tabs .nav-item.show .nav-link, .nav-tabs .nav-link.active {
	background-color: rgba(135,160,165,0.5);
}

/* --- Changes the display of Performer Details Tab in the 0.9 version are arranged --- */
#performer-details-tabpane-details dl.row, dl.details-list dt, dl.details-list dd{ margin:0 0px;padding: 8px 10px 9px 14px}
#performer-details-tabpane-details dl.row:nth-child(odd),
#performer-details-tabpane-details dl.details-list dt:nth-of-type(odd),
#performer-details-tabpane-details dl.details-list dd:nth-of-type(odd) {	background-color: rgba(16,22,26,0.1);}
#performer-details-tabpane-details dt.col-xl-2,
#performer-details-tabpane-details dl.details-list dt {	text-shadow: var(--light-txt-shadow); font-weight: normal;}
#performer-details-tabpane-details ul.pl-0 {margin-bottom: 0rem;}
#performer-details-tabpane-details dl.details-list { grid-column-gap: 0}


/* --- Resets the fields in Performer Edit Tab in the 0.5 developmental version back to way it was in the 0.5 version --- */
#performer-edit {margin:0 0 0 10px}
#performer-edit .col-sm-auto, #performer-edit .col-sm-6, #performer-edit .col-md-auto, #performer-edit .col-lg-6, #performer-edit .col-sm-4, #performer-edit .col-sm-8 { width: 100%;max-width: 100%; flex: 0 0 100%; }
#performer-edit .col-sm-auto div, #performer-edit label.form-label { float:left; width:17%;}
#performer-edit .col-sm-auto div, #performer-edit label.form-label { font-weight:normal; color: #FFF; text-shadow: var(--std-txt-shadow); }

#performer-edit select.form-control, #performer-edit .input-group, #performer-edit .text-input.form-control { float:right; width:83%; }
#performer-edit .form-group, .col-12 button.mr-2 {margin-bottom: 0.35rem}
#performer-edit .mt-3 label.form-label { float:none; width:auto; }

#performer-edit select.form-control, #performer-edit .input-group, #performer-edit .text-input.form-control {width: 100%;}
#performer-edit textarea.text-input {min-height: 9ex;}

#performer-edit .form-group:nth-child(17) .text-input.form-control {width:85%;}

@media (max-width: 750px) {
#performer-edit .col-sm-auto div, #performer-edit label.form-label { float:left; width:22%;}
#performer-edit select.form-control, #performer-edit .input-group, #performer-edit .text-input.form-control { float:right; width:78%; }
}

@media (max-width: 500px) {
#performer-edit .col-sm-auto div, #performer-edit label.form-label { float:left; width:60%;}
#performer-edit li.mb-1, 
#performer-edit select.form-control, 
#performer-edit .input-group, #performer-edit .text-input.form-control { float:left; width:89%; }
}

#performer-edit .form-group .mr-2 {margin-right:0!important}





/* ======================= Scenes ======================== */


/* --- Remove the comments if you don't want to see the Description Text of the scenes --- */
/* .card-section p {display:none} */


/* --- Remove the comments if you don't want to see the Resolution of the Video (480p, 540p, 720p, 1080p) --- */
/* .overlay-resolution {display:none} */



/* --- The name of the Scene. Different font, less space to the left and to the top, Text-Shadow --- */
h5.card-section-title, .scene-tabs .scene-header {	
	font-family: var(--HeaderFont);
	font-size: 1.25rem;
	font-weight:bold;
	line-height:132%;
	text-shadow: var(--std-txt-shadow);
}
.scene-tabs .scene-header { font-size: 24px; margin-bottom:25px }


#TruncatedText .tooltip-inner {width:365px; max-width:365px}
.tooltip-inner {	font-family: var(--HeaderFont);
	background-color: rgba(16, 20, 25, .99); 
	box-shadow: 2px 2px 6px rgba(0, 0, 0, .55);
 font-weight:bold;font-size:14px;}

/* --- Removes the horizontal line that separates the date/description text from the Tags/Performer/etc. icons --- */
.scene-card.card hr, .scene-card.card>hr{	border-top: 0px solid rgba(0,0,0,.1);	}


/* --- Changes regarding the Scene Logo --- */
.scene-studio-overlay {
	opacity: .80;
	top: -3px;
	right: 2px;
}

/* --- The Resolution and the Time/Length of the video in the bottom right corner to make it easier to read --- */
.scene-specs-overlay {
	font-family: Arial, Verdana,"Segoe UI" !important;
	bottom:1px;
	color: #FFF;
	font-weight: bold;
	letter-spacing: 0.035rem;
	text-shadow: 2px 2px 1px #000, 4px 4px 5px #444, 7px 0px 5px #444, -3px 2px 5px #444, -5px 0px 5px #444, -1px -4px 5px #444, 3px -2px 6px #444;
}
.overlay-resolution {color:#eee;}

/* --- Changes the spaces between the items on the Scenes page --- */
.zoom-0 {margin: 4px 0.50% 10px; !important }


.scene-card-link {height:195px; overflow:hidden;}


/* --- Tightens the space between the Tags-, Performer-, O-Counter-, Gallery- and Movie-Icons --- */
.btn-primary { margin:0 -3px 0 -9px}

/* --- Moves the Tags-, Performer-, O-Counter-, Gallery- and Movie-Icon from below the description to the bottom right corner of the card --- */
.scene-popovers, .card-popovers { 
	min-width:0;
	margin-bottom: 3px;
	margin-top:-40px;
	justify-content: flex-end;
}

/* --- Adds an invisible dot after the description text, Also leaves ~80 pixels space to enforce a line break, 
so it leaves some space in the bottom right corner of the card for the icons in the Selector above --- */
.card-section p:after 
{
	font-size: 1px;
	color: rgba(0,0,0, .01);
	padding-right: 3.2vw; 
	margin-right: 2.8vw; 
	content: " ";
}




/* -- The whole section replaces the ratings banner with a star rating in the bottom left corner --- */ 
.scene-card.card .rating-1 {width:22px}
.scene-card.card .rating-2 {width:43px}
.scene-card.card .rating-3 {width:65px} 
.scene-card.card .rating-4 {width:86px}  
.scene-card.card .rating-5 {background:none; width:108px}
.rating-1, .rating-2, .rating-3, .rating-4, .scene-card.card .rating-5 {
	background:none;
	background-image:var(--stars);
	height:20px;
	background-size: 108px 20px;
} 

.scene-card.card .rating-banner {
	padding:0;
	left:5px;
	top:89%;
	background-position: left;
	font-size: .01rem;
	-webkit-transform: rotate(0deg);
	transform: rotate(0deg);
}


.zoom-0.card .scene-card.card .rating-banner {top: 81%}
.zoom-2.card .scene-card.card .rating-banner {top: 91%}
.zoom-3.card .scene-card.card .rating-banner {top: 92%}



/* --- Improves how the Preview Videos in the Wall View are displayed --- */
.wall-item-container {width: 100%; background-color: rgba(0, 0, 0, .10); overflow:hidden }
.wall-item-media { height:100%; background-color: rgba(0, 0, 0, .0);overflow:hidden }
.wall-item-anchor { width: 102%; overflow:hidden }
.wall-item-text {margin-bottom:0px; color: #111; text-shadow: 1px 1px 1px #fff }	


.scene-popovers .fa-icon {margin-right: 2px;}

/* --- Changes the Organized Button color when watching a video. Organized = Green, Not Organized = Red --- */
.organized-button.not-organized { color: rgba(207,10,20,.8); }
.organized-button.organized {	color: #06e62e;}


/* --- Changes the font in the File Info section --- */
div.scene-file-info .TruncatedText, div.scene-file-info .text-truncate {
	margin-left:-1.5%; 
	margin-top: -1px; 
	width: 120%; 
	font-family: var(--HeaderFont);
	font-size: 110%; 
	line-height:120%; 
	font-weight:bold; 
	text-shadow: var(--std-txt-shadow);
}


#scene-edit-details .pl-0 {
    padding-left: 10px!important;
}


/* Zoom 0 */
.zoom-0 { width:290px}
.zoom-0 .video-section {height:181px;}
.zoom-0 .scene-card-preview-image, .zoom-0 .scene-card-preview { height:195px; }
.zoom-0 .scene-card-preview, .zoom-0 .scene-card-preview-video, .zoom-0 .scene-card-video {
	width: 290px;
	min-height:181px;
	max-height: 200px;
}

/* Zoom 1 */
.zoom-1 { min-width: 300px; width: calc(234px + 24vw /3.84);max-width: 430px}
/* Improves the way the scene picture is displayed when the resolution isn't 16:9 (e.g. 4:3) --- */
.zoom-1 .video-section {height:calc((233px + 24vw / 3.84)/1.65);max-height: 258px}
.zoom-1 .scene-card-preview-image, .zoom-1 .scene-card-preview { height:100%; max-height: 260px}

/*
.zoom-1 .scene-card-preview-image, .zoom-1 .scene-card-preview { height:calc((237px + 24vw / 3.84)/1.65); max-height: 260px}
*/
.zoom-1 .scene-card-preview, .zoom-1 .scene-card-preview-video, .zoom-1 .scene-card-video {
	min-width: 300px; width: calc(228px + 17vw / 1.92);max-width: 470px;
	height:calc((234px + 26vw / 3.84)/1.65);
	max-height: 265px;
}

/* Zoom 2 */
.zoom-2 { min-width: 350px; width: calc(310px + 26vw / 3.84);max-width: 495px}
.zoom-2 .video-section {height:calc((310px + 26vw / 3.84) /1.65);max-height:295px}
.zoom-2 .scene-card-preview-image, .zoom-2 .scene-card-preview { height:calc((313px + 26vw / 3.84) /1.65); max-height:292px}

.zoom-2 .scene-card-preview, .zoom-2 .scene-card-preview-video, .zoom-2 .scene-card-video {
	min-width: 350px; width: calc(330px + 28vw / 3.84);max-width: 530px;
	height:calc((310px + 28vw / 3.84) /1.65);
	max-height: 298px;
}


/* Zoom 3 */
.zoom-3 { min-width: 400px; width: calc(530px + 18vw / 5.76);max-width: 590px}
.zoom-3 .video-section {height:375px;}
.zoom-3 .scene-card-preview-image, .zoom-3 .scene-card-preview { height:395px; }
.zoom-3 .scene-card-preview, .zoom-3 .scene-card-preview-video, .zoom-3 .scene-card-video {
	width: 600px;
	min-height:385px;
	max-height: 400px;
}


.zoom-0 .video-section, .zoom-1 .video-section, .zoom-2 .video-section, .zoom-3 .video-section 
{object-fit: cover !important;overflow:hidden;}

.zoom-0 .scene-card-preview, .zoom-0 .scene-card-preview-video, .zoom-0 .scene-card-video,
.zoom-1 .scene-card-preview, .zoom-1 .scene-card-preview-video, .zoom-1 .scene-card-video, 
.zoom-2 .scene-card-preview, .zoom-2 .scene-card-preview-video, .zoom-2 .scene-card-video,
.zoom-3 .scene-card-preview, .zoom-3 .scene-card-preview-video, .zoom-3 .scene-card-video {
	object-fit: cover !important;
	margin-top:-2%;
	margin-left:-6px;
	transform: scale(1.04);
}

/* --- Shrink the Player Height just a little bit to avoid the scroll bar --- */
#jwplayer-container {    height: calc(99.5vh - 4rem);}


div.tagger-container .btn-link { 	
	font-family: var(--HeaderFont);
	font-size: 110%; 
	color: #ddf; 
	text-shadow: var(--std-txt-shadow); 
}

#scene-edit-details .edit-buttons-container {
	background-color: rgba(0,0,0,0.0);
	position: relative;
	margin-bottom:15px;
}

#scene-edit-details .form-group {margin-bottom:0.65rem;}






/* ============== Studio ================= */


.studio-card {	padding: 0 4px 14px;}

.studio-details input.form-control-plaintext {	background-color: rgba(16,22,26,.0); }
.studio-details .react-select__control--is-disabled  {	background: none; border:0}

.studio-details .form-group, .studio-details td { padding: 8px; }
.studio-details table td:nth-child(1) {color:#FFF; text-shadow: 1px 1px 1px #000;}

.studio-card-image {max-height: 175px; height:175px}
.studio-card-image {min-width: 260px; width: calc(238px + 19vw / 3.8); max-width: 360px; margin: 0 6px;}
.studio-card .card-section {	margin-top: 22px;}
.studio-card .card-section div {color:#FFF}
.studio-card .card-popovers {width:63%;margin-left:37%}

@media (min-width: 1200px) {
.pl-xl-5, .px-xl-5 {
    padding-left: 1rem!important; 
    padding-right: 1rem!important;
} }

.no-gutters .TruncatedText, .tag-card .TruncatedText, div.card.studio-card .TruncatedText, .tagger-container .TruncatedText  {
	font-family: var(--HeaderFont);
	font-size: 125%; 
	line-height:125%; 
	font-weight:bold; 
	text-shadow: var(--std-txt-shadow);
}

.no-gutters .TruncatedText {font-size: 115%;}

/* --- The following 15 Selectors modify the info box on the left after clicking on a movie --- */
.studio-details .text-input, #performer-details-tabpane-details .text-input:disabled, 
.studio-details .text-input[readonly] {background-color: rgba(16,22,26,0.0);}

.text-input, input.form-control-plaintext { background-color:none;}
.studio-details .input-control, .text-input {box-shadow: none;}

.studio-details table { margin-top: 20px; background-color: rgba(15,20,30,0.20); border-radius: 10px; margin-bottom:20px;}
.studio-details .form-group, .studio-details .row {background-color: rgba(15,20,30,0.20); margin:0;}
.studio-details .no-gutters {background: none !important; }

.studio-details table div.react-select__control {background: none; border: 0px;margin:0}
.studio-details table .css-1hwfws3 { padding:0px; }

.studio-details .form-group, .movie-details td { padding: 8px; }
.studio-details .form-group td:nth-child(1), 
.studio-details table tbody tr td:nth-child(1), td:first-child {padding-left: 12px; width: 130px;}

.studio-details table tr:nth-child(odd) {     background-color: rgba(16,22,26,0.1); }
.studio-details .form-group, .studio-details table td:nth-child(1) {color:#FFF; text-shadow: 1px 1px 1px #000;}


.studio-card.card .rating-1, .studio-card.card .rating-2, .studio-card.card .rating-3, 
.studio-card.card .rating-4, .studio-card.card .rating-5
{
	background:none;
	height: 25px;
	background-size: 135px 25px;
	background-image:var(--stars);
	-webkit-transform:rotate(0deg);
	transform:rotate(0deg);
	padding:0;
	padding-bottom:1px;
	box-shadow: 0px 0px 0px rgba(0, 0, 0, .00);
	left:10px;
	text-align:left;
	position:absolute;
	top:auto;
	bottom: 24% !important;
	font-size:0.001rem;
}

.studio-card.card .rating-5{width:135px;} 
.studio-card.card .rating-4{width:109px;} 
.studio-card.card .rating-3{width:81px;} 
.studio-card.card .rating-2{width:55px;} 
.studio-card.card .rating-1{width:28px;} 

div.studio-card.card .card-popovers {	margin-top: -34px;}
.studio-card.card .card-section div:nth-child(2) {margin-bottom:6px;margin-top:-3px;}

.studio-details dl.details-list{ grid-column-gap: 0}
.studio-details dt, .studio-details dd {padding: 6px 0 8px 8px}









/* ============== TAGS =============== */

.tag-card.card hr, .tag-card.card>hr{ border-top: 0px solid rgba(0,0,0,.1); }

.tag-card { margin: 4px 0.5% 10px; padding:0px;}


@media (min-width: 1200px){
.row.pl-xl-5, .row.px-xl-5 {
	padding-left: 0.2rem!important; 
	padding-right: 0.2rem!important;
}
}

.tag-card.zoom-0 {
	min-width: 230px; width: calc(200px + 18vw / 1.1); max-width: 350px;
	min-height:168px; height:auto;
}
.tag-card.zoom-0 .tag-card-image {	min-height: 100px; max-height: 210px; height: calc(95px + 15vw / 1.1);}

.tag-card.zoom-1 {
	min-width: 260px; width: calc(238px + 25vw / 2.3); max-width: 460px;
	min-height:193px; height:auto;
}
.tag-card.zoom-1 .tag-card-image {	min-height: 120px; max-height: 240px; height: calc(100px + 19vw / 2.3);}

.tag-card.zoom-2 {
	min-width: 290px; width: calc(280px + 38vw / 2.45); max-width: 650px;
	min-height:170px; height:auto; max-height:485px;
}
.tag-card.zoom-2 .tag-card-image {	min-height: 175px; max-height: 440px; height: calc(120px + 30vw / 2.45);}


#tags .card {padding:0 0 10px 0; }
.tag-card-header {height:190px;overflow:hidden;}

.zoom-0 .tag-card-image, .zoom-1 .tag-card-image, .zoom-2 .tag-card-image {
zoom: 101%;
object-fit: cover;
overflow:hidden;
width: 101%;
margin-top: -2px;
margin-left: -1%;
}

.tag-card .scene-popovers, .tag-card .card-popovers { 
	width:60%;
	margin-left:40%;
	justify-content: flex-end;
	float:right;
	margin-bottom: 15px;
	margin-top:-34px;
	padding-left:17px;
}

.tag-sub-tags, .tag-parent-tags {margin-bottom:9px; color:#FFF}
.tag-sub-tags a, .tag-parent-tags a {color:#FFF; text-shadow: var(--std-txt-shadow)}

.zoom-0 .tab-pane .card-image { height:210px }


/* --- Moves the Tag name into the Tag Picture --- */
.tag-details .text-input[readonly] {background-color: rgba(0,0,0,.0);}
.tag-details .table td:first-child {display:none}
.tag-details .logo {margin-bottom: 12px;}

.tag-details .form-control-plaintext, .tag-details h2 {
	margin-top:-76px;
	margin-left:0%;
	font-weight: bold;
	font-family: Helvetica, "Helvetica Neue", "Segoe UI" !important;
	letter-spacing: 0.11rem;
	font-size:44px;
	text-shadow: 2px 2px 3px #111, 4px 4px 4px #282828, 6px 1px 4px #282828, -3px 3px 3px #444, -2px -2px 4px #282828;
	text-align:center; 
}
@media (max-width: 1300px) {.tag-details .form-control-plaintext {font-size:26px; 	margin-top:-50px;}}

.tag-details .logo { min-width:300px}





/* ==============  MOVIES ==============  */

/* --- Changes the width of the items so only the front cover is displayed. Also replaces the ratings banner with a star rating --- */

.movie-card .text-truncate, div.card.movie-card .TruncatedText {
	font-size: 17px !important;
	font-family: var(--HeaderFont);
	text-shadow: var(--std-txt-shadow);
	font-weight: bold;
	max-width:210px;
	white-space: nowrap;
	overflow: hidden; 
	text-overflow: ellipsis;
}

div.movie-card.grid-card.card .card-section p {margin-bottom:-8px}
div.movie-card.grid-card.card .card-section {margin-bottom: -0px !important}
div.movie-card.grid-card.card .card-popovers {
	padding-top:35px;
	margin-bottom:-11px;
	width:60%;
	margin-left:40%;
	justify-content:flex-end;
	float:right;
}

div.movie-card .card-section span {position:absolute;margin-top:-3px;margin-bottom:6px;color:#FFF}



.movie-card-header {height:320px}

.movie-card-header .rating-banner {
	font-size: .002rem;
	padding: 8px 41px 6px;
	line-height: 1.1rem;
	transform: rotate(0deg);
	left: 3px;
	top: 77% !important;
	height: 25px;
	background-size: 135px 25px;
	background-position: left;
}

.movie-card-header .rating-1 {width:28px}
.movie-card-header .rating-2 {width:55px}
.movie-card-header .rating-3 {width:83px} 
.movie-card-header .rating-4 {width:110px}  
.movie-card-header .rating-5 {width:138px}

.movie-card-header .rating-5 {
	background:none;
	background-image:var(--stars);
	height: 25px;
	background-size: 135px 25px;
}

.movie-card-image {
	height:345px;
	max-height: 345px;
     width: 240px;
}




/* --- The following 15 Selectors modify the info box on the left after clicking on a movie --- */
.movie-details .text-input, #performer-details-tabpane-details .text-input:disabled, 
.movie-details .text-input[readonly] {background-color: rgba(16,22,26,0.0);}

.text-input, input.form-control-plaintext { background-color:none;}
.movie-details .input-control, .text-input {box-shadow: none;}

.movie-details table { margin-top: 20px; background-color: rgba(15,20,30,0.20); border-radius: 10px 10px 0px 0px; margin-bottom:0;}
.movie-details .form-group {background-color: rgba(15,20,30,0.20); margin:0;}

.movie-details table div.react-select__control {background: none; border: 0px;margin:0}
.movie-details table .css-1hwfws3 { padding:0px; }

.movie-details .form-group, .movie-details td { padding: 8px; }
.movie-details .form-group td:nth-child(1), 
.movie-details table tbody tr td:nth-child(1), td:first-child {padding-left: 12px; width: 120px;}

.movie-details table tr:nth-child(odd) {     background-color: rgba(16,22,26,0.1); }
.movie-details .form-group, .movie-details table td:nth-child(1) {color:#FFF; text-shadow: 1px 1px 1px #000;}



/* --- 0.60 dev adjustments --- */
.studio-details .studio-details, .movie-details .movie-details {background-color: rgba(15,20,30,0.20); border-radius: 10px; margin-bottom:15px; }
.movie-details .movie-details dt.col-3 {padding:4px 0 4px 16px; width: 120px;}
.movie-details .movie-details dd.col-9 {padding:4px 16px 4px 3px;}
.studio-details dl.details-list dt:nth-of-type(odd),
.studio-details dl.details-list dd:nth-of-type(odd),
.movie-details dl.details-list dt:nth-of-type(odd),
.movie-details dl.details-list dd:nth-of-type(odd),
.movie-details dl.row:nth-child(odd) { background-color: rgba(16,22,26,0.1); margin-right:0px; padding-left:14px;margin-bottom:5px}
.movie-details dl.details-list dt, .movie-details dl.details-list dd {padding-left: 7px;}
.movie-details dl.details-list { grid-column-gap: 0}
.studio-details h2, .movie-details .movie-details h2 {	font-family: var(--HeaderFont);font-weight:bold;text-shadow: var(--std-txt-shadow);padding:7px 0 5px 12px;}

.movie-details .movie-images {margin:0 5px 20px 5px;}
.movie-details .movie-images img {border-radius: 14px; max-height:580px;}
.movie-details .movie-image-container{
	margin:0.3rem;
	margin-right:0.8rem;
	background-color: rgba(0, 0, 0, .48);
	box-shadow: 6px 6px 11px rgba(0, 10, 10, .62);
}

form#movie-edit { margin-bottom:15px}






/* ==============  IMAGES ==============  */

div.image-card .rating-banner {
	font-size: .002rem;
	padding: 8px 41px 6px;
	line-height: 1.1rem;
	transform: rotate(0deg);
	padding: 0;
	left: 3px;
	top: 72% !important;
	height: 25px;
	background-size: 135px 25px;
	background-position: left;
}

div.image-card .rating-1 {width:28px}
div.image-card .rating-2 {width:55px}
div.image-card .rating-3 {width:83px} 
div.image-card .rating-4 {width:110px}  
div.image-card .rating-5 {width:138px}

div.image-card .rating-5 {
	background:none;
	background-image:var(--stars);
	height: 25px;
	background-size: 135px 25px;
}

div.image-card .scene-popovers, div.image-card .card-popovers {
	margin-top: -2px;
	justify-content: flex-end;
}
div.image-card hr, .scene-card.card>hr{
	border-top: 0px solid rgba(0,0,0,.1); 
}







/* ==============  GALLERIES ==============  */

div.gallery-card hr, .scene-card.card>hr{
	border-top: 0px solid rgba(0,0,0,.1); 
}

div.gallery-card .rating-banner {
	font-size: .002rem;
	padding: 8px 41px 6px;
	line-height: 1.1rem;
	transform: rotate(0deg);
	padding: 0;
	left: 3px;
	top: 70% !important;
	height: 25px;
	background-size: 135px 25px;
	background-position: left;
}

div.gallery-card .rating-1 {width:28px}
div.gallery-card .rating-2 {width:55px}
div.gallery-card .rating-3 {width:83px} 
div.gallery-card .rating-4 {width:110px}  
div.gallery-card .rating-5 {width:138px}

div.gallery-card .rating-5 {
	background:none;
	background-image:var(--stars);
	height: 25px;
	background-size: 135px 25px;
}

div.gallery-card .scene-popovers, div.gallery-card .card-popovers {
	margin-bottom: -8px;
	margin-top: -24px; 
	justify-content: flex-end;
}








/* ==============  MISC ==============  */

.svg-inline--fa.fa-w-18 {width: 1.4em;}

/* --- Makes the Zoom Slider on the Scenes, Images, Galleries and Tags pages longer and therefore easier to use --- */
input[type=range].zoom-slider{ max-width:140px;width:140px; }

/* --- Changes the zoom slider color --- */
input[type=range]::-webkit-slider-runnable-track {background-color: #88afcc !important;}


.tag-details .logo {
    background-color: rgba(0, 0, 0, .48);
    box-shadow: 3px 3px 5px rgba(0, 0, 0, .42);
    border-radius: 9px !important;
}

.search-item {
    background-color: none;
    background-color: rgba(16,22,26,0.27);
}

.btn-secondary.disabled, .btn-secondary:disabled {
    background-color: none;
    background-color: rgba(16,22,26,0.67);
}

/* --- Edit & Delete buttons when clicking on a studio, tag or movie --- */
.details-edit {margin-left:3%}

/* --- Adds a text shadow to the statistics on the startpage --- */
.stats .title {
	color:#fff;
	text-shadow: 2px 2px 4px #282828;
}


.popover {
	padding:2px;
	background-color: rgba(5,30,35,0.85); 
	box-shadow: 3px 3px 6px rgba(20, 20, 20, .8);
}
.hover-popover-content {
	background-image: linear-gradient(160deg, rgba(230,255,240,0.80), rgba(120,130,155, 0.45), rgba(180,190,225, 0.45), rgba(120,130,165, 0.55), rgba(255,235,235,0.70)); 
	background-color: rgba(205,210,225,0.31) !important; 
}

.tag-item {
	font: normal 13px "Lucida Grande", sans-serif, Arial, Verdana;
	background-image: linear-gradient(210deg, rgba(30,95,140,0.36), rgba(10,60,95, 0.45), rgba(20,65,105, 0.83), rgba(5,90,140,0.35)); 
	background-color: rgba(60,120,230,0.8); 
	color: #fff;
	letter-spacing: 0.07rem;
	line-height: 18px;
	margin: 3px 3px;
	padding: 6px 8px;
}

/* --- Adjust the lengths of the Performer, Movies and Tags fields while editing a scene while the scene plays --- */
#scene-edit-details .col-sm-9 {
    flex: 0 0 100%;
    max-width: 100%;
}

/* --- Cuts the name of Performers, Movies and Tags short if they go longer than the length of the field --- */
div.react-select__control .react-select__multi-value {
  max-width: 285px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}




/* --- several Performer and Scene Scaping changes --- */
.modal-content, .modal-lg, .modal-xl  {
	max-width: 1400px; 
	width:100%;
} 

.modal-header, .modal-body, .modal-footer {	background: rgba(10,120,170,0.94);}
.performer-create-modal {max-width:1300px;}

.modal-body .col-form-label, .modal-body .col-6, .modal-footer, .modal-header .col-form-label {text-shadow: var(--std-txt-shadow);}

.modal-body .col-6 strong {font-weight: normal; font-size:14px}
.modal-body .no-gutters {margin-bottom: 8px}

.modal-body .dialog-container .col-lg-3 {
	flex: 0 0 12%;
	max-width: 12%;
	text-shadow: var(--std-txt-shadow);
}

.modal-body .dialog-container .offset-lg-3{margin-left:12%;} 
.modal-body .dialog-container .col-lg-9{flex:0 0 88%; max-width:88%;} 


.input-control, .input-control:disabled, .input-control:focus, .modal-body div.react-select__control, .modal-body .form-control {
	background: rgba(15,15,20,0.36);
}


.scraper-table tr:nth-child(2n) {    background: rgba(15,15,20,0.18);}

.nav-pills .nav-link.active, .nav-pills .show>.nav-link { 	background: rgba(15,15,20,0.50);}


.btn-secondary:not(:disabled):not(.disabled).active, 
.btn-secondary:not(:disabled):not(.disabled):active, 
.show>.btn-secondary.dropdown-toggle { 	background: rgba(15,15,20,0.50);}


/* --- Background when searching for a scene in Tagger view --- */
.search-result { 	background: rgba(0,0,0,0.21);}
.selected-result { 	background: rgba(25,95,25,0.24); color:#fff}
/*.search-result:hover { background: rgba(12,62,75,0.25);}*/
.search-result:hover  { 	background: rgba(25,122,25,0.33);}


.markdown table tr:nth-child(2n) {background: rgba(25,20,25,0.20);}
.markdown code, .markdown blockquote, .markdown pre {background: rgba(25,20,25,0.30);}


/* --- Changes the size of the Custom CSS field in the settings --- */
#configuration-tabs-tabpane-interface textarea.text-input { min-width:60ex; max-width:55vw !important; min-height:50ex;}


div.dropdown-menu,div.react-select__menu{background-color:rgba(35,37,44,0.55);color:#f5f8fa}

div.dropdown-menu .dropdown-item, div.dropdown-menu .react-select__option, div.react-select__menu .dropdown-item, div.react-select__menu .react-select__option
{color:#f5f8fa;background-color:rgba(35,37,44,0.55);}

div.dropdown-menu .dropdown-item:focus,div.dropdown-menu .dropdown-item:hover,div.dropdown-menu .react-select__option--is-focused,div.react-select__menu .dropdown-item:focus,div.react-select__menu .dropdown-item:hover,div.react-select__menu .react-select__option--is-focused{background-color:rgba(24,130,195,0.85)}


.toast-container {
    left: 74%;
    top: 1rem;
}

/* --- Settings / About adjustments --- */
#configuration-tabs-tabpane-about .table {width:100%}
#configuration-tabs-tabpane-about .table td {padding-top:18px}


#queue-viewer .current {
    background-color: rgba(15,20,30,0.30);
}

/* Folder when doing selective scan or configuration */
.input-group .form-control {color: #d9f0f7; }


div.modal-body b, .form-label h6 {text-shadow: var(--std-txt-shadow);}


.modal-body .btn-primary:not(:disabled):not(.disabled).active, .modal-body .btn-primary:not(:disabled):not(.disabled):active {
color: #fff; 
     background-color: #008558; 
     border-color: #0d5683;
}

.modal-body .btn-primary {
    color: #fff;
    background-color: #666;
    border-color: #666;
}

.input-group-prepend div.dropdown-menu
{
	background: rgba(50,90,105,0.94);
	padding:15px;
	box-shadow: 2px 2px 6px rgba(0, 0, 0, .70);
}

.saved-filter-list .dropdown-item-container .dropdown-item {margin-top:3px;}
.set-as-default-button {margin-top: 8px;}



/* --- Specific Light Modifications --- */

a.minimal, button.minimal {
	color: #fff;
    	text-shadow: 1px 1px 2px #000;
}

.top-nav a.minimal, .top-nav button.minimal {
	color: #333;
    	text-shadow: 1px 1px 2px #ddd;
}

.top-nav { box-shadow: 2px 2px 6px rgba(120, 150, 160, .55)}


.pagination .btn:last-child {border-right: 1px solid #202b33;}
.pagination .btn:first-child {border-left: 1px solid #202b33;}

.nav-tabs .nav-link { color: #000038;}


.scene-card .card-section {color:#fff;text-shadow: 0px 0px 1px #111;}
.changelog-version, .tab-content {color: #fff}
.tab-content .bg-dark {color:#fff} 

#performer-details-tabpane-details {color: #000}
.scraper-table a {color:#dde}
.image-tabs, .gallery-tabs, .scene-tabs  {
	background-image: linear-gradient(130deg, rgba(60, 70, 85,0.21), rgba(150, 155, 160,0.30), rgba(35, 40, 45,0.22), rgba(160, 160, 165,0.21), rgba(50, 60, 65,0.30)); 
	background-color: rgba(106, 120, 125, .29); 
}

.table-striped.table-bordered, .table-striped.table-bordered a {color:#000}

.nav-tabs .nav-link.active { color: #2866d0;}

.PerformerScrapeModal-list .btn-link { color: #a9d0ff;}

.tab-content .scene-file-info a {color: #cde}

.grid-card .card-check { top:.9rem;width: 1.5rem;}
.LoadingIndicator .spinner-border, .LoadingIndicator-message { color:#37e}


.btn-group>.btn-group:not(:last-child)>.btn, .btn-group>.btn:not(:last-child):not(.dropdown-toggle),
.pagination .btn-group>.btn:first-child:not(.dropdown-toggle) {border-left: 1px solid #394b59;}    
.btn-group>.btn-group:not(:first-child), .btn-group>.btn:not(:first-child) {border-right: 1px solid #394b59;}


div.gallery-card.grid-card.card p div.TruncatedText,
div.movie-card.grid-card.card hr, div.movie-card.grid-card.card p {display:none}


/* --- Spacing out the paginationIndex --- */
.paginationIndex {color:#f3f3f3;margin-bottom:8px}
.paginationIndex .scenes-stats, .images-stats {margin-top:-3px; color:#aaaab9}
.paginationIndex .scenes-stats:before, .images-stats:before
{
	font-size: 16px;
	margin-left:18px;
	margin-right:12px;
	color:#ccc;
	content: "-";
}

/* --- Overhaul of the Popoup Edit Boxes --- */
@media (min-width: 576px) {
	#setting-dialog .modal-content .modal-body textarea {min-height:350px; height:75vh !important}
	.modal-dialog {max-width: 880px}
	.modal-dialog .modal-content .form-group .multi-set {width:82%;margin-top:12px; flex: 0 0 82%; max-width:82%;}
	.modal-dialog .modal-content .form-group .col-9 {flex: 0 0 82%;max-width: 82%;}
	.modal-dialog .modal-content .col-3 {    flex: 0 0 18%; max-width: 18%;}
	.modal-dialog .modal-content .form-group > .form-label {margin-top:0px;flex: 0 0 18%;    max-width: 18%;text-shadow: var(--std-txt-shadow);}
	.modal-dialog .modal-content .form-group {display: flex; flex-wrap: wrap;}
	.modal-dialog .modal-content .btn-group>.btn:not(:first-child), .btn-group>.btn-group:not(:first-child) {margin-left: 2px}
	.modal-dialog .modal-content .form-label[for~="movies"],
	.modal-dialog .modal-content .form-label[for~="tags"],
	.modal-dialog .modal-content .form-label[for~="performers"] {margin-top:48px;}
	.modal-dialog .modal-content .button-group-above {margin-left:9px}
	.modal-dialog .scraper-sources.form-group h5 {margin-top:20px}
	.modal-dialog .modal-content .field-options-table {width:98%}

	.modal-dialog.modal-lg .modal-content .form-group {display: inline;}
}







/* ==============  SETTINGS ==============  */



#settings-container {
	padding-left:230px;
	background-image: none !important;
	background-color: rgba(16, 20, 25, .40) !important;
	box-shadow: 2px 2px 7px rgb(0 0 0 / 75%);
	border-radius: 10px;
	padding-top:25px;
	min-height:450px;
}

#settings-container .card {
	margin-bottom:25px;
	background-image: none !important;
	background-color: rgba(16, 20, 25, .00);
	box-shadow: 0px 0px 0px rgb(0 0 0 / 75%);
	border-radius: 0px;
}

#settings-container .bg-dark {background-color: rgba(16, 20, 25, .12) !important;}

.form-group>.form-group {margin-top:0.5em; margin-bottom: 0.5rem}


#configuration-tabs-tabpane-tasks>.form-group {margin-bottom:2rem; margin-top:1em}

#configuration-tabs-tabpane-tasks h6 {     margin-top:3.5em; font-weight:bold; margin-bottom:1em;  }
#configuration-tabs-tabpane-tasks h5 {     margin-top:2.0em; font-weight:bold; 	letter-spacing: 0.09rem; }

.form-group h4 {margin-top:2em}


#parser-container.mx-auto {max-width:1400px;margin-right:auto !important}
.scene-parser-row .parser-field-title {width: 62ch}



.mx-auto {margin-right: 1% !important}
.mx-auto.card .row .col-md-2 .flex-column { position:fixed;min-height:400px}
.mx-auto.card>.row {min-height:360px}

.loading-indicator {opacity:80%; zoom:2}




/* --- Settings - Tasks ------------------------------------------------------------------------------------- */


#configuration-tabs-tabpane-tasks>.form-group .card {
    padding: 20px;
    margin: 4px 0.40% 14px;
    background-image: none;
    background-color: rgba(16, 20, 25, .00);
    box-shadow: none;
    border-radius: 10px;
}

#tasks-panel h1 {margin-top: 3em}
.setting-section h1, #tasks-panel h1 {font-size: 1.55rem; max-width:180px}


@media (min-width: 576px) and (min-height: 600px) {
#tasks-panel .tasks-panel-queue {
    background: none !important;
    margin-top: -2.6rem;
    padding-bottom: .25rem;
    padding-top: 0rem;
    position: relative;
    top: 0rem;
    z-index: 2;
}
}

#tasks-panel hr {border-top: 0px solid rgba(140,142,160,.38);}
#tasks-panel h1 {margin-top:1.8em;}
#tasks-panel h1 {margin-top:0.8em;}

#configuration-tabs-tabpane-tasks {margin-top:40px}

#configuration-tabs-tabpane-tasks .form-group:last-child .setting-section .setting div:last-child {
    margin-right: 0% !important;
    margin-left: 0px;
    margin-top: 2px;
}

#configuration-tabs-tabpane-tasks .setting-section .sub-heading {margin-bottom:1em}
#configuration-tabs-tabpane-tasks .setting-section .collapsible-section  {margin-bottom:3em}
#configuration-tabs-tabpane-tasks #video-preview-settings  button { width:250px;margin-top:22px;margin-left:-57px}
#configuration-tabs-tabpane-tasks .tasks-panel-tasks .setting-section:nth-child(3) {margin-top:5em}

.tasks-panel-tasks .setting a { color: #ccccd3;}


















@media (min-width: 1000px) {
	#settings-container .card {margin-top:-43px; margin-left:255px}
}



#settings-container .col-form-label {
    padding-top: calc(.55rem);
    padding-bottom: calc(.55rem);
}

.setting-section .setting-group>.setting:not(:first-child), .setting-section .setting-group .collapsible-section .setting {
    margin-left: 4rem; 
}



.setting-section .setting h3 {
    font-size: 1.4rem;
    margin:0.6em 0 0.4em;
    
}

.setting-section:not(:first-child) {margin-top: 1em}
.setting-section .setting-group>.setting:not(:first-child).sub-setting, .setting-section .setting-group .collapsible-section .setting.sub-setting {    padding-left: 3rem;}



@media (min-width: 1200px) {
	.offset-xl-2 {
		max-width:1250px;
		margin-left:15%;
		margin-right:auto;
	}

	#settings-container .tab-content, .mx-auto {	max-width: none;}
}


.setting-section .setting:not(:last-child) {
    border-bottom: 0px solid #000;
}




.job-table.card {
	margin-top:-32px !important;
	background-color: rgba(16, 20, 25, .20) !important;
	border-radius: 10px !important;
}






.custom-switch {padding-left:2.25rem}
.custom-control {
    min-height: 1.5rem;
    padding-left: 0.5rem;
    margin-right:1em;
}

.custom-control-input:checked~.custom-control-label:before {
    color: rgb(0 0 0 / 0%);
    border-color: rgb(0 0 0 / 0%);
    background-color: rgb(0 0 0 / 0%);
}

.custom-switch .custom-control-label:before {
    pointer-events: auto;
    border-radius: 0;
}

.custom-switch .custom-control-input:checked~.custom-control-label:after {
    background-color: blue;
    transform: auto;
}

.custom-switch .custom-control-label:after {
    top: auto;
    left: auto;
    width: auto;
    height: auto;
    background-color: blue;
    border-radius: 0;
    transform: none;
    transition: none;
}

.custom-control-label:before {display:none} 

.custom-control-input {
	position: absolute;
	top:2px;
	left: 0;
	z-index: -1;
	width: 1.2rem;
	height: 1.35rem;
     opacity: 1;
     background-color:#10659a;
     color:#10659a;
}




.setting-section .setting-group>.setting:not(:first-child), .setting-section .setting-group .collapsible-section .setting {
	padding-bottom: 3px;
	padding-top: 4px;
	margin-right: 0rem;
}

.setting-section {margin-bottom:0.8em}




.setting-section .sub-heading {
	font-size:.9rem;
	margin-top:0.5rem;
	margin-bottom:3rem;
}

@media (min-width: 768px) {
.offset-md-3 {margin-left: 1%;}
#settings-menu-container {margin-left:1%; z-index:9; width:200px; padding-top:25px;}

	#configuration-tabs-tabpane-interface .setting-section:first-child .card  .setting div:nth-child(2) { width:64%;min-width:300px;padding-top:6px}
	#configuration-tabs-tabpane-interface .setting-section:first-child .card .setting div .sub-heading {margin-top:-28px; margin-left:255px;width:700px}
	#language .input-control { width:250px}
	
	#configuration-tabs-tabpane-interface .setting-section .setting-group>.setting:not(:first-child) {margin-left:275px}
	#configuration-tabs-tabpane-interface .setting-section .setting-group>.setting:nth-child(2) {margin-top: -40px}
}

@media (min-width: 1200px) {
	.offset-md-3 {margin-left: 14%;margin-right:2%}
	.setting-section h1, #tasks-panel h1 { max-width:220px;}
	#settings-menu-container {
		padding-top:25px;
		margin-left:14% !important;
		z-index:9;
		width:205px;
	}
}

@media (max-width: 768px) {
	.offset-md-3 {margin-left: 1%;}
	#settings-menu-container {margin-left:1%; z-index:9;width:180px;	padding-top:25px;}
	#settings-container {    padding-left: 180px;}
	.setting-section h1, #tasks-panel h1 { max-width:300px;}
}

@media (max-width: 576px) {
	.offset-sm-3 {margin-left: 1%;}
	#settings-menu-container {margin-left:1%;z-index:9;width:160px;	padding-top:25px;}
	#settings-container {padding-left: 10px;}
}

@media (max-width: 1004px) {
	.setting-section h1, #tasks-panel h1 { max-width:400px;}
	.job-table.card {margin-top:2px !important;}
}




.markdown table tr:nth-child(2n),
.modal-body .nav-link:hover,
#settings-menu-container .nav-link:hover {background-color: rgba(10, 20, 20, .15)}



@media (min-width: 1000px) {
	#settings-container #configuration-tabs-tabpane-interface .setting-section > .setting { padding: 15px 0px;}
	#settings-container #configuration-tabs-tabpane-interface .setting-section .setting-group .setting>div:first-item{margin-left: 4% !important;}	
	
	#settings-container #stash-table {margin-top:25px}
	#configuration-tabs-tabpane-interface .setting-section:first-child .card {	margin-top: -5px;	margin-left: -1%}		

	#language .input-control { width:250px}
	#configuration-tabs-tabpane-interface .setting-section:first-child h3 {    font-size: 1.55rem;}

	#configuration-tabs-tabpane-interface .setting-section:first-child .card > .setting div:nth-child(1) { width:255px}


	#configuration-tabs-tabpane-interface .setting-section:first-child .card  .setting div:nth-child(2) { width:68%;padding-top:6px}
	#configuration-tabs-tabpane-interface .setting-section:first-child .card .setting div .sub-heading {margin-top:-28px; margin-left:255px;width:700px}

	#configuration-tabs-tabpane-interface #language {margin-bottom:15px}
	#configuration-tabs-tabpane-library #stashes .sub-heading {margin-top:-26px; margin-left:235px;width:700px}
	
}



#configuration-tabs-tabpane-metadata-providers .setting,
#configuration-tabs-tabpane-security .setting,
#configuration-tabs-tabpane-tasks .setting,
#configuration-tabs-tabpane-system .setting-section .setting,
#settings-dlna .setting-section .setting,
#configuration-tabs-tabpane-interface .setting-section .setting {padding-top:0; padding-bottom:0}


#configuration-tabs-tabpane-interface .setting-section:nth-child(1) h1 {display:none}

#configuration-tabs-tabpane-interface .setting-section .setting-group>.setting:not(:first-child) h3 {
    font-size: 1rem;
    margin-left:2em;
}

#configuration-tabs-tabpane-interface .setting-section .setting-group .setting>div:last-child {
    margin-right: 95% !important;
    margin-left:0px;
    margin-top:-32px;
}

.setting-section .setting>div:first-child {max-width:415px}

#configuration-tabs-tabpane-interface .setting-section .setting>div:last-child {
    min-width: 20px;
    text-align: left;
    width:38%;
    
}

#configuration-tabs-tabpane-interface h3 {font-size:1.25em}

#wall-preview .input-control {width:160px}

.setting-section .setting-group>.setting:not(:first-child), .setting-section .setting-group .collapsible-section .setting {
    padding-top: 0px;
    padding-bottom: 0px;
    margin-right: 0rem;
    line-height:100%;
    margin-top:-3px;
    margin-bottom:-4px;
}

#configuration-tabs-tabpane-interface .setting-section:nth-child(7) .setting {margin-left:15px !important}
#configuration-tabs-tabpane-interface .setting-section:nth-child(7) .setting:nth-child(1) {margin-left: 0px !important;}


#settings-dlna h5 {margin-bottom:70px}
#settings-dlna .form-group h5{margin-left:255px;margin-top:-30px}

#configuration-tabs-tabpane-metadata-providers #stash-boxes .sub-heading {margin-top:-28px; margin-left:235px;width:700px;font-size:14px}

.scraper-table tr:nth-child(2n) {background-color: rgba(16, 20, 25, .12)}



/* Library */

.stash-row .col-md-2 {padding-left:4%}
#configuration-tabs-tabpane-library .setting-section .setting {padding:0}



#configuration-tabs-tabpane-security .setting-section,
#configuration-tabs-tabpane-tasks .setting-section,
#configuration-tabs-tabpane-tasks .setting-group{max-width:915px}

#configuration-tabs-tabpane-logs .setting-section,
#configuration-tabs-tabpane-metadata-providers .setting-section,
#configuration-tabs-tabpane-services .setting-section,
#configuration-tabs-tabpane-system  .setting-section,
#configuration-tabs-tabpane-library .setting-section:not(:first-child),
#configuration-tabs-tabpane-interface .setting-section {max-width:810px}

#configuration-tabs-tabpane-security .setting-section .setting>div:last-child,
#configuration-tabs-tabpane-metadata-providers .setting-section .setting>div:last-child,
#configuration-tabs-tabpane-services .setting-section .setting>div:last-child,
#configuration-tabs-tabpane-system .setting-section .setting>div:last-child,
#configuration-tabs-tabpane-library .setting-section .setting>div:last-child,
#configuration-tabs-tabpane-interface .setting-section .setting>div:last-child,
#configuration-tabs-tabpane-tasks .setting-section .setting>div:last-child {
    min-width: 20px;
    text-align: right;
    width:auto;
    
}

#configuration-tabs-tabpane-tasks .setting-section .collapsible-section .setting div:last-child {
    margin-right: 95% !important;
    margin-left: -12px;
    margin-top: -15px;
}


#configuration-tabs-tabpane-system .setting-section .sub-heading {margin-bottom: 1.2rem}
`;
// Themes CSS End

// Themes CSS Begin
const roundedYellow = `
:root{
    --bgcol: #101118;
    --searchbgcol: #1b1c28;
    --btnbordercol: #202b33;
    --secbtncol: #171822;
    --btnaccentcol: #cfad0b;
    --cardbgcol: #1f282c;
    --navbarcol: #212529;
  }
  
  body {
    background-color: var(--bgcol);
  }
  
  .bg-secondary {
    background-color: var(--searchbgcol)!important;
  }
  
  .pagination .btn:first-child {border-left: 1px solid var(--btnbordercol);}
  .pagination .btn:last-child {border-right: 1px solid var(--btnbordercol);}
  
  .btn-secondary {
    border-color: var(--btnbordercol);
    background-color: var(--bgcol);
  }
  
  .btn-secondary:disabled {
    border-color: var(--btnbordercol);
    background-color: var(--secbtncol);
  }
  
  .btn-secondary:not(:disabled):not(.disabled):active, .btn-secondary:not(:disabled):not(.disabled).active, .show>.btn-secondary.dropdown-toggle {
    background-color: var(--secbtncol);
    border: 1px solid var(--btnbordercol);
    color: var(--btnaccentcol);
    border-bottom: 3px solid var(--btnaccentcol);
  }
  
  .card {
    background-color: var(--cardbgcol);
    border-radius: 30px;
  }
  
  .progress-indicator {
    background-color: var(--btnaccentcol);
  }
  
  .bg-dark{
    background-color: var(--navbarcol)!important;
  }
  
  .btn.active:not(.disabled), .btn.active.minimal:not(.disabled) {
    background-color: transparent;
    color: var(--btnaccentcol);
    border-bottom: 3px solid var(--btnaccentcol);
  }
  
  .btn-primary{
    background-color: var(--btnaccentcol);
    border-color: var(--btnaccentcol);
  }
  
  .btn-primary:not(:disabled):not(.disabled):active, .btn-primary:not(:disabled):not(.disabled).active, .show>.btn-primary.dropdown-toggle {
    background-color: transparent;
    border-color: var(--btnaccentcol);
  }
  
  .btn-primary:not(:disabled):not(.disabled):active:focus, .btn-primary:not(:disabled):not(.disabled).active:focus, .show>.btn-primary.dropdown-toggle:focus {
      box-shadow: 0 0 0 0;
  }
  
  .btn-primary:focus, .btn-primary.focus {
      background-color: var(--btnaccentcol);
      border-color: var(--btnaccentcol);
      box-shadow: 0 0 0 0;
  }
  
  .btn-primary:hover {
      color: #fff;
      background-color: var(--btnaccentcol);
      border-color: var(--btnaccentcol);
  }
  
  div.react-select__menu, div.dropdown-menu {
      background-color: var(--bgcol);
      color: #f5f8fa;
      z-index: 1600;
  }
  
  .modal-header, .modal-body, .modal-footer {
      background-color: var(--bgcol);
      color: #f5f8fa;
  }
  
  .edit-filter-dialog .criterion-list .card .filter-item-header:focus {
      border-color: var(--btnaccentcol);
      border-radius: calc(.375rem - 1px);
      box-shadow: inset 0 0 0 0.1rem var(--btnaccentcol);
      outline: 0;
  }
  
  .nav-tabs .nav-link.active {
      border-bottom: 2px solid;
      color: var(--btnaccentcol);
  }
  
  .nav-tabs .nav-link.active:hover {
      border-bottom-color: var(--btnaccentcol);
      cursor: default;
  }
  
  .job-table.card {
      background-color: var(--bgcol);
      height: 10em;
      margin-bottom: 30px;
      overflow-y: auto;
      padding: .5rem 15px;
  }
  
  .progress-bar {
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
      color: #fff;
      text-align: center;
      white-space: nowrap;
      background-color: var(--btnaccentcol);
      transition: width .6s ease;
  }
  
  .grid-card .progress-bar {
      background-color: rgba(115,133,159,.5);
      bottom: 5px;
      display: block;
      height: 5px;
      position: absolute;
      width: 100%;
  }
  
  .grid-card .progress-indicator {
      background-color: var(--btnaccentcol);
      height: 5px;
  }
  
  .hover-scrubber .hover-scrubber-indicator .hover-scrubber-indicator-marker {
      background-color: var(--btnaccentcol);
      bottom: 0;
      height: 5px;
      position: absolute;
  }
  
  #tasks-panel .tasks-panel-queue {
      background-color: var(--bgcol);
      margin-top: -1rem;
      padding-bottom: .25rem;
      padding-top: 1rem;
      position: sticky;
      top: 3rem;
      z-index: 2;
  }
  
  #scene-edit-details .edit-buttons-container {
      background-color: var(--bgcol);
      position: sticky;
      top: 0;
      z-index: 3;
  }
`;
// Themes CSS End

// Global CSS Begin
const nsfw = `
/* [Global changes] Blur NSFW images */

.scene-card-preview-video,
.scene-card-preview-image,
.image-card-preview-image,
.image-thumbnail,
.gallery-card-image,
.performer-card-image,
img.performer,
.movie-card-image,
.gallery .flexbin img,
.wall-item-media,
.scene-studio-overlay .image-thumbnail,
.image-card-preview-image,
#scene-details-container .text-input,
#scene-details-container .scene-header,
#scene-details-container .react-select__single-value,
.scene-details .pre,
#scene-tabs-tabpane-scene-file-info-panel span.col-8.text-truncate > a,
.gallery .flexbin img,
.movie-details .logo {
 filter: blur(8px);
}

.scene-card-video {
 filter: blur(13px);
}

.jw-video,
.jw-preview,
.jw-flag-floating,
.image-container,
.studio-logo,
.scene-cover {
 filter: blur(20px);
}

.movie-card .text-truncate,
.scene-card .card-section {
 filter: blur(4px);
}
`;
// Global CSS End

// Global CSS Begin
const nsfwMouse = `
/* Author: fl0w#9497 */
/* [Global changes] Blur NSFW images and unblur on mouse over */
/* === MORE BLUR === */
/* scene */
.scene-card-preview,
.vjs-poster,
video,
.scene-cover,
.scrubber-item,

/* image */
.image-card-preview,
.image-image,
.gallery-image,

/* movie */
.movie-card-image,
.movie-images,

/* gallery */
.gallery-card-image,
table > tbody > tr > td > a > img.w-100,

/* performer */
.performer-card-image,
img.performer,

/* studio */
.studio-card-image,

/* tag */
.tag-card-image

{
 filter: blur(30px);
}

/* === LESS BLUR === */
/* common */
.card-section-title,

/* scene */
.scene-studio-overlay,
.scene-header > h3,
h3.scene-header,
.studio-logo,
.image-thumbnail,

/* image */
h3.image-header,

/* movie */
.movie-details > div > h2,

/* gallery */
h3.gallery-header,

/* studio */
.studio-details .logo,
.studio-details > div > h2,

/* tag */
.logo-container > .logo,
.logo-container > h2

{
 filter: blur(2px);
}

/* === UNBLUR ON HOVER === */
/* common */
.thumbnail-section:hover *,
.card:hover .card-section-title,

/* scene */
.card:hover .scene-studio-overlay,
.video-js:hover .vjs-poster,
video:hover,
.scene-header:hover > h3,
div:hover > .scene-header,
.studio-logo:hover,
.scene-cover:hover,
.image-thumbnail:hover,
.scene-card-preview:hover,
.scrubber-item:hover,

/* image */
.image-image:hover,
div:hover > .image-header,
.gallery-image:hover,

/* movie */
.movie-images:hover,
.movie-details > div > h2:hover,

/* gallery */
div:hover > .gallery-header,
table > tbody > tr > td:hover > a > img.w-100,

/* performer */
img.performer:hover,

/* studio */ 
.studio-details .logo:hover,
.studio-details:hover > div > h2,

/* tag */
.logo-container > .logo:hover,
.logo-container:hover > h2
{
 filter: blur(0px);
}
`;
// Global CSS End

// Global CSS Begin
const hideZeroCountBadges = `
/* [Global changes] Hide 0 count badges */
span.badge[data-value="0"] {
    display: none;
}
`;
// Global CSS End

// Global CSS Begin
const hideDontateButton = `
/* [Global changes] Hide the Donate button */

.btn-primary.btn.donate.minimal {
    display: none;
  }
`;
// Global CSS End

// Global CSS Begin
const stickyToolbar = `
/* [Global changes] Make the Toolbar Sticky v 0.1*/

.justify-content-center.btn-toolbar {
    position: sticky;
    top: 40px;
    z-index: 100;
    background-color: #202b33;
    padding: 12px;
    padding-bottom: 1px;
  }
`;
// Global CSS End

// Galleries CSS Begin
const gridView = `
/* [Galleries tab] Grid view for galleries */

.col.col-sm-6.mx-auto.table .d-none.d-sm-block {
    display: none !important;
}
.col.col-sm-6.mx-auto.table .w-100.w-sm-auto {
    width: 175px !important;
    background-color: rgba(0, 0, 0, .45);
    box-shadow: 0 0 2px rgba(0, 0, 0, .35);
}
.col.col-sm-6.mx-auto.table tr {
    display: inline-table;
}
`;
// Galleries CSS End

// Images CSS Begin
const disableLightBox = `
/* [Images tab] Disable lightbox animation */

.Lightbox-carousel {
    transition: none;
  }
`;
// Images CSS End

// Images CSS Begin
const dontCrop = `
/* [Images tab] Don't crop preview thumbnails */

.flexbin > * > img {
    object-fit: inherit;
    max-width: none;
    min-width: initial;
  }
`;
// Images CSS End

// Movies CSS Begin
const betterLayoutRegular = `
/* [Movies tab] Better Movie layout for desktops: Regular size poster */

.movie-details.mb-3.col.col-xl-4.col-lg-6 {
    flex-basis: 70%
  }
  .col-xl-8.col-lg-6{
    flex-basis: 30% 
  }
  .movie-images{
    flex-wrap: wrap
  }
  .movie-image-container {
    flex: 0 0 500px
  }
`;
// Movies CSS End

// Movies CSS Begin
const betterLayoutLarger = `
/* [Movies tab] Better Movie layout for desktops: Larger size poster */

.movie-details.mb-3.col.col-xl-4.col-lg-6 {
    flex-basis: 70%
  }
  .col-xl-8.col-lg-6{
    flex-basis: 30% 
  }
  .movie-images{
    flex-direction: column;
    flex-wrap: wrap
  }
  .movie-image-container {
    flex: 1 1 700px
  }
`;
// Movies CSS End

// Performers CSS Begin
const performerEditSecondPosition = `
/* [Performers tab] Move the tags row in the Performer's edit panel to the second position (just after name).  */

form#performer-edit {
    display: flex;
    flex-direction: column;
}
#performer-edit > .row:nth-child(21) {
    order: -1;
}
#performer-edit > .row:first-child {
    order: -2;
}
`;
// Performers CSS End

// Performers CSS Begin
const performerImageBackground = `
/* [Performers tab] Place performer image in the background on performer page */

.performer-image-container.col-md-4.text-center {
    flex: 0 0 0%;
    max-width: 0%;
}

#performer-page .performer-image-container .btn.btn-link {
    position: fixed;
    width: 100%;
    top: 0;
    left: 0;
    padding: 0;
}

#performer-page .performer-image-container .btn.btn-link:before {
    content: '';
    position:absolute;
    top:0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to left, rgba(0,0,0,0) 0%,rgb(0 0 0 / 75%) 100%);
    z-index: 1;
}

#performer-page .performer-image-container .performer {
    max-height: none;
    max-width: none;
    width: 100%;
}
`;
// Performers CSS End

// Performers CSS Begin
const showEntirePerformerImage = `
/* [Performers tab] Show entire performer image in performer card */

.performer.image {
    background-size: contain !important;
  }
`;
// Performers CSS End

// Performers CSS Begin
const performerPageLarger = `
/* [Performers tab] Show a larger image in performer's page for desktop */
.performer-image-container{
    flex: 0 0 50%;
    max-width: 50%;
  }
  /* Changing .col-md-8 settings also affects studios and tags display. 50% should be good enough. */
  .col-md-8 {
    flex: 0 0 50%;
    max-width: 50%;
  }
`;
// Performers CSS End

// Performers CSS Begin
const performerPageLargerList = `
/* [Performers tab] Show larger performer images in performers list. */
/* original value: height: 30rem; min-width:13.25rem; */
.performer-card-image{
    height: 45rem;
    min-width: 20rem;
  }
`;
// Performers CSS End

// Scenes CSS Begin
const hideSceneScrubber = `
/* [Scenes tab] Hide the scene scrubber and max out the player's height */

.scrubber-wrapper {
    display: none;
  }
`;
// Scenes CSS End

// Scenes CSS Begin
const hideSceneSpecs = `
/* [Scenes tab] Hide scene specs (resolution, duration) from scene card */

.scene-specs-overlay {
    display: none;
  }
`;
// Scenes CSS End

// Scenes CSS Begin
const hideStudioLogo = `
/* [Scenes tab] Hide studio logo/text from scene card */

.scene-studio-overlay {
    display: none;
  }
`;
// Scenes CSS End

// Scenes CSS Begin
const hideTruncatedText = `
/*This will hide the truncated text that appears under the tile and date. */
/* [Scenes Tab] - Hide the truncated text on scene card */

.TruncatedText.scene-card__description { 
    display: none;
 }
`;
// Scenes CSS End

// Scenes CSS Begin
const moreThumbsRow = `
/* [Scenes tab] Fit more thumbnails on each row */

.grid { padding: 0px !important; }
`;
// Scenes CSS End

// Scenes CSS Begin
const longerStringStudio = `
/* [Scenes tab] Allow for longer string when displaying "Studio as Text" on scene thumbnails */

.scene-studio-overlay {
	font-weight: 600 !important;
	opacity: 1 !important;
	width: 60% !important;
	text-overflow: ellipsis !important;
}
`;
// Scenes CSS End

// Scenes CSS Begin
const showExtraInfo = `
.extra-scene-info {
    display: inline;
   }
   .file-path {
    display: block;
   }
`;
// Scenes CSS End

// Scenes CSS Begin
const swapStudioRezDuration = `
/* [Scenes tab] Swap studio and resolution/duration positions */

.scene-studio-overlay {
    bottom: 1rem;
    right: 0.7rem;
    height: inherit;
    top: inherit;
  }
  
  .scene-specs-overlay {
    right: 0.7rem;
    top: 0.7rem;
    bottom: inherit;
  }
`;
// Scenes CSS End

// Scenes CSS Begin
const tagsListLessWidth = `
/* [Scenes tab] Make the list of tags take up less width */

.bs-popover-bottom {
    max-width: 500px
  }
`;
// Scenes CSS End

// Scenes CSS Begin
const adjustMouseWallMode = `
/* [Scenes tab] Adjust the mouse over behaviour in wall mode */

@media (min-width: 576px) {
    .wall-item:hover::before {
      opacity: 0;  
    }
   
    .wall-item:hover .wall-item-container {
      transform: scale(1.5);
    }
   }
`;
// Scenes CSS End

// Scenes CSS Begin
const disableZoomWallMode = `
/* [Scenes tab] Disable zoom on hover in wall mode */

.wall-item:hover .wall-item-container {
    transform: none;
}
.wall-item:before {
    opacity: 0 !important;
}
`;
// Scenes CSS End

// Studios CSS Begin
const differentStudioCardsLayout = `
/* Author: Qx#1573 */
/* [Studios tab] Changes the layout of studio cards */
.studio-card.grid-card.card div.card-section div.rating-banner { display: none; }
.slick-slide .studio-card-image { height: 300px; }
 
.studio-card, .recommendation-row .studio-card {
    padding: 0;
    width: 500px;
    height: 300px;
}
 
.studio-card-image, .recommendation-row .studio-card .studio-card-image {
    max-height: 300px;
    width: 500px;
}
 
.studio-card.grid-card.card div.card-section {
    position: absolute;
    bottom: 0em;
    width: inherit;
    background-color: rgba(0, 0, 0, 0.7);
    overflow: hidden;
    height: 2.5em;
    transition: 0.5s ease-in-out;
}
 
.studio-card.grid-card.card div.card-section:hover {
    height: 7em;
}
`;
// Studios CSS End

// Studios CSS Begin
const moreStudiosRow = `
/* [Studios tab] Show more item per row - Author hijack_hornet */
:not(.recommendation-row .studio-card).studio-card {
    width: 15%
}
:not(.recommendation-row .studio-card-image).studio-card-image {
    width: 100%
}
.studio-card h5 {
    text-align: center !important;
    display: block;
}
`;
// Studios CSS End

// Tags CSS Begin
const alternativeTagLayout = `
/*Tag layout changes - Author hijack_hornet */
.tag-card {
	width: 16rem;
	padding: 0;
}

.tag-card .card-section {
	height: 2.5rem;
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	background: #0000007a;
	line-height: none;
}
.tag-card .card-section .TruncatedText {
	-webkit-line-clamp: 1 !important;
}
.tag-card h1,
h2,
h3,
h4,
h5,
h6,
.h1,
.h2,
.h3,
.h4,
.h5,
.h6 {
	line-height: normal;
}
.tag-card hr,
.tag-description {
	display: none;
}
.tag-card .btn-group {
	position: absolute;
	width: 100%;
	bottom: 2.5rem;
	margin-bottom: 0;
	opacity: 0;
	transition: ease 0.2s;
}
.tag-card .btn-group:hover {
	opacity: 1;
	transition: ease 0.2s;
	background: #0000007a;
}

.tag-card-image {
	object-fit: cover;
	object-position: center;
}

.zoom-0 .tag-card-image {
	max-height: none;
	height: 16rem;
	width: 12rem;
}

.zoom-1 .tag-card-image {
	max-height: none;
	height: 20rem;
	width: 15rem;
}

.zoom-2 .tag-card-image {
	max-height: none;
	height: 24rem;
	width: 18rem;
}

.zoom-3 .tag-card-image {
	max-height: none;
	height: 28rem;
	width: 21rem;
}

.zoom-0.tag-card,
.zoom-1.tag-card,
.zoom-2.tag-card,
.zoom-3.tag-card {
	width: initial;
}

.tag-card .card-section > a {
	position: absolute;
	width: 100%;
	height: 100%;
	display: block;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	padding: 7px 14px 0px 14px;
}
.tag-card .card-section .tag-sub-tags {
	position: relative;
	margin-top: 2rem;
	z-index: 1;
}
.tag-sub-tags {
	font-size: 0;
}
.tag-parent-tags {
	display: none;
}
`;
// Tags CSS End

// Tags CSS Begin
const differentTagCards = `
/* Author: Qx#1573 */
/* [Tags changes] changes the layout of tag cards on tags page and hover */
.tag-parent-tags, .tag-sub-tags { display: none;}
.tag-card.zoom-0.grid-card.card div.card-section div.card-popovers.btn-group { margin-top: 1em; }
.tag-card.zoom-0.grid-card.card div.thumbnail-section a.tag-card-header img.tag-card-image { object-fit: cover; }
.tag-card.zoom-0.grid-card.card div.card-section hr { display: none; }
 
.tag-card.zoom-0.grid-card.card {
    padding: 0;
    width: 300px;
    height: 180px;
}
 
.tag-card.zoom-0.grid-card.card div.card-section {
    position: absolute;
    text-shadow: 2px 2px 2px #000;
    width: 100%;
    background-color: rgba(0, 0, 0, 0.3);
    height: 3em;
    overflow: hidden;
    transition: 0.8s ease-in-out;
}
 
.tag-card.zoom-0.grid-card.card div.card-section a {
    text-decoration: none;
}
 
.tag-card.zoom-0.grid-card.card div.card-section:hover {
    height: 22em;
}
 
.tag-card.zoom-0.grid-card.card 
    div.card-section a 
    h5.card-section-title.flex-aligned 
    div.TruncatedText {
    white-space: nowrap;
    text-overflow: ellipsis;
    width: 300px;
    overflow: hidden;
    display: block;
}
 
.tag-card.zoom-0.grid-card.card div.card-section div.TruncatedText.tag-description {
    position: relative;
    top: 0.5em;
    -webkit-text-stroke-width: 1px;
    font-size: 16px;
}
 
.tag-card .card-popovers .btn {
    text-shadow: 1px 1px 1px #000;
    stroke: black;
    stroke-width: 15;
}
`;
// Tags CSS End

// Tags CSS Begin
const hideTagImages = `
/* Author: Echoman */
/* [Tags Images] Hides The tag images in Tags view and HR */
.tag-card-image { display: none !important;}

.tag-card > hr { display: none !important;}

.card {padding: 10px !important;}

.card-popovers { margin-bottom: 0px !important;}

.tag-card { padding: 0px !important;}
`;
// Tags CSS End

// Tags CSS Begin
const subTagExolorer = `
/*Tag layout changes - Author hijack_hornet */
.tag-card {
	width: 16rem;
	padding: 0;
}

.tag-card .card-section {
	height: 2.5rem;
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	background: #0000007a;
	line-height: none;
}
.tag-card .card-section .TruncatedText {
	-webkit-line-clamp: 1 !important;
}
.tag-card h1,
h2,
h3,
h4,
h5,
h6,
.h1,
.h2,
.h3,
.h4,
.h5,
.h6 {
	line-height: normal;
}
.tag-card hr,
.tag-description {
	display: none;
}
.tag-card .btn-group {
	position: absolute;
	width: 100%;
	bottom: 2.5rem;
	margin-bottom: 0;
	opacity: 0;
	transition: ease 0.2s;
}
.tag-card .btn-group:hover {
	opacity: 1;
	transition: ease 0.2s;
	background: #0000007a;
}

.tag-card-image {
	object-fit: cover;
	object-position: center;
}

.zoom-0 .tag-card-image {
	max-height: none;
	height: 16rem;
	width: 12rem;
}

.zoom-1 .tag-card-image {
	max-height: none;
	height: 20rem;
	width: 15rem;
}

.zoom-2 .tag-card-image {
	max-height: none;
	height: 24rem;
	width: 18rem;
}

.zoom-3 .tag-card-image {
	max-height: none;
	height: 28rem;
	width: 21rem;
}

.zoom-0.tag-card,
.zoom-1.tag-card,
.zoom-2.tag-card,
.zoom-3.tag-card {
	width: initial;
}

.tag-card .card-section > a {
	position: absolute;
	width: 100%;
	height: 100%;
	display: block;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	padding: 7px 14px 0px 14px;
}
.tag-card .card-section .tag-sub-tags {
	position: relative;
	margin-top: 2rem;
	z-index: 1;
}
.tag-sub-tags {
	font-size: 0;
}
.tag-parent-tags {
	display: none;
}
/*Tag subtag exploration snipset*/
.tag-card .card-section > a {
	cursor: default;
	pointer-events: none;
}
.tag-card .card-section > hr {
	margin-top: 2rem;
}
.tag-card .card-section .tag-sub-tags {
	position: absolute !important;
	margin-top: 0 !important;
	width: 100%;
	height: 100%;
	display: block;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	padding: 0;
}
.tag-sub-tags::before {
	content: "";
	display: block;
	background: url("https://img.icons8.com/material-outlined/24/137cbd/connection-status-off.png")
		no-repeat;
	background-size: 1.5rem 1.5rem;
	width: 1.5rem;
	height: 1.5rem;
	float: right;
	margin: 0.5rem 0.5rem 0 0;
}
.tag-sub-tags > a {
	width: 100%;
	height: 100%;
	display: block;
}

.tag-card .btn-group a {
	z-index: 10;
}
.tag-sub-tags {
	font-size: 0;
}
.tag-parent-tags {
	display: none;
}
`;
// Tags CSS End

const themeSwitchCSS = {
  Themes: {
    1: {
      displayName: "Default",
      styles: null,
      key: "themeSwitchPlugin-theme-default",
      version: null,
    },
    2: {
      displayName: "Black Hole",
      styles: blackHole,
      key: "themeSwitchPlugin-theme-blackHole",
      version: "2.0",
    },
    3: {
      displayName: "Glassy",
      styles: glassy,
      key: "themeSwitchPlugin-theme-glassy",
      version: "0.7.4",
    },
    4: {
      displayName: "Material-ize",
      styles: materialize,
      key: "themeSwitchPlugin-theme-materialize",
      version: null,
    },
    5: {
      displayName: "Modern Dark",
      styles: modernDark,
      key: "themeSwitchPlugin-theme-modernDark",
      version: "1.2",
    },
    6: {
      displayName: "Neon Dark",
      styles: neonDark,
      key: "themeSwitchPlugin-theme-neonDark",
      version: null,
    },
    7: {
      displayName: "Night",
      styles: night,
      key: "themeSwitchPlugin-theme-night",
      version: 0.1,
    },
    8: {
      displayName: "Plex",
      styles: plex,
      key: "themeSwitchPlugin-theme-plex",
      version: "1.0.3",
    },
    9: {
      displayName: "Plex Better Styles",
      styles: plexBetterStyles,
      key: "themeSwitchPlugin-theme-plexBetterStyles",
      version: "1.0-4ffb275",
    },
    10: {
      displayName: "Pornhub",
      styles: pornHub,
      key: "themeSwitchPlugin-theme-pornHub",
    },
    11: {
      displayName: "Pulsar",
      styles: pulsar,
      key: "themeSwitchPlugin-theme-pulsar",
      version: "1.8.1",
    },
    12: {
      displayName: "Pulsar Light",
      styles: pulsarLight,
      key: "themeSwitchPlugin-theme-pulsarLight",
      version: "0.3.1",
    },
    13: {
      displayName: "Rounded Yellow",
      styles: roundedYellow,
      key: "themeSwitchPlugin-theme-roundedYellow",
      version: null,
    },
  },
  Global: {
    1: {
      displayName: "NSFW",
      styles: nsfw,
      key: "themeSwitchPlugin-global-nsfw",
      version: null,
    },
    2: {
      displayName: "NSFW, unblur on mouse over",
      styles: nsfwMouse,
      key: "themeSwitchPlugin-global-nsfwMouse",
      version: null,
    },
    3: {
      displayName: "Hide 0 count badges",
      styles: hideZeroCountBadges,
      key: "themeSwitchPlugin-global-hideZeroCountBadges",
      version: null,
    },
    4: {
      displayName: "Hide Donate Button",
      styles: hideDontateButton,
      key: "themeSwitchPlugin-global-hideDontateButton",
      version: null,
    },
    5: {
      displayName: "Sticky Toolbar",
      styles: stickyToolbar,
      key: "themeSwitchPlugin-global-stickyToolbar",
      version: "0.1",
    },
  },
  Navigation: {
    1: {
      displayName: "Change Order of Nav Items",
      styles: null,
      key: "themeSwitchPlugin-menu-changeOrderOfNavButtons",
      version: null,
      hasSwitch: false,
    },
  },
  Galleries: {
    1: {
      displayName: "Grid View",
      styles: gridView,
      key: "themeSwitchPlugin-galleries-gridView",
      version: null,
    },
  },
  Images: {
    1: {
      displayName: "Disable Lightbox Annimation",
      styles: disableLightBox,
      key: "themeSwitchPlugin-images-disableLightBox",
      version: null,
    },
    2: {
      displayName: "Don't crop preview thumbnails",
      styles: dontCrop,
      key: "themeSwitchPlugin-images-dontCrop",
      version: null,
    },
  },
  Movies: {
    1: {
      displayName: "Better layout for desktops: Regular",
      styles: betterLayoutRegular,
      key: "themeSwitchPlugin-images-betterLayoutRegular",
      version: null,
    },
    2: {
      displayName: "Better layout for desktops: Larger",
      styles: betterLayoutLarger,
      key: "themeSwitchPlugin-images-betterLayoutLarger",
      version: null,
    },
  },
  Performers: {
    1: {
      displayName: "Move the tags row in performer edit panel: second position",
      styles: performerEditSecondPosition,
      key: "themeSwitchPlugin-performers-performerEditSecondPosition",
      version: null,
    },
    2: {
      displayName: "Place performer image in the background on performer page.",
      styles: performerImageBackground,
      key: "themeSwitchPlugin-performers-performerImageBackground",
      version: null,
    },
    3: {
      displayName: "Show entire performer image in performer card",
      styles: showEntirePerformerImage,
      key: "themeSwitchPlugin-performers-showEntirePerformerImage",
      version: null,
    },
    4: {
      displayName: "Show a larger image in performer's page for desktop",
      styles: performerPageLarger,
      key: "themeSwitchPlugin-performers-performerPageLarger",
      version: null,
    },
    5: {
      displayName: "Show larger performer images in performers list",
      styles: performerPageLargerList,
      key: "themeSwitchPlugin-performers-performerPageLargerList",
      version: null,
    },
  },
  Scenes: {
    1: {
      displayName: "Hide the scene scrubber",
      styles: hideSceneScrubber,
      key: "themeSwitchPlugin-scenes-hideSceneScrubber",
      version: null,
    },
    2: {
      displayName: "Hide scene specs (resolution, duration) from scene card",
      styles: hideSceneSpecs,
      key: "themeSwitchPlugin-scenes-hideSceneSpecs",
      version: null,
    },
    3: {
      displayName: "Hide studio logo/text from scene card",
      styles: hideStudioLogo,
      key: "themeSwitchPlugin-scenes-hideStudioLogo",
      version: null,
    },
    4: {
      displayName: "Hide truncated text",
      styles: hideTruncatedText,
      key: "themeSwitchPlugin-scenes-hideTruncatedText",
      version: null,
    },
    5: {
      displayName: "More thumbnails on each row",
      styles: moreThumbsRow,
      key: "themeSwitchPlugin-scenes-moreThumbsRow",
      version: null,
    },
    6: {
      displayName:
        "Longer string when displaying 'Studio as Text' on scene thumbnails",
      styles: longerStringStudio,
      key: "themeSwitchPlugin-scenes-longerStringStudio",
      version: null,
    },
    7: {
      displayName: "Show extra scene info",
      styles: showExtraInfo,
      key: "themeSwitchPlugin-scenes-showExtraInfo",
      version: null,
    },
    8: {
      displayName: "Swap studio and resolution/duration positions",
      styles: swapStudioRezDuration,
      key: "themeSwitchPlugin-scenes-swapStudioRezDuration",
      version: null,
    },
    9: {
      displayName: "Make the list of tags take up less width",
      styles: tagsListLessWidth,
      key: "themeSwitchPlugin-scenes-tagsListLessWidth",
      version: null,
    },
    10: {
      displayName: "Adjust the mouse over behaviour in wall mode",
      styles: adjustMouseWallMode,
      key: "themeSwitchPlugin-scenes-adjustMouseWallMode",
      version: null,
    },
    11: {
      displayName: "Disable zoom on hover in wall mode",
      styles: disableZoomWallMode,
      key: "themeSwitchPlugin-scenes-disableZoomWallMode",
      version: null,
    },
  },
  Studios: {
    1: {
      displayName: "Different studio cards layout",
      styles: differentStudioCardsLayout,
      key: "themeSwitchPlugin-differentStudioCardsLayout",
      version: null,
    },
    2: {
      displayName: "More studios per row",
      styles: moreStudiosRow,
      key: "themeSwitchPlugin-moreStudiosRow",
      version: null,
    },
  },
  Tags: {
    1: {
      displayName: "Alternative tag layout",
      styles: alternativeTagLayout,
      key: "themeSwitchPlugin-tags-alternativeTagLayout",
      version: null,
    },
    2: {
      displayName: "Different tag cards layout",
      styles: differentTagCards,
      key: "themeSwitchPlugin-tags-differentTagCards",
      version: null,
    },
    3: {
      displayName: "Hide Tag Images",
      styles: hideTagImages,
      key: "themeSwitchPlugin-tags-hideTagImages",
      version: null,
    },
    4: {
      displayName: "Subtag explorer",
      styles: subTagExolorer,
      key: "themeSwitchPlugin-tags-subTagExolorer",
      version: null,
    },
  },
};
