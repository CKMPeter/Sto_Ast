import React from "react"
import { Container } from "react-bootstrap"
import { useFolder } from "../../hooks/useFolder"
import AddFolderButton from "./AddFolderButton"
import Folder from "./Folder"
import Navbar from "./Navbar"
import { useParams, useLocation } from "react-router-dom"
import FolderBreadcrumbs from "./FolderBreadcrumbs"
import AddFileButton from "./AddFileButton"
import File from "./File"

export default function Dashboard() {
    const {state = {}} = useLocation()
    const { folderId} = useParams()
    const {folder, childFolders, childFiles} = useFolder(folderId)
    console.log(childFolders)
    return (
        <>
        <Navbar />
        <Container fluid>
            <div className="d-flex align-itens-center">
                <FolderBreadcrumbs currentFolder = {folder} />
                <AddFolderButton currentFolder={folder}/>
                <AddFileButton currentFolder={folder}/>
            </div>
            {Array.isArray(childFolders) && childFolders.length > 0 && (
                <div className="d-flex flex-wrap">
                    {childFolders.map(child => (
                        <div key={child.id} style={{ maxWidth: '200px' }} className="p-2">
                            <Folder folder={child} />
                        </div>
                    ))}
                </div>
            )}
            {Array.isArray(childFiles) && childFiles.length > 0 && (
                <div className="d-flex flex-wrap">
                {childFiles
                    .filter((child) => child.folderId === folderId) // Filter by folderId
                    .map((child) => (
                    <div key={child.id} style={{ maxWidth: "200px" }} className="p-2">
                        <File file={child} />
                    </div>
                    ))}
                </div>
            )}
            {/* Render horizontal line if both child folders and child files exist */}
            
            {/* Render child files if any */}
        </Container>
        </>
    )
}
