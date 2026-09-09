'use client'
import { useState } from "react";
import { Delete24Regular } from "@fluentui/react-icons";

const MediaCard = ({ item, agentUrl, onDelete }) => {
    const [deleting, setDeleting] = useState(false);
    const src = `${agentUrl}/library/file/${encodeURIComponent(item.name)}`;

    const handleDelete = async (e) => {
        e.stopPropagation();
        setDeleting(true);
        await onDelete(item.name);
    };

    return (
        <div className="relative aspect-square rounded-xl overflow-hidden group bg-bg-hover">
            <img
                src={src}
                alt={item.name}
                draggable={false}
                className="w-full h-full object-cover"
            />
            {/* hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
            {/* delete button */}
            <button
                onClick={handleDelete}
                disabled={deleting}
                title="Delete"
                className="cursor-pointer absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-black/60 text-white hover:text-red-400 transition-all"
            >
                <Delete24Regular className="size-4" />
            </button>
            {/* filename tooltip */}
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-[10px] truncate drop-shadow">{item.name}</p>
            </div>
        </div>
    );
};

const MediaSection = ({ media, agentUrl, onDelete }) => (
    <div>
        <div className="px-4 mb-3">
            <span className="text-sm font-medium text-text-primary">Media ({media.length})</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-1 px-1">
            {media.map((item) => (
                <MediaCard key={item.name} item={item} agentUrl={agentUrl} onDelete={onDelete} />
            ))}
        </div>
    </div>
);

export default MediaSection;
