"use strict";
(() => {
  // src/globals.ts
  var api = window.PluginApi;
  var { React, ReactDOM, GQL, utils, libraries, patch, components } = api;

  // src/hooks/useNotifications.tsx
  var NotificationContext = React.createContext({
    notifications: [],
    setNotifications: (n) => {
    }
  });
  var NotificationProvider = ({
    children
  }) => {
    const [notifications, setNotifications] = React.useState(
      []
    );
    return /* @__PURE__ */ React.createElement(
      NotificationContext.Provider,
      {
        value: { notifications, setNotifications }
      },
      children
    );
  };
  var useNotifications = () => React.useContext(NotificationContext);

  // src/types/INotification.ts
  var NotificationType = /* @__PURE__ */ ((NotificationType2) => {
    NotificationType2[NotificationType2["Plugin"] = 0] = "Plugin";
    NotificationType2[NotificationType2["Scraper"] = 1] = "Scraper";
    return NotificationType2;
  })(NotificationType || {});

  // src/hooks/usePackageUpdateChecking.ts
  var getUpdateNotifications = (packages, type) => {
    if (!packages)
      return [];
    return packages.filter(
      (pkg) => pkg.source_package && pkg.version !== pkg.source_package.version
    ).map((pkg) => ({
      message: `${NotificationType[type]} ${pkg.name} can be updated to version ${pkg.source_package?.version}`,
      data: pkg,
      type
    }));
  };
  var usePackageUpdateChecking = () => {
    const plugins = GQL.useInstalledPluginPackagesStatusQuery();
    const scrapers = GQL.useInstalledScraperPackagesStatusQuery();
    const loading = plugins.loading || scrapers.loading;
    const pluginNotifications = getUpdateNotifications(
      plugins.data?.installedPackages,
      0 /* Plugin */
    );
    const scraperNotifications = getUpdateNotifications(
      scrapers.data?.installedPackages,
      1 /* Scraper */
    );
    return {
      loading,
      packages: [...pluginNotifications, ...scraperNotifications]
    };
  };

  // src/components/modal/PackageModalBody.tsx
  var PackageModalBody = ({ pkg }) => {
    const { FormattedDate, FormattedTime } = libraries.Intl;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", null, pkg.name), /* @__PURE__ */ React.createElement("div", null, "id: ", pkg.package_id), /* @__PURE__ */ React.createElement("div", null, "source url: ", pkg.sourceURL)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h5", null, "Current Version (", pkg.version, ")"), /* @__PURE__ */ React.createElement("div", null, "Last updated:", " ", /* @__PURE__ */ React.createElement(
      FormattedDate,
      {
        value: pkg.date,
        format: "short",
        timeZone: "utc"
      }
    ), " ", /* @__PURE__ */ React.createElement(
      FormattedTime,
      {
        value: pkg.date,
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZone: "utc"
      }
    ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h5", null, "Latest Version (", pkg.source_package?.version, ")"), /* @__PURE__ */ React.createElement("div", null, "Remote version updated:", " ", /* @__PURE__ */ React.createElement(
      FormattedDate,
      {
        value: pkg.source_package?.date,
        format: "short",
        timeZone: "utc"
      }
    ), " ", /* @__PURE__ */ React.createElement(
      FormattedTime,
      {
        value: pkg.source_package?.date,
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZone: "utc"
      }
    ))));
  };
  var PackageModalBody_default = PackageModalBody;

  // src/components/modal/PluginNotification.tsx
  var PluginNotification = ({ notification, onClose }) => {
    const pkg = notification.data;
    const { Button, Modal } = libraries.Bootstrap;
    const { StashService } = utils;
    const { notifications, setNotifications } = useNotifications();
    const removePluginNotifications = (packageIds) => {
      setNotifications(
        notifications.filter((n) => {
          const pkg2 = n.data;
          return !packageIds.includes(pkg2?.package_id);
        })
      );
    };
    const updatePlugin = async () => {
      const vars = [{ id: pkg.package_id, sourceURL: pkg.sourceURL }];
      await StashService.mutateUpdatePluginPackages(vars);
      removePluginNotifications([pkg.package_id]);
      onClose();
    };
    const updateAllPlugins = async () => {
      await StashService.mutateUpdatePluginPackages([]);
      setNotifications(
        notifications.filter((n) => n.type !== 0 /* Plugin */)
      );
      onClose();
    };
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Modal.Header, { closeButton: true }, /* @__PURE__ */ React.createElement(Modal.Title, null, "Update Plugin")), /* @__PURE__ */ React.createElement(Modal.Body, null, /* @__PURE__ */ React.createElement(PackageModalBody_default, { pkg })), /* @__PURE__ */ React.createElement(Modal.Footer, null, /* @__PURE__ */ React.createElement(Button, { variant: "primary", onClick: updatePlugin }, "Update Plugin"), /* @__PURE__ */ React.createElement(Button, { variant: "primary", onClick: updateAllPlugins }, "Update All Plugins"), /* @__PURE__ */ React.createElement(Button, { variant: "primary", onClick: onClose }, "Cancel")));
  };
  var PluginNotification_default = PluginNotification;

  // src/components/modal/NotificationModal.tsx
  var NotificationModal = ({ display, onClose, content }) => {
    const { Button, Modal } = libraries.Bootstrap;
    if (!display)
      return null;
    return /* @__PURE__ */ React.createElement(
      Modal,
      {
        className: "stash-notification-modal",
        show: display,
        onHide: onClose,
        centered: true
      },
      typeof content === "string" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Modal.Header, { closeButton: true }, /* @__PURE__ */ React.createElement(Modal.Title, null, "Notification")), /* @__PURE__ */ React.createElement(Modal.Body, null, content), /* @__PURE__ */ React.createElement(Modal.Footer, null, /* @__PURE__ */ React.createElement(Button, { variant: "primary", onClick: onClose }, "Cancel"))) : content
    );
  };
  var NotificationModal_default = NotificationModal;

  // src/components/modal/ScraperNotification.tsx
  var ScraperNotification = ({ notification, onClose }) => {
    const pkg = notification.data;
    const { Button, Modal } = libraries.Bootstrap;
    const { StashService } = utils;
    const { notifications, setNotifications } = useNotifications();
    const removeScraperNotifications = (packageIds) => {
      setNotifications(
        notifications.filter((n) => {
          const pkg2 = n.data;
          return !packageIds.includes(pkg2?.package_id);
        })
      );
    };
    const updateScraper = async () => {
      const vars = [{ id: pkg.package_id, sourceURL: pkg.sourceURL }];
      await StashService.mutateUpdateScraperPackages(vars);
      removeScraperNotifications([pkg.package_id]);
      onClose();
    };
    const updateAllScrapers = async () => {
      await StashService.mutateUpdateScraperPackages([]);
      setNotifications(
        notifications.filter((n) => n.type !== 1 /* Scraper */)
      );
      onClose();
    };
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Modal.Header, { closeButton: true }, /* @__PURE__ */ React.createElement(Modal.Title, null, "Update Scraper")), /* @__PURE__ */ React.createElement(Modal.Body, null, /* @__PURE__ */ React.createElement(PackageModalBody_default, { pkg })), /* @__PURE__ */ React.createElement(Modal.Footer, null, /* @__PURE__ */ React.createElement(Button, { variant: "primary", onClick: updateScraper }, "Update Scraper"), /* @__PURE__ */ React.createElement(Button, { variant: "primary", onClick: updateAllScrapers }, "Update All Scrapers"), /* @__PURE__ */ React.createElement(Button, { variant: "primary", onClick: onClose }, "Cancel")));
  };
  var ScraperNotification_default = ScraperNotification;

  // src/components/NotificationDropdown.tsx
  var NotificationDropdown = ({ notifications }) => {
    const [display, setDisplay] = React.useState(false);
    const [activeNotification, setActiveNotification] = React.useState(null);
    const { Dropdown } = libraries.Bootstrap;
    const onNotificationClick = (notification) => {
      setActiveNotification(notification);
      setDisplay(true);
    };
    const onClose = () => {
      setDisplay(false);
    };
    const renderModal = () => {
      if (!activeNotification)
        return null;
      const modals = {
        [0 /* Plugin */]: /* @__PURE__ */ React.createElement(
          PluginNotification_default,
          {
            notification: activeNotification,
            onClose
          }
        ),
        [1 /* Scraper */]: /* @__PURE__ */ React.createElement(
          ScraperNotification_default,
          {
            notification: activeNotification,
            onClose
          }
        )
      };
      return modals[activeNotification.type] ?? activeNotification.message;
    };
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Dropdown.Menu, { className: "dropdown-menu-end" }, notifications.map((n, i) => /* @__PURE__ */ React.createElement(
      Dropdown.Item,
      {
        key: i,
        onClick: () => onNotificationClick(n)
      },
      n.message
    ))), activeNotification && /* @__PURE__ */ React.createElement(
      NotificationModal_default,
      {
        display,
        onClose,
        content: renderModal()
      }
    ));
  };

  // src/components/StashNotificationsButton.tsx
  var StashNotificationsButton = () => {
    const { Badge, Button, Dropdown } = libraries.Bootstrap;
    const { Icon } = components;
    const { faBell } = libraries.FontAwesomeSolid;
    const { notifications, setNotifications } = useNotifications();
    const { loading, packages } = usePackageUpdateChecking();
    const hasNotifications = !loading && notifications.length > 0;
    React.useEffect(() => {
      if (!loading && packages.length > 0) {
        setNotifications(packages);
      }
    }, [loading]);
    if (!hasNotifications)
      return null;
    return /* @__PURE__ */ React.createElement("span", { className: "notification-btn-container" }, /* @__PURE__ */ React.createElement(Dropdown, null, /* @__PURE__ */ React.createElement(
      Dropdown.Toggle,
      {
        as: Button,
        className: "nav-utility minimal notification-btn"
      },
      /* @__PURE__ */ React.createElement(Icon, { icon: faBell }),
      hasNotifications && /* @__PURE__ */ React.createElement(
        Badge,
        {
          className: "notification-badge",
          pill: true,
          variant: "danger"
        },
        notifications.length
      )
    ), /* @__PURE__ */ React.createElement(NotificationDropdown, { notifications })));
  };
  var StashNotificationsButton_default = StashNotificationsButton;

  // src/stashNotifications.tsx
  (function() {
    patch.before("MainNavBar.UtilityItems", function(props) {
      return [
        {
          children: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(NotificationProvider, null, /* @__PURE__ */ React.createElement(StashNotificationsButton_default, null)), props.children)
        }
      ];
    });
  })();
})();
