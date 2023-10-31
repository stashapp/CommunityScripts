"use strict";
(function () {
    const api = window.PluginApi;
    const React = api.React;
    const { Button, Modal } = api.libraries.Bootstrap;
    const { faNoteSticky } = api.libraries.FontAwesomeSolid;
    const NotesComponent = () => {
        const storageKey = 'Stash Notes';
        const [display, setDisplay] = React.useState(false);
        const [notes, setNotes] = React.useState('');
        const enableModal = () => setDisplay(true);
        const disableModal = () => setDisplay(false);
        const saveNotes = (notes) => {
            localStorage.setItem(storageKey, notes);
            disableModal();
        };
        React.useEffect(() => {
            const notesFromStorage = localStorage.getItem(storageKey);
            if (notesFromStorage) {
                setNotes(notesFromStorage);
            }
        }, []);
        return (React.createElement(React.Fragment, null,
            React.createElement(NavButton, { onClickHandler: enableModal }),
            React.createElement(NotesModal, { displayState: display, onCloseHandler: disableModal, onSaveHandler: saveNotes, notesState: notes, notesChangeHandler: (n) => setNotes(n) })));
    };
    const NavButton = ({ onClickHandler }) => {
        const { Icon } = api.components;
        return (React.createElement(React.Fragment, null,
            React.createElement(Button, { className: "minimal d-flex align-items-center h-100", title: "Notes", onClick: onClickHandler },
                React.createElement(Icon, { icon: faNoteSticky }))));
    };
    const NotesModal = ({ displayState, onCloseHandler, onSaveHandler, notesState, notesChangeHandler }) => {
        return (React.createElement(Modal, { show: displayState, onHide: onCloseHandler },
            React.createElement(Modal.Header, { closeButton: true },
                React.createElement(Modal.Title, null, "Notes")),
            React.createElement(Modal.Body, null,
                React.createElement("textarea", { className: "text-input form-control", rows: 10, value: notesState, onChange: (e) => notesChangeHandler(e.target.value) }),
                React.createElement("hr", null),
                React.createElement("h5", null, "Important!"),
                "Notes are stored as plain text in your browser's local storage. Do not save sensitive information. Notes will be lost after closing a browser in incognito mode."),
            React.createElement(Modal.Footer, null,
                React.createElement(Button, { variant: "secondary", onClick: onCloseHandler }, "Close"),
                React.createElement(Button, { variant: "primary", onClick: () => onSaveHandler(notesState) }, "Save Changes"))));
    };
    api.patch.before("MainNavBar.UtilityItems", function (props) {
        return [
            {
                children: (React.createElement(React.Fragment, null,
                    props.children,
                    React.createElement(NotesComponent, null)))
            }
        ];
    });
})();
