import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import spinner from '/pngwing.com.svg';
import namebox from '/nameBox.png';

const Gamepage = () => {
  const navigate = useNavigate();
  const [names, setNames] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [nameListInput, setNameListInput] = useState('');
  const [removeWinner, setRemoveWinner] = useState(false);
  const [enableSound, setEnableSound] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [forcedWinnerInput, setForcedWinnerInput] = useState('');
  const [forcedWinners, setForcedWinners] = useState([]);
  const [currentWinner, setCurrentWinner] = useState(null);
  const [customNamesInput, setCustomNamesInput] = useState('');
  const [useCustomNames, setUseCustomNames] = useState(false);
  const [customNames, setCustomNames] = useState([]);
  const [drawMode, setDrawMode] = useState(3); // 1: Pune, 2: Non-Pune, 3: All
  const [winners, setWinners] = useState(() => {
    const stored = localStorage.getItem('winners');
    return stored ? JSON.parse(stored) : [];
  });

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    fetch('https://eventapi.snapgrab.in/api/game/employees?eventID=4')
      .then(response => response.json())
      .then(data => {
        if (data.Status === 200 && data.data) {
          const storedNames = localStorage.getItem('allNames');
          const existingNames = storedNames ? JSON.parse(storedNames) : [];
          const existingNameSet = new Set(existingNames.map(entry => entry.name.toLowerCase()));

          const newNames = data.data
            .filter(employee => !existingNameSet.has(employee.Name.toLowerCase()))
            .map(employee => ({
              name: employee.Name,
              city: employee.City,
              flag: '',
              empId: employee.EmpID
            }));

          const updatedNames = [...existingNames, ...newNames];
          localStorage.setItem('allNames', JSON.stringify(updatedNames));
          setNames(updatedNames);
        }
      })
      .catch(error => console.error('Error fetching employees:', error));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isSpinning) return;
      if (e.key === '1' || e.key === '2' || e.key === '3') {
        let mode = 3;
        if (e.key === '1') mode = 1;
        else if (e.key === '2') mode = 2;
        setDrawMode(mode);
        drawWinner(mode);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpinning, winners, names, customNames, useCustomNames, forcedWinners]);

  useEffect(() => {
    if (showCelebration) {
      let count = 0;
      const maxBursts = 5;
      const interval = setInterval(() => {
        if (count < maxBursts) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 1 });
          count++;
        } else {
          clearInterval(interval);
        }
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
  }, [customNamesInput]);

  const drawWinner = (mode = drawMode) => {
    if (isSpinning || names.length === 0) {
      if (!names.length) alert("No names in the list!");
      return;
    }
    setShowCelebration(false);
    setIsSpinning(true);
    const container = scrollContainerRef.current;
    container.style.transition = 'none';
    container.style.transform = 'translateY(0)';
    container.innerHTML = '';

    const winnerNames = winners.map(w => w.name);
    let eligibleList;
    if (useCustomNames && customNames.length > 0) {
      eligibleList = customNames.filter(entry => !winnerNames.includes(entry.name));
    } else {
      eligibleList = names.filter(entry => {
        if (winnerNames.includes(entry.name)) return false;
        if (mode === 1) return entry.city.toLowerCase() === 'pune';
        if (mode === 2) return entry.city.toLowerCase() !== 'pune';
        return true;
      });
    }
    let spinList = names;
    const shuffledSpin = [...spinList].sort(() => 0.5 - Math.random());
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
      winner = spinList[Math.floor(Math.random() * spinList.length)];
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
      fetch('https://eventapi.snapgrab.in/api/game/set-winner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventID: "4",
          empId: winner.empId
        })
      })
        .then(response => response.json())
        .then(data => console.log('Winner declared:', data))
        .catch(error => console.error('Error declaring winner:', error));

      setNames(prev => prev.filter(entry => entry.name !== winner.name));
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

  const openSettings = () => setShowSettings(true);
  const closeSettings = () => setShowSettings(false);
  const saveSettings = () => closeSettings();
  const exportCSV = () => {
    const csv = ["name,city,flag,empId", ...names.map(n => `${n.name},${n.city},${n.flag},${n.empId}`)].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lucky_draw_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  const importCSV = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').slice(1);
      const data = lines.map(line => {
        const [name, city, flag, empId] = line.split(',');
        return name ? { name, city, flag, empId } : null;
      }).filter(Boolean);
      setNames(data);
    };
    reader.readAsText(file);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-evenly overflow-hidden text-white font-sans"
      style={{
        background: '#ffffff',
      }}
      // 'linear-gradient(240deg, #ff462d .13%, #ff422f 26.19%, #ff3634 52.6%, #ff223c 79.08%, #ff0c45)',
    >
        <img src="/Tech-Saga-Logo-01.png" className='fixed top-5 right-5 w- w-[230px] h-[150px]' />
      <div className="absolute top-1 right-4 flex gap-3 z-20">
        <button onClick={openSettings} style={{ opacity: '10%' }} className="text-white text-2xl cursor-pointer">⚙️</button>
        <button
          onClick={() =>
            !document.fullscreenElement
              ? document.documentElement.requestFullscreen()
              : document.exitFullscreen()
          }
          className="text-white text-2xl cursor-pointer"
        >
          ⛶
        </button>
      </div>
      <div className="absolute top-4 left-4 flex gap-3 z-20">
        <button onClick={() => navigate('/offline')} style={{ opacity: '10%' }} className="text-white text-2xl cursor-pointer">O</button>
        <button onClick={() => navigate('/megadraw')} style={{ opacity: '10%' }} className="text-white text-2xl cursor-pointer">M</button>
      </div>

      <div className={`absolute z-0 opacity-20  ${showCelebration ? 'animate-spin-slow block' : 'hidden'}`}>
        <img src={spinner} alt="rotating svg" />
      </div>

      <div className="relative w-full flex flex-col items-center justify-center text-center z-10">
        <h1 className="text-[73px] font-bold mb-10 text-yellow-400 drop-shadow fixed">Lucky Draw</h1>
        <h1 className="text-[70px] font-bold mb-10 text-[#b19631] drop-shadow fixed">Lucky Draw</h1>
      </div>

      <div className="relative d-flex items-center justify-center">
        <div className="relative mt-[80px] w-[700px] h-[100px] overflow-hidden outline-yellow-400 rounded-xl outline-[30px] bg-white shadow-2xl z-10">
          <div
            ref={scrollContainerRef}
            className="flex flex-col items-center justify-start leading-[60px] will-change-transform"
          ></div>
        </div>
      </div>

      <button
        onClick={drawWinner}
        className="mt-10 bg-yellow-400 hover:bg-yellow-300 text-white text-3xl font-bold py-2 px-5 rounded-lg shadow-black shadow-2xl z-10"
      >
        Draw
      </button>

      {showSettings && (
        <div className="fixed inset-0 z-30 bg464-red-700 text-white flex items-center justify-end">
          <div className="w-full sm:w-[400px] h-full p-6 shadow-xl bg-red-700 overflow-y-auto" style={{ animation: 'slideRight 0.3s ease-out forwards' }}>
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <div className="flex flex-col gap-2 mb-4">
              <label className="font-bold">Custom Names (one per line):</label>
              <textarea
                value={customNamesInput}
                onChange={e => setCustomNamesInput(e.target.value)}
                rows={5}
                className="w-full p-2 rounded text-black"
                placeholder="Enter names, one per line"
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={useCustomNames}
                  onChange={e => setUseCustomNames(e.target.checked)}
                  className="scale-125"
                  id="useCustomNames"
                />
                <label htmlFor="useCustomNames">Spin from custom names only</label>
              </div>
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

export default Gamepage;