import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

// Keep only SQL syntax support to reduce Monaco language payload.
import 'monaco-editor/esm/vs/basic-languages/sql/sql.contribution';
import 'monaco-editor/esm/vs/editor/contrib/suggest/browser/suggestController';

export { monaco };
