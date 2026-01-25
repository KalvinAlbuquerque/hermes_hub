
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import Image from '@tiptap/extension-image';
import { useState, useRef, useEffect, useCallback } from 'react';

const ResizableImageComponent = (props: any) => {
    const { node, updateAttributes, selected } = props;
    const [width, setWidth] = useState(node.attrs.width || '100%');
    const [resizing, setResizing] = useState(false);
    const imageRef = useRef<HTMLImageElement>(null);
    const resizeStartPos = useRef<{ x: number, width: number } | null>(null);

    useEffect(() => {
        // Sync internal state if node attributes change externally
        if (node.attrs.width) {
            setWidth(node.attrs.width);
        }
    }, [node.attrs.width]);

    const onMouseDown = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (imageRef.current) {
            setResizing(true);
            resizeStartPos.current = {
                x: event.clientX,
                width: imageRef.current.offsetWidth,
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }
    };

    const onMouseMove = useCallback((event: MouseEvent) => {
        if (!resizeStartPos.current) return;

        // Calculate new width: Original Width + (Current X - Start X)
        // For right-side handle:
        const deltaX = event.clientX - resizeStartPos.current.x;
        const newWidth = Math.max(50, resizeStartPos.current.width + deltaX); // Min 50px

        setWidth(newWidth + 'px');
    }, []);

    const onMouseUp = useCallback(() => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        setResizing(false);
        resizeStartPos.current = null;

        // Persist changes to Tiptap node
        // We need to use the current width from state/ref, but state might be lagging in closure? 
        // State is up to date in this closure? No, `onMouseUp` is closed over initial state if not dependent?
        // Let's use getBoundingClientRect inside if needed, or just rely on the last setWidth.
        // Actually, `setWidth` is async.
        // Better strategy: updateAttributes in onMouseMove? No, performance.
        // Update attributes ONLY on mouse up.

        // We need access to the *latest* width.
        // Let's rely on the imageRef to get the final width.
        if (imageRef.current) {
            updateAttributes({ width: imageRef.current.style.width });
        }
    }, [updateAttributes]);


    // Determine alignment styles
    const getAlignmentStyle = () => {
        const align = node.attrs.textAlign;
        if (align === 'center') return { margin: '0 auto', display: 'block' };
        if (align === 'right') return { marginLeft: 'auto', display: 'block' };
        return { marginRight: 'auto', display: 'block' }; // Default/Left
    };

    return (
        <NodeViewWrapper className="image-view" style={{ ...getAlignmentStyle(), width: 'fit-content' }}>
            {/* Container to handle selection style */}
            <div
                className={`relative inline-block transition-outline duration-100 ${selected || resizing ? 'outline outline-2 outline-primary' : ''}`}
            >
                <img
                    ref={imageRef}
                    src={node.attrs.src}
                    alt={node.attrs.alt}
                    style={{ width: width, maxWidth: '100%', height: 'auto', display: 'block' }}
                    className="rounded-md"
                />

                {/* Resize Handle - Right Edge */}
                {(selected || resizing) && (
                    <div
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/50"
                        style={{ right: '-4px' }}
                        onMouseDown={onMouseDown}
                    />
                )}

                {/* Resize Handle - Bottom Right Corner (Optional but better UX) */}
                {(selected || resizing) && (
                    <div
                        className="absolute bottom-0 right-0 w-4 h-4 bg-primary border-2 border-white rounded-full cursor-nwse-resize z-10"
                        style={{ transform: 'translate(50%, 50%)' }}
                        onMouseDown={onMouseDown}
                    />
                )}

            </div>
        </NodeViewWrapper>
    );
};

export default Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: '100%',
                renderHTML: attributes => ({
                    width: attributes.width,
                    style: `width: ${attributes.width}`,
                }),
            },
            textAlign: {
                default: 'left',
                renderHTML: attributes => ({
                    style: `text-align: ${attributes.textAlign}`,
                }),
            },
            height: {
                default: 'auto',
            },
            'data-cid': {
                default: null,
                renderHTML: attributes => {
                    if (!attributes['data-cid']) {
                        return {};
                    }
                    return {
                        'data-cid': attributes['data-cid'],
                    };
                },
            },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(ResizableImageComponent);
    },
});
