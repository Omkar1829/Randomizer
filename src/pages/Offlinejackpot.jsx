import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import spinner from '/pngwing.com.svg';

const Offlinejackpot = () => {
    const navigate = useNavigate();
    const [isSpinning, setIsSpinning] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [removeWinner, setRemoveWinner] = useState(false);
    const [enableSound, setEnableSound] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [forcedWinners, setForcedWinners] = useState([]);
    const [currentWinner, setCurrentWinner] = useState(null);
    const [customNamesInput, setCustomNamesInput] = useState('');
    const [customNames, setCustomNames] = useState([]);
    const [winners, setWinners] = useState([]);
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        const storedWinners = localStorage.getItem('winners');
        setWinners(storedWinners ? JSON.parse(storedWinners) : []);

        const storedCustom = localStorage.getItem('customNames');
        if (storedCustom) {
            const parsed = JSON.parse(storedCustom);
            setCustomNames(parsed);
            setCustomNamesInput(parsed.map(n => n.name).join('\n'));
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isSpinning) return;
            if (e.key === ' ' || e.key === '1' || e.key === '2' || e.key === '3') {
                drawWinner();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSpinning, winners, customNames, forcedWinners]);

    useEffect(() => {
        if (showCelebration) {
            const interval = setInterval(() => {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 1 });
            }, 800);
            return () => clearInterval(interval);
        }
    }, [showCelebration]);

    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
      @keyframes slideRight {
        0% { transform: translateX(100%); opacity: 0; }
        100% { transform: translateX(0); opacity: 1; }
      }
      @keyframes spin-slow {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .animate-spin-slow {
        animation: spin-slow 15s linear infinite;
      }
    `;
        document.head.appendChild(style);
    }, []);

    useEffect(() => {
        const arr = customNamesInput
            .split('\n')
            .map(n => n.trim())
            .filter(Boolean)
            .map(name => ({ name, city: '', flag: 'custom' }));
        setCustomNames(arr);
        localStorage.setItem('customNames', JSON.stringify(arr));
    }, [customNamesInput]);

    const drawWinner = () => {
        if (isSpinning || customNames.length === 0) {
            if (!customNames.length) alert("No names in the list!");
            return;
        }
        setShowCelebration(false);
        setIsSpinning(true);
        const container = scrollContainerRef.current;
        container.style.transition = 'none';
        container.style.transform = 'translateY(0)';
        container.innerHTML = '';

        const winnerNames = winners.map(w => w.name);
        let eligibleList = customNames.filter(entry => !winnerNames.includes(entry.name));

        const shuffledSpin = [...customNames].sort(() => 0.5 - Math.random());
        const spinCycles = 10;
        for (let i = 0; i < spinCycles; i++) {
            shuffledSpin.forEach(entry => {
                const p = document.createElement('p');
                p.className = 'text-3xl font-bold text-center w-full flex items-center justify-center h-[100px] text-black';
                p.textContent = entry.name;
                container.appendChild(p);
            });
        }

        let winner;
        if (eligibleList.length === 0) {
            winner = customNames[Math.floor(Math.random() * customNames.length)];
        } else if (forcedWinners.length > 0) {
            const candidate = forcedWinners[0];
            const found = eligibleList.find(e => e.name === candidate);
            if (found) {
                winner = found;
                setForcedWinners(prev => prev.slice(1));
            } else {
                setForcedWinners(prev => prev.slice(1));
                winner = eligibleList[Math.floor(Math.random() * eligibleList.length)];
            }
        } else {
            winner = eligibleList[Math.floor(Math.random() * eligibleList.length)];
        }

        let winnerIndex = shuffledSpin.findIndex(n => n.name === winner.name);
        if (winnerIndex === -1) winnerIndex = Math.floor(Math.random() * shuffledSpin.length);
        const scrollOffset = ((shuffledSpin.length * (spinCycles - 1)) + winnerIndex) * 100;

        requestAnimationFrame(() => {
            container.style.transition = 'transform 6s cubic-bezier(0.33, 1, 0.68, 1)';
            container.style.transform = `translateY(-${scrollOffset}px)`;
        });

        setTimeout(() => {
            if (removeWinner) {
                setCustomNames(prev => prev.filter(entry => entry.name !== winner.name));
                localStorage.setItem('customNames', JSON.stringify(customNames.filter(entry => entry.name !== winner.name)));
            }
            setShowCelebration(true);
            setWinners(prev => {
                const updated = [...prev, winner];
                localStorage.setItem('winners', JSON.stringify(updated));
                return updated;
            });
            if (enableSound) {
                const audio = new Audio(
                    'https://cdn.pixabay.com/download/audio/2022/10/26/audio_a9e63c5d94.mp3?filename=success-1-6297.mp3'
                );
                audio.play();
            }
            setIsSpinning(false);
            setCurrentWinner(winner.name);
        }, 6000);
    };

    const exportCSV = () => {
        const csv = ["name,city,flag", ...winners.map(n => `${n.name},${n.city},${n.flag}`)].join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lucky_draw_winners.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const importCSV = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split('\n').slice(1); // skip header
            const data = lines.map(line => {
                const [name, city, flag] = line.split(',');
                return name ? { name, city, flag } : null;
            }).filter(Boolean);
            setCustomNames(data);
            setCustomNamesInput(data.map(n => n.name).join('\n'));
            localStorage.setItem('customNames', JSON.stringify(data));
        };
        reader.readAsText(file);
    };

    const openSettings = () => setShowSettings(true);
    const closeSettings = () => setShowSettings(false);
    const saveSettings = () => closeSettings();

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-evenly overflow-hidden text-white font-sans"
            style={{
                background: "#ffffff",
            }}
            // 'linear-gradient(240deg, #ff462d .13%, #ff422f 26.19%, #ff3634 52.6%, #ff223c 79.08%, #ff0c45)',
            >
                <img src="/Tech-Saga-Logo-01.png" className='fixed top-5 right-5 w-[120px] h-[80px]' />
            {/* Top Buttons */}
            <div className="absolute top-4 right-4 flex gap-3 z-20">
                <button
                    onClick={() =>
                        !document.fullscreenElement
                            ? document.documentElement.requestFullscreen()
                            : document.exitFullscreen()
                    }
                    className="text-white text-2xl"
                >
                    ⛶
                </button>
                <button onClick={openSettings} className="text-white text-2xl">⚙️</button>
            </div>
            <div className="absolute top-4 left-4 flex gap-3 z-20">
                <button onClick={() => navigate('/')} style={{ opacity: '100%' }} className="text-white text-2xl cursor-pointer">O</button>
                <button onClick={() => navigate('/megadraw')} style={{ opacity: '100%' }} className="text-white text-2xl cursor-pointer">M</button>
            </div>

            {/* Rotating SVG */}
            <div className={`absolute z-0 opacity-20  ${showCelebration ? 'animate-spin-slow block' : 'hidden'}`}>
                <img src={spinner} alt="rotating svg" />
            </div>

            {/* Title */}
            <div className="relative w-full flex flex-col items-center justify-center text-center z-10">
                <h1 className="text-[73px] font-bold mb-10 text-yellow-400 drop-shadow fixed">Lucky Draw</h1>
                <h1 className="text-[70px] font-bold mb-10 text-[#b19631] drop-shadow fixed">Lucky Draw</h1>
            </div>

            {/* Winner Box */}
            <div className="relative d-flex items-center justify-center">
                <div className="relative mt-[80px] w-[700px] h-[100px] overflow-hidden outline-yellow-400 rounded-xl outline-[30px] bg-white shadow-2xl z-10">
                    <div
                        ref={scrollContainerRef}
                        className="flex flex-col items-center justify-start leading-[60px] will-change-transform"
                    ></div>
                </div>
            </div>

            {/* Draw Button */}
            <button
                onClick={drawWinner}
                className="mt-10 bg-yellow-400 hover:bg-yellow-300 text-white text-3xl font-bold py-2 px-5 rounded-lg shadow-black shadow-2xl z-10"
            >
                Draw
            </button>

            {/* Settings Panel */}
            {showSettings && (
                <div className="fixed inset-0 z-30 bg-red-700 text-white flex items-center justify-end">
                    <div className="w-full sm:w-[400px] h-full p-6 shadow-xl bg-red-700 overflow-y-auto" style={{ animation: 'slideRight 0.3s ease-out forwards' }}>
                        <h2 className="text-2xl font-bold mb-4">Settings</h2>
                        <div className="flex flex-col gap-2 mb-4">
                            <label className="font-bold">Custom Names (one per line):</label>
                            <textarea
                                value={customNamesInput}
                                onChange={e => setCustomNamesInput(e.target.value)}
                                rows={5}
                                className="w-full p-2 rounded text-black bg-white "
                                placeholder="Enter names, one per line"
                            />
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <label>Remove winner from list</label>
                            <input type="checkbox" checked={removeWinner} onChange={(e) => setRemoveWinner(e.target.checked)} className="scale-125" />
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <label>Enable sound effect</label>
                            <input type="checkbox" checked={enableSound} onChange={(e) => setEnableSound(e.target.checked)} className="scale-125" />
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <button onClick={exportCSV} className="bg-yellow-400 hover:bg-yellow-300 px-4 py-1 rounded text-black font-bold">Export CSV</button>
                            <label className="bg-yellow-400 hover:bg-yellow-300 px-4 py-1 rounded text-black font-bold cursor-pointer">
                                Import CSV
                                <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
                            </label>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={closeSettings} className="bg-gray-300 hover:bg-gray-400 px-4 py-1 rounded text-black">Close</button>
                            <button onClick={saveSettings} className="bg-yellow-400 hover:bg-yellow-300 px-4 py-1 rounded text-black font-bold">Save</button>
                        </div>
                        <div className="mt-6">
                            <h2 className="text-xl font-bold mb-2">Past Winners</h2>
                            <ul className="max-h-40 overflow-y-auto list-disc pl-5">
                                {winners.map((winner, i) => <li key={i}>{winner.name}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Offlinejackpot;
