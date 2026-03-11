import * as THREE from 'three';

const API_BASE_URL = '';

let scene, camera, renderer, particleSystem;
let particlesActive = false;
let animationId;

function initThreeJS() {
    const container = document.getElementById('three-container');
    
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    createParticleSystem();
    
    window.addEventListener('resize', onWindowResize);
}

function createParticleSystem() {
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const colorEmerald = new THREE.Color(0x00643C);
    const colorLightGreen = new THREE.Color(0x00C06C);
    const colorWhite = new THREE.Color(0xE5E4E2);
    
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        const radius = 1 + Math.random() * 3;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);
        
        let color;
        const rand = Math.random();
        if (rand < 0.45) {
            color = colorEmerald;
        } else if (rand < 0.90) {
            color = colorLightGreen;
        } else {
            color = colorWhite;
        }
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // 创建粒子纹理
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();
    
    const texture = new THREE.CanvasTexture(canvas);
    
    const material = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        map: texture,
        depthWrite: false
    });
    
    particleSystem = new THREE.Points(geometry, material);
    particleSystem.visible = false;
    scene.add(particleSystem);
}

function startParticleAnimation() {
    if (!particleSystem) return;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    const container = document.getElementById('three-container');
    container.classList.add('active');
    
    const tabsContainer = document.querySelector('.tabs-container');
    if (tabsContainer) {
        tabsContainer.style.opacity = '0';
        tabsContainer.style.visibility = 'hidden';
        tabsContainer.style.transform = 'scale(0.8)';
        tabsContainer.style.transition = 'all 0.3s ease';
    }
    
    particlesActive = true;
    particleSystem.visible = true;
    
    renderer.render(scene, camera);
    
    function animate() {
        if (!particlesActive) {
            animationId = null;
            return;
        }
        
        animationId = requestAnimationFrame(animate);
        
        particleSystem.rotation.x += 0.005;
        particleSystem.rotation.y += 0.01;
        
        const positions = particleSystem.geometry.attributes.position.array;
        const time = Date.now() * 0.001;
        
        for (let i = 0; i < positions.length; i += 3) {
            const i3 = i;
            const radius = Math.sqrt(positions[i3] ** 2 + positions[i3 + 1] ** 2 + positions[i3 + 2] ** 2);
            const angle = time + i * 0.01;
            
            positions[i3] = radius * Math.sin(angle) * Math.cos(angle * 0.5);
            positions[i3 + 1] = radius * Math.sin(angle) * Math.sin(angle * 0.5);
            positions[i3 + 2] = radius * Math.cos(angle);
        }
        
        particleSystem.geometry.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
    }
    
    animate();
}

function stopParticleAnimation() {
    particlesActive = false;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    if (particleSystem) {
        particleSystem.visible = false;
    }
    
    const container = document.getElementById('three-container');
    container.classList.remove('active');
    
    const tabsContainer = document.querySelector('.tabs-container');
    if (tabsContainer) {
        tabsContainer.style.opacity = '1';
        tabsContainer.style.visibility = 'visible';
        tabsContainer.style.transform = 'scale(1)';
        tabsContainer.style.transition = 'all 0.3s ease';
    }
    
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 初始化
console.log('Initializing AI World particle effect...');
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded');
    
    initThreeJS();
    
    const logo = document.querySelector('.logo');
    const cards = document.querySelectorAll('.card');
    
    console.log('Logo element:', logo);
    console.log('Cards found:', cards.length);
    
    function fadeOutCards() {
        cards.forEach(card => {
            card.classList.add('fade-out');
        });
    }
    
    function fadeInCards() {
        cards.forEach(card => {
            card.classList.remove('fade-out');
        });
    }
    
    let particleTimer;
    
    if (logo) {
        console.log('Adding click event to logo...');
        logo.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Logo clicked! Particles active:', particlesActive);
            
            if (particlesActive) {
                console.log('Stopping particle animation...');
                stopParticleAnimation();
                fadeInCards();
                if (particleTimer) {
                    clearTimeout(particleTimer);
                    particleTimer = null;
                }
            } else {
                console.log('Starting particle animation...');
                fadeOutCards();
                startParticleAnimation();
                
                particleTimer = setTimeout(() => {
                    console.log('Auto-stopping particle animation...');
                    stopParticleAnimation();
                    fadeInCards();
                    particleTimer = null;
                }, 30000);
            }
        });
    }
    
    document.addEventListener('click', (e) => {
        if (particlesActive && e.target !== logo) {
            console.log('Click outside logo, stopping particles...');
            stopParticleAnimation();
            fadeInCards();
            if (particleTimer) {
                clearTimeout(particleTimer);
                particleTimer = null;
            }
        }
    });
    
    console.log('Initialization complete!');
});
