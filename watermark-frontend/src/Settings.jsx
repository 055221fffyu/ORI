import { useState, useRef } from 'react'

export default function Settings() {
    const [customColor, setCustomColor] = useState(
        localStorage.getItem('primaryColor') || '#f97316'
    )
    
    // 用來引用隱藏的 input 元素
    const colorInputRef = useRef(null)

    const handleColorChange = (colorCode) => {
        setCustomColor(colorCode)
        document.documentElement.style.setProperty('--primary-color', colorCode)
        localStorage.setItem('primaryColor', colorCode)
    }

    // 預設顏色選項
    const presetThemes = [
        { name: '活力橘', code: '#f97316' },
        { name: '科技藍', code: '#2563eb' },
        { name: '森林綠', code: '#16a34a' },
        { name: '沉穩灰', code: '#4b5563' }
    ]

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-1">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black mb-6 dark:text-white">系統設定</h2>
            <span className="text-xs text-gray-400 font-mono uppercase tracking-widest">Version 1.0</span>
        </div>
        
        <div className="bg-white p-10 rounded-[32px] shadow-sm space-y-12 transition-colors">
            
            {/* 快速預設顏色 */}
            <div>
            <p className="font-bold mb-5 text-gray-700">快速預設主題</p>
            <div className="flex gap-5">
                {presetThemes.map(color => {
                const isSelected = customColor.toUpperCase() === color.code.toUpperCase();
                return (
                    <button 
                    key={color.code} 
                    onClick={() => handleColorChange(color.code)}
                    className={`relative w-14 h-14 rounded-full transition-all duration-300 ${isSelected ? 'scale-110 shadow-lg' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color.code }}
                    >
                    {/* 選中狀態的白邊 */}
                    {isSelected && (
                        <div className="absolute inset-0 rounded-full border-4 border-white shadow-inner" />
                    )}
                    {/* 提示文字 */}
                    <span className={`absolute -bottom-7 left-1/2 -translate-x-1/2 text-[11px] font-black uppercase whitespace-nowrap tracking-widest ${isSelected ? 'text-primary' : 'text-gray-400'}`}>
                        {color.name}
                    </span>
                    </button>
                );
                })}
            </div>
            </div>

            <hr className="border-gray-100" />

            {/* 2. 自定義調色盤 */}
            <div>
            <p className="font-bold mb-5 text-gray-700">完全自定義顏色</p>
            {/* 自定義顏色區塊：已移除 border border-gray-100 */}
            <div className="flex items-center gap-8 bg-gray-50 p-6 rounded-3xl">
                
                {/* 這裡就是代理原生 input 的精美圓圈 */}
                <div className="relative group flex-shrink-0">
                {/* 原生無聊 input 被藏起來 */}
                <input 
                    type="color" 
                    ref={colorInputRef}
                    value={customColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                
                {/* 用這層代理呈現外觀 */}
                <div 
                    className="w-24 h-24 rounded-full cursor-pointer shadow-lg shadow-black/10 border-4 border-white group-hover:scale-105 transition active:scale-95"
                    style={{ backgroundColor: customColor }}
                />
                {/* 微小的內陰影，增加立體感 */}
                <div className="absolute inset-0 rounded-full border border-black/5 opacity-10" />
                </div>
                
                <div className="flex-1 space-y-3">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">目前色碼 (HEX)</p>
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-mono uppercase text-primary font-black tracking-tighter">
                    {customColor}
                    </span>
                    {/* 隱藏輸入框，只保留顯示 */}
                    <input 
                    type="text" 
                    value={customColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="hidden" 
                    />
                </div>
                <button 
                    onClick={() => colorInputRef.current.click()} // 代理點擊
                    className="text-xs text-primary font-bold px-4 py-1.5 bg-primary/10 rounded-full hover:bg-primary/20 transition"
                >
                    開啟調色盤
                </button>
                </div>
            </div>
            </div>

        </div>
        </div>
    )
}