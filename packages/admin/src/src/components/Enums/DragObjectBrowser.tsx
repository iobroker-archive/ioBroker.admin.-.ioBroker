import React, { useEffect, useState } from 'react';

import { useDrag, type DragSourceMonitor } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

import { Card } from '@mui/material';

import { List as ListIcon } from '@mui/icons-material';

import { type AdminConnection, Icon } from '@iobroker/adapter-react-v5';

import ObjectBrowser, {
    type TreeItemData, type TreeItem,
    getSelectIdIconFromObjects, ITEM_IMAGES,
} from '../ObjectBrowser';

export interface DragItem {
    data: TreeItemData;
    children: DragItem[];
    preview: React.JSX.Element | null;
}

interface DragSettings {
    type: string;
    end: (item: TreeItem, monitor: any) => void;
    item: { data: TreeItemData; preview: React.JSX.Element | null };
    collect: (monitor: DragSourceMonitor) => ({
        isDragging?: boolean;
        canDrag?: boolean;
    });
}

interface DragObjectBrowserProps {
    t: (text: string) => string;
    lang: string;
    socket: AdminConnection;
    addItemToEnum: (id: string, enumId: string) => void;
    classesParent: Record<string, string>;
    getName: (name: string | Record<string, string>) => string;
}

const DragObjectBrowser = (props: DragObjectBrowserProps) => {
    const [wrapperState, setWrapperState] = useState({ DragWrapper: null });
    const objectRef = React.useRef<Record<string, ioBroker.Object> | null>(null);

    useEffect(() => {
        // eslint-disable-next-line react/no-unstable-nested-components
        const DragWrapper = (dragProps: { item: DragItem; className: string; key?: string; children: React.JSX.Element | null }) => {
            const onDragEnd = (
                item: TreeItem,
                monitor: DragSourceMonitor<DragItem, { enumId: string }>,
            ) => {
                const dropResult = monitor.getDropResult();
                if (item.data && dropResult) {
                    if (item.data.obj) {
                        props.addItemToEnum(item.data.obj._id, dropResult.enumId);
                    } else {
                        // all children ??
                        window.alert(`TODO: Add all direct children of ${item.data.id}`);
                    }
                }
            };

            const dragSettings: DragSettings = {
                type: 'object',
                end: onDragEnd,
                item: {
                    data: dragProps.item.data,
                    preview: (dragProps.item.data && dragProps.item.data.obj ? <Card
                        key={dragProps.item.data.obj._id}
                        variant="outlined"
                        className={props.classesParent.enumGroupMember}
                    >
                        {dragProps.item.data.obj.common?.icon ?
                            <Icon
                                className={props.classesParent.icon}
                                src={objectRef.current ? getSelectIdIconFromObjects(objectRef.current, dragProps.item.data.obj._id) : dragProps.item.data.obj.common.icon}
                            />
                            :
                            (ITEM_IMAGES[dragProps.item.data.obj.type] || <ListIcon className={props.classesParent.icon} />)}
                        <div>
                            <div>{dragProps.item.data.obj.common?.name ? props.getName(dragProps.item.data.obj.common?.name) : dragProps.item.data.obj._id}</div>
                            {dragProps.item.data.obj.common?.name ? <div
                                style={{ fontStyle: 'italic', fontSize: 'smaller', opacity: 0.7 }}
                            >
                                {dragProps.item.data.obj._id}
                            </div> : null}
                        </div>
                    </Card> : null),
                },
                collect: monitor => ({
                    isDragging: monitor.isDragging(),
                }),
            };

            const [{ isDragging }, dragRef, preview] = useDrag(dragSettings);

            useEffect(() => {
                preview(getEmptyImage(), { captureDraggingState: true });
            }, []);

            return <div
                key={dragProps.item.data.id}
                className={dragProps.className || ''}
                ref={dragRef}
                style={{ backgroundColor: isDragging ? 'rgba(100,152,255,0.1)' : undefined }}
            >
                {dragProps.children}
            </div>;
        };
        setWrapperState({ DragWrapper });
    // eslint-disable-next-line
    }, [props.classesParent, props.addItemToEnum, props.getName]); // react-hooks/exhaustive-deps

    return wrapperState ? <ObjectBrowser
        t={props.t}
        socket={props.socket}
        types={['state', 'channel', 'device']}
        columns={['name', 'type', 'role', 'room', 'func']}
        lang={props.lang}
        dragEnabled
        DragWrapper={wrapperState.DragWrapper}
        setObjectsReference={(objects: Record<string, ioBroker.Object>) => objectRef.current = objects}
        levelPadding={10}
    /> : null;
};

export default DragObjectBrowser;
