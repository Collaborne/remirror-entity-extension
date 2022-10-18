/*! For license information please see 166.533ddc29.iframe.bundle.js.LICENSE.txt */
    overflow: visible;
    padding: 0;
    cursor: pointer;
    z-index: 15;
    position: relative;
  `,tableControllerTriggerArea=css`
    flex: 1;
    position: relative;
    z-index: 10;

    /* Style for debug. Use linear-gradient as background so that we can differentiate two neighbor areas. */
    /* background: linear-gradient(to left top, rgba(0, 255, 100, 0.2), rgba(200, 100, 255, 0.2)); */
  `,tableControllerWrapper=css`
    overflow: visible;
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
  `,tableControllerMark=css`
    position: absolute;
    width: 0px;
    height: 0px;
    border-radius: 50%;
    border-style: solid;
    border-color: ${getThemeVar("color","table","mark")};
    border-width: ${2}px;
  `,tableControllerMarkRowCorner=css`
    bottom: -${2}px;
    left: -12px;

    ${tableControllerMark}
  `,tableControllerMarkColumnCorner=css`
    ${tableControllerMark}

    right: -${2}px;
    top: -12px;
  `;css`
    ${tableController}

    height: ${12}px;
    width: ${12}px;

    & div.${"remirror-table-controller-wrapper"} {
      ${tableControllerWrapper}

      width: ${12}px;
      height: ${12}px;
    }

    & div.${"remirror-table-controller-trigger-area"} {
      ${tableControllerTriggerArea}

      display: none;
    }

    & div.${"remirror-table-controller-mark-row-corner"} {
      ${tableControllerMarkRowCorner}
    }
    & div.${"remirror-table-controller-mark-column-corner"} {
      ${tableControllerMarkColumnCorner}
    }
  `,css`
    ${tableController}

    height: ${12}px;

    & div.${"remirror-table-controller-wrapper"} {
      ${tableControllerWrapper}

      width: 100%;
      height: ${12}px;
      flex-direction: row;
    }

    & div.${"remirror-table-controller-trigger-area"} {
      ${tableControllerTriggerArea}

      height: 36px;
    }

    & div.${"remirror-table-controller-mark-row-corner"} {
      display: none;
    }
    & div.${"remirror-table-controller-mark-column-corner"} {
      ${tableControllerMarkColumnCorner}
    }
  `,css`
    ${tableController}

    width: ${12}px;

    & div.${"remirror-table-controller-wrapper"} {
      ${tableControllerWrapper}

      height: 100%;
      width: ${12}px;
      flex-direction: column;
    }

    & div.${"remirror-table-controller-trigger-area"} {
      ${tableControllerTriggerArea}

      width: 36px;
    }

    & div.${"remirror-table-controller-mark-row-corner"} {
      ${tableControllerMarkRowCorner}
    }
    & div.${"remirror-table-controller-mark-column-corner"} {
      display: none;
    }
//# sourceMappingURL=166.533ddc29.iframe.bundle.js.map