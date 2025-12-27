"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TiptapImage from "@tiptap/extension-image"
import TiptapLink from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import TiptapUnderline from "@tiptap/extension-underline"
import TiptapYoutube from "@tiptap/extension-youtube"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    ImageIcon,
    Link as LinkIcon,
    Youtube as YoutubeIcon,
    Palette,
} from "lucide-react"
import { useState, useEffect } from "react"

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
    onImageUpload?: (file: File) => Promise<string>
}

export function RichTextEditor({ content, onChange, onImageUpload }: RichTextEditorProps) {
    const [imageDialogOpen, setImageDialogOpen] = useState(false)
    const [linkUrl, setLinkUrl] = useState("")
    const [linkDialogOpen, setLinkDialogOpen] = useState(false)
    const [youtubeUrl, setYoutubeUrl] = useState("")
    const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false)
    const [textColor, setTextColor] = useState("#000000")
    const [uploading, setUploading] = useState(false)

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            TiptapImage.configure({
                inline: false,
                allowBase64: false,
                HTMLAttributes: {
                    class: 'editor-image',
                },
            }),
            TiptapLink.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 underline hover:text-blue-800 cursor-pointer',
                },
            }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            TextStyle,
            Color,
            TiptapUnderline,
            TiptapYoutube.configure({
                controls: true,
                nocookie: true,
            }),
        ],
        content,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: "prose prose-base max-w-none focus:outline-none min-h-[400px] max-h-[600px] overflow-y-auto p-4",
            },
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
                    const file = event.dataTransfer.files[0]
                    if (file.type.startsWith('image/') && onImageUpload) {
                        event.preventDefault()
                        setUploading(true)
                        onImageUpload(file)
                            .then((url) => {
                                const { schema } = view.state
                                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
                                if (coordinates) {
                                    const node = schema.nodes.image.create({ src: url })
                                    const transaction = view.state.tr.insert(coordinates.pos, node)
                                    view.dispatch(transaction)
                                }
                            })
                            .catch((error) => {
                                console.error('Image upload failed:', error)
                            })
                            .finally(() => {
                                setUploading(false)
                            })
                        return true
                    }
                }
                return false
            },
            handlePaste: (view, event, slice) => {
                const items = event.clipboardData?.items
                if (items) {
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].type.indexOf('image') !== -1) {
                            const file = items[i].getAsFile()
                            if (file && onImageUpload) {
                                event.preventDefault()
                                setUploading(true)
                                onImageUpload(file)
                                    .then((url) => {
                                        editor?.chain().focus().setImage({ src: url }).run()
                                    })
                                    .catch((error) => {
                                        console.error('Image upload failed:', error)
                                    })
                                    .finally(() => {
                                        setUploading(false)
                                    })
                                return true
                            }
                        }
                    }
                }
                return false
            },
        },
    })

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content)
        }
    }, [content, editor])

    useEffect(() => {
        if (!editor) return

        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (target.tagName === 'IMG' && target.classList.contains('editor-image')) {
                document.querySelectorAll('.editor-image').forEach(img => {
                    img.classList.remove('selected-image')
                })
                target.classList.add('selected-image')
                
                const controls = document.querySelector('.image-controls') as HTMLElement
                if (controls) {
                    controls.classList.remove('hidden')
                }
            } else {
                const controls = document.querySelector('.image-controls') as HTMLElement
                if (controls && !controls.contains(target)) {
                    controls.classList.add('hidden')
                    document.querySelectorAll('.selected-image').forEach(img => {
                        img.classList.remove('selected-image')
                    })
                }
            }
        }

        const editorElement = editor.view.dom
        editorElement.addEventListener('click', handleClick)
        document.addEventListener('click', handleClick)

        return () => {
            editorElement.removeEventListener('click', handleClick)
            document.removeEventListener('click', handleClick)
        }
    }, [editor])

    if (!editor) {
        return null
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !onImageUpload) return

        setUploading(true)
        try {
            const url = await onImageUpload(file)
            editor.chain().focus().setImage({ src: url }).run()
            setImageDialogOpen(false)
        } catch (error) {
            console.error("Image upload failed:", error)
        } finally {
            setUploading(false)
        }
    }

    const addLink = () => {
        if (linkUrl) {
            editor.chain().focus().setLink({ href: linkUrl }).run()
            setLinkUrl("")
            setLinkDialogOpen(false)
        }
    }

    const addYoutube = () => {
        if (youtubeUrl) {
            editor.commands.setYoutubeVideo({
                src: youtubeUrl,
                width: 640,
                height: 360,
            })
            setYoutubeUrl("")
            setYoutubeDialogOpen(false)
        }
    }

    const setColor = (color: string) => {
        editor.chain().focus().setColor(color).run()
        setTextColor(color)
    }

    const deleteSelectedImage = () => {
        const selectedImg = document.querySelector('.selected-image')
        if (selectedImg && editor) {
            const { state } = editor
            const { doc } = state
            let imagePos: number | null = null

            doc.descendants((node, pos) => {
                if (node.type.name === 'image' && node.attrs.src === selectedImg.getAttribute('src')) {
                    imagePos = pos
                    return false
                }
            })

            if (imagePos !== null) {
                editor.chain().focus().deleteRange({ from: imagePos, to: imagePos + 1 }).run()
            }
            
            const controls = document.querySelector('.image-controls') as HTMLElement
            if (controls) {
                controls.classList.add('hidden')
            }
        }
    }

    const resizeSelectedImage = (width: number) => {
        const selectedImg = document.querySelector('.selected-image') as HTMLImageElement
        if (selectedImg) {
            selectedImg.style.width = `${width}px`
            selectedImg.style.height = 'auto'
        }
    }

    return (
        <div className="border rounded-lg relative">
            <div className="border-b p-2 flex flex-wrap gap-1 bg-muted/50">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive("bold") ? "bg-muted" : ""}
                >
                    <Bold className="w-4 h-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive("italic") ? "bg-muted" : ""}
                >
                    <Italic className="w-4 h-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={editor.isActive("underline") ? "bg-muted" : ""}
                >
                    <UnderlineIcon className="w-4 h-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={editor.isActive("strike") ? "bg-muted" : ""}
                >
                    <Strikethrough className="w-4 h-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={editor.isActive("code") ? "bg-muted" : ""}
                >
                    <Code className="w-4 h-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""}
                >
                    <Heading1 className="w-4 h-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
                >
                    <Heading2 className="w-4 h-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={editor.isActive("heading", { level: 3 }) ? "bg-muted" : ""}
                >
                    <Heading3 className="w-4 h-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive("bulletList") ? "bg-muted" : ""}
                >
                    <List className="w-4 h-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive("orderedList") ? "bg-muted" : ""}
                >
                    <ListOrdered className="w-4 h-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={editor.isActive("blockquote") ? "bg-muted" : ""}
                >
                    <Quote className="w-4 h-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().setTextAlign("left").run()}
                    className={editor.isActive({ textAlign: "left" }) ? "bg-muted" : ""}
                >
                    <AlignLeft className="w-4 h-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().setTextAlign("center").run()}
                    className={editor.isActive({ textAlign: "center" }) ? "bg-muted" : ""}
                >
                    <AlignCenter className="w-4 h-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().setTextAlign("right").run()}
                    className={editor.isActive({ textAlign: "right" }) ? "bg-muted" : ""}
                >
                    <AlignRight className="w-4 h-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().setTextAlign("justify").run()}
                    className={editor.isActive({ textAlign: "justify" }) ? "bg-muted" : ""}
                >
                    <AlignJustify className="w-4 h-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="relative"
                    >
                        <Palette className="w-4 h-4" />
                        <input
                            type="color"
                            value={textColor}
                            onChange={(e) => setColor(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </Button>
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" variant="ghost" size="icon">
                            <ImageIcon className="w-4 h-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Insert Image</DialogTitle>
                            <DialogDescription>
                                Upload an image from your computer
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {onImageUpload && (
                                <div className="space-y-2">
                                    <Label>Upload Image</Label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                    {uploading && <p className="text-sm text-muted-foreground">Uploading to Cloudinary...</p>}
                                    <p className="text-xs text-muted-foreground">
                                        Drag and drop images directly into the editor
                                    </p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" variant="ghost" size="icon">
                            <LinkIcon className="w-4 h-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Insert Link</DialogTitle>
                            <DialogDescription>
                                Enter the URL for the link
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://example.com"
                            />
                            <Button onClick={addLink} disabled={!linkUrl}>
                                Insert Link
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={youtubeDialogOpen} onOpenChange={setYoutubeDialogOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" variant="ghost" size="icon">
                            <YoutubeIcon className="w-4 h-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Embed YouTube Video</DialogTitle>
                            <DialogDescription>
                                Enter the YouTube video URL
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                            <Button onClick={addYoutube} disabled={!youtubeUrl}>
                                Embed Video
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <div className="w-px h-6 bg-border mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                >
                    <Undo className="w-4 h-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                >
                    <Redo className="w-4 h-4" />
                </Button>
            </div>

            <div className="image-controls hidden absolute top-16 right-4 bg-white border rounded-lg shadow-lg p-3 z-10">
                <div className="flex flex-col gap-2">
                    <div className="text-xs font-semibold mb-1">Image Controls</div>
                    <div className="flex gap-1">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => resizeSelectedImage(300)}
                        >
                            Small
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => resizeSelectedImage(500)}
                        >
                            Medium
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => resizeSelectedImage(700)}
                        >
                            Large
                        </Button>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={deleteSelectedImage}
                    >
                        Delete Image
                    </Button>
                </div>
            </div>

            <EditorContent editor={editor} className="prose-editor" />

            <style jsx global>{`
                .prose-editor .ProseMirror {
                    min-height: 400px;
                    max-height: 600px;
                    overflow-y: auto;
                    padding: 1rem;
                }
                .prose-editor .ProseMirror:focus {
                    outline: none;
                }
                .prose-editor .ProseMirror a {
                    color: #2563eb;
                    text-decoration: underline;
                    cursor: pointer;
                }
                .prose-editor .ProseMirror a:hover {
                    color: #1e40af;
                }
                .prose-editor .ProseMirror img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 0.5rem;
                    margin: 1rem 0;
                    cursor: pointer;
                }
                .prose-editor .ProseMirror img.selected-image {
                    outline: 3px solid #3b82f6;
                    outline-offset: 2px;
                }
                .prose-editor .ProseMirror h1 {
                    font-size: 2.25rem;
                    font-weight: 700;
                    margin-top: 1.5rem;
                    margin-bottom: 1rem;
                }
                .prose-editor .ProseMirror h2 {
                    font-size: 1.875rem;
                    font-weight: 700;
                    margin-top: 1.25rem;
                    margin-bottom: 0.875rem;
                }
                .prose-editor .ProseMirror h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-top: 1rem;
                    margin-bottom: 0.75rem;
                }
                .prose-editor .ProseMirror p {
                    margin-top: 0.75rem;
                    margin-bottom: 0.75rem;
                }
                .prose-editor .ProseMirror ul,
                .prose-editor .ProseMirror ol {
                    margin-top: 0.75rem;
                    margin-bottom: 0.75rem;
                    padding-left: 1.5rem;
                }
                .prose-editor .ProseMirror blockquote {
                    border-left: 4px solid #3b82f6;
                    padding-left: 1rem;
                    margin: 1rem 0;
                    font-style: italic;
                }
                .prose-editor .ProseMirror iframe {
                    max-width: 100%;
                    border-radius: 0.5rem;
                    margin: 1rem 0;
                }
            `}</style>
        </div>
    )
}



