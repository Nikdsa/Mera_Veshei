document.addEventListener('DOMContentLoaded', () => {
    const calcPopups = document.querySelectorAll('[data-fls-popup="calc"]');
    if (!calcPopups.length) return;

    const frequencyMap = {
        "Почти каждый день": 200,
        "Несколько раз в неделю": 100,
        "Несколько раз в месяц": 30,
        "Пару раз в год": 4
    };

    calcPopups.forEach(popup => {
        const tabsContent = popup.querySelectorAll('.tabs__body');
        if (tabsContent.length < 2) return;
        
        const priceOutput = popup.querySelector('.popup__price span');
        const recommendationOutput = popup.querySelector('.popup__text');

        const getInputValue = (tabBody, keyword) => {
            const labels = Array.from(tabBody.querySelectorAll('.calc-block__label'));
            const targetLabel = labels.find(l => l.textContent.toLowerCase().includes(keyword));
            if (targetLabel) {
                const input = targetLabel.parentElement.querySelector('input.calc-block__input');
                if (input && input.value.trim() !== '') {
                    const parsed = parseFloat(input.value.replace(',', '.').replace(/[^0-9.-]/g, ''));
                    return isNaN(parsed) ? NaN : parsed;
                }
            }
            return NaN;
        };

        const calculate = () => {
            const titles = Array.from(popup.querySelectorAll('.tabs__title'));
            const activeIndex = titles.findIndex(t => t.classList.contains('--tab-active'));
            const activeTab = activeIndex >= 0 ? activeIndex : 0;
            const currentTabBody = tabsContent[activeTab];

            const select = currentTabBody.querySelector('select[name="form[]"]');
            if (!select) return;

            let itemCost = getInputValue(currentTabBody, "стоимость вещи");
            let lifespan = getInputValue(currentTabBody, "срок службы");
            
            const freqText = select.options[select.selectedIndex]?.textContent.trim();
            let frequency = frequencyMap[freqText] || 0;

            if (activeTab === 0) {
                if (isNaN(itemCost) || itemCost <= 0 || isNaN(lifespan) || lifespan <= 0 || isNaN(frequency) || frequency <= 0) {
                    resetOutput();
                    return;
                }
                
                const cpw = itemCost / (frequency * lifespan);
                updateOutput(cpw, itemCost);
                
            } else {
                let additionalFees = getInputValue(currentTabBody, "доплаты");
                let costPerCare = getInputValue(currentTabBody, "стоимость одного ухода");
                let careFrequency = getInputValue(currentTabBody, "частота ухода");

                if (isNaN(itemCost) || itemCost <= 0 || 
                    isNaN(lifespan) || lifespan <= 0 || 
                    isNaN(frequency) || frequency <= 0 ||
                    isNaN(additionalFees) || 
                    isNaN(costPerCare) || 
                    isNaN(careFrequency)) {
                    resetOutput();
                    return;
                }
                
                let totalWears = frequency * lifespan;
                let careCostTotal = 0;
                
                if (careFrequency > 0 && costPerCare > 0) {
                    careCostTotal = (costPerCare / careFrequency) * totalWears;
                }
                
                const numerator = (itemCost + additionalFees) + careCostTotal;
                const denominator = totalWears;
                
                if (denominator <= 0) {
                    resetOutput();
                    return;
                }
                
                const cpw = numerator / denominator;
                updateOutput(cpw, itemCost);
            }
        };

        const resetOutput = () => {
            if (priceOutput) priceOutput.textContent = '0 ₽';
            if (recommendationOutput) recommendationOutput.textContent = 'Заполните все обязательные поля для расчета.';
        };

        const updateOutput = (cpw, itemCost) => {
            if (!priceOutput || !recommendationOutput) return;
            
            if (isNaN(cpw) || !isFinite(cpw)) {
                resetOutput();
                return;
            }

            const formattedCpw = Number.isInteger(cpw) ? cpw.toString() : cpw.toFixed(2);
            priceOutput.textContent = `${formattedCpw} ₽`;

            if (itemCost > 0) {
                const percentage = (cpw / itemCost) * 100;
                
                if (percentage < 1) {
                    recommendationOutput.textContent = "Супер-выгода. Вещь окупается мгновенно, носите чаще!";
                } else if (percentage >= 1 && percentage <= 3) {
                    recommendationOutput.textContent = "Хорошая покупка. Нормальный баланс цены и использования.";
                } else {
                    recommendationOutput.textContent = "Подумайте. Возможно стоит найти дешевле/дольше.";
                }
            } else {
                recommendationOutput.textContent = "";
            }
        };

        popup.addEventListener('input', (e) => {
            if (e.target.classList.contains('calc-block__input')) {
                // Ensure valid numeric input visually
                let val = e.target.value.replace(/[^0-9.,]/g, '');
                if (val !== e.target.value) {
                    e.target.value = val;
                }
                calculate();
            }
        });

        popup.addEventListener('change', (e) => {
            if (e.target.tagName === 'SELECT') {
                calculate();
            }
        });
        
        const titlesNav = popup.querySelector('.tabs__navigation');
        if (titlesNav) {
            titlesNav.addEventListener('click', (e) => {
                if (e.target.classList.contains('tabs__title')) {
                    setTimeout(calculate, 50);
                }
            });
        }
        
        resetOutput();
    });
});
