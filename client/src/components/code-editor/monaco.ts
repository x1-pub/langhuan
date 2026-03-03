import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

// Keep only SQL syntax support to reduce Monaco language payload.
import 'monaco-editor/esm/vs/basic-languages/sql/sql.contribution';

export { monaco };
