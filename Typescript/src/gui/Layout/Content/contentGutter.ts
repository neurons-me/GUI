import { guiDocumentProps } from '@/runtime/guiDocument';
import { GUI_CONTENT_ID } from '@/runtime/guiIds';

const contentProps = guiDocumentProps(GUI_CONTENT_ID);

/** The Content area's own gutter inside the bars' insets, on every side. Declared on GUI.window.layout.content. */
export const CONTENT_GUTTER_PX = typeof contentProps.gutter === 'number' ? contentProps.gutter : 1.618;

/** Shared page column inside Content. Declared on GUI.window.layout.content (`maxWidth`). */
export const CONTENT_MAX_WIDTH_PX = typeof contentProps.maxWidth === 'number' ? contentProps.maxWidth : 1120;

/** Declared on GUI.window.layout.content (`minWidth`). */
export const CONTENT_MIN_WIDTH = contentProps.minWidth !== undefined ? contentProps.minWidth as number | string : 0;

/** Declared on GUI.window.layout.content (`height`). */
export const CONTENT_HEIGHT = contentProps.height !== undefined ? contentProps.height as number | string : '100%';
