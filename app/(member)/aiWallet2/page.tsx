'use client'
import { useRef, useEffect } from 'react';

export default function Aiwallet2() {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    window.open("file:///Users/jungdawoon/ku-master/child.html")
    
    useEffect(() => {
        const channel = new MessageChannel();

        const loadHandler = () => {
            if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage('Hello from Parent', '*', [channel.port2]);
            }
        };

        if (iframeRef.current) {
            iframeRef.current.addEventListener('load', loadHandler);
        }

        channel.port1.onmessage = (e) => console.log('Message from Child:', e.data);

        return () => {
            if (iframeRef.current) {
                iframeRef.current.removeEventListener('load', loadHandler);
            }
        };
    }, []);

    return (
        <div>
            <h1>부모 페이지</h1>
            <iframe src="https://ipfs.io/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/wiki/Aardvark.html" ref={iframeRef} id="childFrame"></iframe>
        </div>
    );
};
