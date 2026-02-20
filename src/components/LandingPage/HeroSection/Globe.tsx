import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Environment, useTexture, Html } from '@react-three/drei';
import { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import * as THREE from 'three';

// Chat messages with geographic coordinates (lat, lng)
const CHAT_MESSAGES = [
    { text: 'こんにちは!', label: '🇯🇵 Japanese', lat: 36, lng: 138 },
    { text: 'Bonjour!', label: '🇫🇷 French', lat: 47, lng: 2 },
    { text: '你好!', label: '🇨🇳 Chinese', lat: 35, lng: 105 },
    { text: 'Hola!', label: '🇲🇽 Spanish', lat: 23, lng: -102 },
    { text: 'Olá!', label: '🇧🇷 Portuguese', lat: -15, lng: -47 },
    { text: '안녕하세요!', label: '🇰🇷 Korean', lat: 37, lng: 127 },
    { text: 'مرحبا!', label: '🇦🇪 Arabic', lat: 24, lng: 54 },
    { text: 'Hallo!', label: '🇩🇪 German', lat: 51, lng: 10 },
    { text: 'Mabuhay!', label: '🇵🇭 Filipino', lat: 20, lng: 120 },

];

// Convert latitude/longitude to 3D position on sphere
function latLngToPos(lat: number, lng: number, radius: number): [number, number, number] {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return [x, y, z];
}

// Individual chat bubble rendered via Html
const ChatBubble = ({ text, label, position, visible }: {
    text: string;
    label: string;
    position: [number, number, number];
    visible: boolean;
}) => {
    return (
        <Html
            position={position}
            center
            distanceFactor={3}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'scale(1) translateY(0)' : 'scale(0.6) translateY(8px)',
                transition: 'opacity 0.5s ease, transform 0.5s ease',
                pointerEvents: 'none',
            }}
        >
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '8px 12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                border: '1px solid rgba(59,130,245,0.15)',
                whiteSpace: 'nowrap',
                position: 'relative',
                minWidth: '80px',
                textAlign: 'center',
            }}>
                <div style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#1e293b',
                    lineHeight: 1.3,
                    marginBottom: '2px',
                }}>
                    {text}
                </div>
                <div style={{
                    fontSize: '9px',
                    color: '#94a3b8',
                    fontWeight: 500,
                    letterSpacing: '0.03em',
                }}>
                    {label}
                </div>
                {/* Chat tail */}
                <div style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '6px solid white',
                    filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.06))',
                }} />
            </div>
        </Html>
    );
};

// Container that manages bubble visibility based on globe rotation
const ChatBubbles = ({ groupRef }: { groupRef: React.RefObject<THREE.Group | null> }) => {
    const { camera } = useThree();
    const [visibility, setVisibility] = useState<boolean[]>(CHAT_MESSAGES.map(() => false));

    // Pre-compute bubble positions on the sphere (radius=1, matches Sphere args)
    const bubbleData = useMemo(() =>
        CHAT_MESSAGES.map((msg) => ({
            ...msg,
            position: latLngToPos(msg.lat, msg.lng, 1.05), // slightly above sphere surface
        })),
        []
    );

    // Temp vectors to avoid allocations in the render loop
    const tempWorldPos = useMemo(() => new THREE.Vector3(), []);
    const tempCamDir = useMemo(() => new THREE.Vector3(), []);

    useFrame(() => {
        if (!groupRef.current) return;

        const newVisibility = bubbleData.map((bubble) => {
            // Get the bubble's world position by applying the group's transform
            tempWorldPos.set(...bubble.position);
            groupRef.current!.localToWorld(tempWorldPos);

            // Direction from globe center to the bubble (in world space)
            const globeWorldPos = new THREE.Vector3();
            groupRef.current!.getWorldPosition(globeWorldPos);
            const bubbleDir = tempWorldPos.clone().sub(globeWorldPos).normalize();

            // Camera direction toward globe
            tempCamDir.copy(camera.position).sub(globeWorldPos).normalize();

            // Dot product: positive = facing camera
            const dot = bubbleDir.dot(tempCamDir);
            return dot > 0.15; // threshold to fade before edge
        });

        // Only update state if something changed
        setVisibility((prev) => {
            for (let i = 0; i < prev.length; i++) {
                if (prev[i] !== newVisibility[i]) return newVisibility;
            }
            return prev;
        });
    });

    return (
        <>
            {bubbleData.map((bubble, i) => (
                <ChatBubble
                    key={i}
                    text={bubble.text}
                    label={bubble.label}
                    position={bubble.position}
                    visible={visibility[i]}
                />
            ))}
        </>
    );
};

const Earth = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);
    const rawTexture = useTexture('/images/earth-specular.jpg');
    const texture = useMemo(() => rawTexture.clone(), [rawTexture]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/immutability
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = 16;
        texture.needsUpdate = true;
    }, [texture]);

    // Smooth clock-based rotation (frame-rate independent)
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.10;
        }
    });

    return (
        <group rotation={[0, 0, 0.4]}>
            <group ref={groupRef} scale={2.5} position={[0, -1.5, 0]}>
                <Sphere args={[1, 64, 64]} ref={meshRef}>
                    {/* Inner Sphere: Continents (Dark Blue - Theme) */}
                    <meshStandardMaterial
                        color="#3b82f5" // Land Color (Base)
                        emissive="#ffffff" // Ocean Color (Glow)
                        emissiveMap={texture}
                        emissiveIntensity={2.0}
                        roughness={0.8}
                        metalness={0.1}
                        side={THREE.DoubleSide}
                        onBeforeCompile={(shader) => {
                            shader.uniforms.bboxMin = { value: new THREE.Vector3(0, -1, 0) };
                            shader.uniforms.bboxMax = { value: new THREE.Vector3(0, 1, 0) };
                            shader.uniforms.gradientColorA = { value: new THREE.Color("#3b82f5") }; // Dark Blue
                            shader.uniforms.gradientColorB = { value: new THREE.Color("#ffffff") }; // White

                            shader.fragmentShader = `
                                uniform vec3 bboxMin;
                                uniform vec3 bboxMax;
                                uniform vec3 gradientColorA;
                                uniform vec3 gradientColorB;
                                ` + shader.fragmentShader;

                            shader.fragmentShader = shader.fragmentShader.replace(
                                '#include <emissivemap_fragment>',
                                `
                                #ifdef USE_EMISSIVEMAP
                                    vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
                                    
                                    // Calculate gradient factor based on Y position (world or local space)
                                    // Since it's a sphere, vViewPosition is view space. Let's use vNormal or vPosition if available.
                                    // Standard material usually has vViewPosition.
                                    // Let's rely on vNormal.y for a sphere which approximates localized Y.
                                    // Or better, let's just pass a varying from vertex shader if needed.
                                    // BUT, simpler: Use the existing emissive logic but modulate the color.
                                    
                                    // Actually, let's use a simpler approach using the view-space position or just normal.
                                    // For a perfect vertical gradient on the sphere in local space, we need local Y.
                                    // vNormal.y is good enough for a sphere at (0,0,0).
                                    
                            // Flip gradient: Top (1.0) = Blue (A), Bottom (-1.0) = White (B)
                                    // Current: 0 -> A, 1 -> B
                                    // We want mix(B, A, factor) where factor goes 0->1 as Y goes -1->1
                                    // Or factor goes 1->0 as Y goes -1->1?
                                    // Let's use simple mix(White, Blue, factor) where factor is high at Top.
                                    
                                    float gradientFactor = smoothstep(-1.0, 1.0, vNormal.y);
                                    
                                    // Mix White (Bottom) -> Blue (Top)
                                    vec3 gradient = mix(gradientColorB, gradientColorA, gradientFactor);
                                    
                                    // Apply gradient to the emissive color (Ocean)
                                    // Reduce intensity slightly to match background's 50% opacity look
                                    totalEmissiveRadiance *= emissiveColor.rgb * gradient * 0.8;
                                #endif
                                `
                            );
                        }}
                    />
                </Sphere>
                <ChatBubbles groupRef={groupRef} />
            </group>
        </group>
    );
};

export const Globe = () => {
    const [webGLAvailable, setWebGLAvailable] = useState<boolean | null>(null);

    useEffect(() => {
        try {
            const testCanvas = document.createElement('canvas');
            const ctx =
                (testCanvas.getContext('webgl') as WebGLRenderingContext | null) ||
                (testCanvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
            const available = !!(window.WebGLRenderingContext && ctx);
            // Release the test context immediately so it doesn't compete with Three.js
            if (ctx) {
                const ext = ctx.getExtension('WEBGL_lose_context');
                if (ext) ext.loseContext();
            }
            setWebGLAvailable(available);
        } catch {
            setWebGLAvailable(false);
        }
    }, []);

    // Render nothing until we know WebGL is available
    if (webGLAvailable === null || !webGLAvailable) {
        return null;
    }

    return (
        <div className="absolute inset-0 z-0 h-full w-full pointer-events-none overflow-hidden">
            {/* Suspense catches useTexture's thrown Promise so there's no white flash */}
            <Suspense fallback={null}>
                <Canvas camera={{ position: [0, 0, 5], fov: 35 }} style={{ background: 'transparent' }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1.2} />
                    <Earth />
                    <Environment preset="city" />
                </Canvas>
            </Suspense>
        </div>
    );
};