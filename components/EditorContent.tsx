import React from 'react';
import { Editor, EditorContent } from '@tiptap/react';

interface TipTapEditorProps {
    editor: Editor | null;
}

const TipTapEditor: React.FC<TipTapEditorProps> = ({ editor }) => {
    if (!editor) return null;
    
    return <EditorContent editor={editor} />;
};

export default TipTapEditor;