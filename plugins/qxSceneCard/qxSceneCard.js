"use strict";
(() => {
  // src/globals.ts
  var api = window.PluginApi;
  var { React, GQL, libraries, patch } = api;

  // src/components/PerformerList.tsx
  var PerformerLink = (performer) => {
    const { NavLink } = libraries.ReactRouterDOM;
    return /* @__PURE__ */ React.createElement(
      NavLink,
      {
        to: `/performers/${performer.id}`,
        className: performer.gender,
      },
      performer.name
    );
  };
  var PerformerList = (performers) => {
    return /* @__PURE__ */ React.createElement(
      "div",
      { className: "performers" },
      /* @__PURE__ */ React.createElement(
        "div",
        { className: "list" },
        performers?.map((performer) => {
          return PerformerLink(performer);
        })
      )
    );
  };

  // src/components/Footer.tsx
  var Footer = (date, views, studio) => {
    const { Link } = libraries.ReactRouterDOM;
    const { FormattedDate } = libraries.Intl;
    return /* @__PURE__ */ React.createElement(
      "div",
      { className: "footer" },
      /* @__PURE__ */ React.createElement(
        "span",
        { className: "studio" },
        studio &&
          /* @__PURE__ */ React.createElement(
            Link,
            { to: `/studios/${studio.id}` },
            studio.name
          )
      ),
      /* @__PURE__ */ React.createElement(
        "span",
        { className: "views" },
        views,
        " ",
        (views === 1 && "view") || "views"
      ),
      /* @__PURE__ */ React.createElement(
        "span",
        { className: "date" },
        date &&
          /* @__PURE__ */ React.createElement(FormattedDate, {
            value: date,
            format: "short",
            timeZone: "utc",
          })
      )
    );
  };

  // src/qxSceneCard.tsx
  var HideStudioLogo = (sceneCardNode) => {
    if (!sceneCardNode) return;
    const logoNode = sceneCardNode.querySelector(".studio-overlay");
    logoNode?.classList.add("hide");
  };
  var HideIndividualPopoverButtons = (sceneCardNode, settings) => {
    if (!sceneCardNode || !settings) return;
    if (settings.hideMarkers) {
      const markerNode = sceneCardNode.querySelector(".marker-count");
      markerNode?.classList.add("hide");
    }
    if (settings.hideMovies) {
      const movieNode = sceneCardNode.querySelector(".movie-count");
      movieNode?.classList.add("hide");
    }
    if (settings.hideOCounter) {
      const oCounterNode = sceneCardNode.querySelector(".o-count");
      oCounterNode?.classList.add("hide");
    }
  };
  var SetWatchedProperty = (sceneCardNode, views) => {
    if (!sceneCardNode || views === 0) return;
    sceneCardNode.classList.add("watched");
  };
  var SceneCardDetails = ({ props }) => {
    const nodeRef = React.useRef(null);
    const scene = props.scene;
    const { data } = GQL.useConfigurationQuery();
    const qxSceneCardSettings = data?.configuration?.plugins?.qxSceneCard;
    const isHideStudioSettingEnabled = qxSceneCardSettings?.hideStudio;
    const isWatchedSettingEnabled = qxSceneCardSettings?.fadeWatched;
    React.useEffect(() => {
      const sceneCardNode = nodeRef.current?.parentElement?.parentElement;
      if (isHideStudioSettingEnabled) {
        HideStudioLogo(sceneCardNode);
      }
      if (isWatchedSettingEnabled) {
        SetWatchedProperty(sceneCardNode, scene.play_count);
      }
      HideIndividualPopoverButtons(sceneCardNode, qxSceneCardSettings);
    }, []);
    return /* @__PURE__ */ React.createElement(
      React.Fragment,
      null,
      /* @__PURE__ */ React.createElement("div", { ref: nodeRef }),
      PerformerList(scene.performers),
      Footer(scene.date, scene.play_count, scene.studio)
    );
  };
  patch.instead("SceneCard.Details", function (props, _, original) {
    return /* @__PURE__ */ React.createElement(SceneCardDetails, { props });
  });
})();
