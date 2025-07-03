document.addEventListener('DOMContentLoaded', () => {
    // Lấy các phần tử HTML
    const fileInput = document.getElementById('json-file-input');
    const editorSection = document.getElementById('editor-section');
    const downloadSection = document.getElementById('download-section');
    const plantSearchInput = document.getElementById('plant-search-input');
    const statsEditor = document.getElementById('stats-editor');
    const downloadBtn = document.getElementById('download-btn');
    const editedPlantsSection = document.getElementById('edited-plants-section');
    const editedPlantsList = document.getElementById('edited-plants-list');

    // Các phần tử của menu tùy chỉnh
    const customSelectContainer = document.querySelector('.custom-select-container');
    const selectedDisplay = document.getElementById('custom-select-selected');
    const optionsContainer = document.getElementById('custom-select-options');

    let plantData = null;
    let editedPlants = new Set();

    const statTranslations = {
        'Hitpoints': 'Máu (HP)', 'Cost': 'Chi phí (Mặt trời)', 'PacketCooldown': 'Hồi chiêu (giây)',
        'StartingCooldown': 'Hồi chiêu ban đầu', 'LevelCap': 'Cấp tối đa', 'SeedPacketCost': 'Chi phí gói hạt',
        'ActionDamageNormal': 'Sát thương cơ bản', 'ActionDamage': 'Sát thương cơ bản',
        'ActionDamagePF': 'Sát thương Plant Food', 'ActionDamagePlantfood': 'Sát thương Plant Food',
        'ActionXVelocity': 'Tốc độ đạn', 'PlantFoodDurationSeconds': 'Thời gian hiệu lực Plant Food',
        'Potatomine_ArmingTime': 'Thời gian kích hoạt (Potato Mine)', 'Kernelpult_ButterDuration': 'Thời gian làm choáng (Bơ)',
        'Chomper_ChewTimeSeconds': 'Thời gian nhai (Chomper)', 'SunflowerSunProduction': 'Sản lượng mặt trời (Tham chiếu)',
        'WallnutShield': 'Giáp Plant Food (Tham chiếu)',
    };

    // Xử lý khi người dùng tải file lên
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                plantData = JSON.parse(e.target.result);
                editedPlants.clear();
                updateEditedPlantsList();
                editorSection.style.display = 'block';
                downloadSection.style.display = 'block';
                populateCustomSelect(plantData.objects);
            } catch (error) {
                alert('Lỗi: File JSON không hợp lệ.');
                console.error("Lỗi phân tích JSON:", error);
            }
        };
        reader.readAsText(file);
    });

    // Xử lý tìm kiếm cây
    plantSearchInput.addEventListener('input', () => {
        if (!plantData) return;
        const searchTerm = plantSearchInput.value.toLowerCase();
        const filteredPlants = plantData.objects.filter(plant =>
            plant.aliases[0].toLowerCase().includes(searchTerm)
        );
        populateCustomSelect(filteredPlants);
    });

    // Mở danh sách khi click (focus) vào ô tìm kiếm
    plantSearchInput.addEventListener('focus', () => {
        optionsContainer.classList.remove('custom-select-hide');
    });

    // Tạo danh sách cây tùy chỉnh
    function populateCustomSelect(plantList) {
        optionsContainer.innerHTML = '';
        if (plantList) {
            plantList.forEach((plant) => {
                const plantName = plant.aliases[0];
                const optionDiv = document.createElement('div');
                optionDiv.className = 'custom-select-option';
                optionDiv.dataset.value = plantName;

                const img = document.createElement('img');
                img.src = `./images/${plantName}.png`;
                img.alt = plantName;
                img.onerror = () => { img.style.display = 'none'; };

                const span = document.createElement('span');
                span.textContent = plantName;

                optionDiv.appendChild(img);
                optionDiv.appendChild(span);

                optionDiv.addEventListener('click', () => {
                    selectedDisplay.innerHTML = optionDiv.innerHTML;
                    customSelectContainer.dataset.selectedValue = plantName;
                    optionsContainer.classList.add('custom-select-hide');
                    displayPlantEditor(plantName);
                });

                optionsContainer.appendChild(optionDiv);
            });
        }
    }

    // Đóng/Mở menu
    selectedDisplay.addEventListener('click', () => {
        optionsContainer.classList.toggle('custom-select-hide');
    });

    // Đóng menu khi click ra ngoài (ĐÃ SỬA LỖI)
    window.addEventListener('click', (e) => {
        if (!customSelectContainer.contains(e.target) && e.target !== plantSearchInput) {
            optionsContainer.classList.add('custom-select-hide');
        }
    });

    // Hiển thị trình chỉnh sửa
    function displayPlantEditor(plantName) {
        statsEditor.innerHTML = '';
        const plantObject = plantData.objects.find(p => p.aliases[0] === plantName);
        if (!plantObject) return;

        const data = plantObject.objdata;
        const mainStatsGroup = createStatGroup('');
        mainStatsGroup.querySelector('h3').innerHTML = `
            <img src="./images/${plantName}.png" class="title-plant-icon" alt="${plantName}">
            Chỉ số chính: ${plantName}
        `;
        const mainStatsContainer = document.createElement('div');
        mainStatsContainer.className = 'main-stats-container';

        if (data.hasOwnProperty('LevelCap')) {
            const itemDiv = document.createElement('div'); itemDiv.className = 'main-stat-item';
            const label = document.createElement('label'); label.textContent = statTranslations['LevelCap'] || 'LevelCap';
            const input = document.createElement('input'); input.type = 'number'; input.value = data.LevelCap; input.readOnly = true;
            itemDiv.appendChild(label); itemDiv.appendChild(input); mainStatsContainer.appendChild(itemDiv);
        }

        if (data.hasOwnProperty('SeedPacketCost')) {
            const itemDiv = document.createElement('div'); itemDiv.className = 'main-stat-item';
            const label = document.createElement('label'); label.textContent = statTranslations['SeedPacketCost'] || 'SeedPacketCost';
            const input = document.createElement('input'); input.type = 'number'; input.value = data.SeedPacketCost;
            input.addEventListener('change', (e) => {
                data.SeedPacketCost = parseInt(e.target.value, 10);
                addPlantToEditedList(plantName);
            });
            itemDiv.appendChild(label); itemDiv.appendChild(input); mainStatsContainer.appendChild(itemDiv);
        }

        mainStatsGroup.appendChild(mainStatsContainer);
        statsEditor.appendChild(mainStatsGroup);

        const floatStatsGroup = createStatGroup('Thuộc tính dạng số (FloatStats)');
        const stringStatsGroup = createStatGroup('Thuộc tính dạng chữ (StringStats)');

        if (data.FloatStats) { data.FloatStats.forEach((stat) => { floatStatsGroup.appendChild(createStatItem(plantName, stat.Name, stat.Values, (levelIndex, newValue) => { stat.Values[levelIndex] = parseFloat(newValue); }, 'number')); }); }
        if (data.StringStats) { data.StringStats.forEach((stat) => { stringStatsGroup.appendChild(createStatItem(plantName, stat.Name, stat.Values, (levelIndex, newValue) => { stat.Values[levelIndex] = newValue; }, 'text', 'string_layout')); }); }

        statsEditor.appendChild(floatStatsGroup);
        statsEditor.appendChild(stringStatsGroup);
    }

    function createStatGroup(title) {
        const groupDiv = document.createElement('div'); groupDiv.className = 'stat-group';
        const h3 = document.createElement('h3'); h3.textContent = title;
        groupDiv.appendChild(h3);
        return groupDiv;
    }

    function createStatItem(plantName, name, values, onChangeCallback, type = 'number', layoutType = 'default') {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'stat-item';

        const label = document.createElement('label');
        label.textContent = statTranslations[name] || name;
        label.title = `Tên gốc: ${name}`;
        itemDiv.appendChild(label);

        const valuesContainer = document.createElement('div');
        valuesContainer.className = 'values-container';

        // THÊM MỚI: Áp dụng class đặc biệt nếu là StringStats
        if (layoutType === 'string_layout') {
            valuesContainer.classList.add('string-values-container');
        }

        values.forEach((value, levelIndex) => {
            const levelIndicator = document.createElement('div');
            levelIndicator.className = 'level-indicator';
            const input = document.createElement('input');
            input.type = type;
            input.value = value;
            input.addEventListener('change', (e) => { onChangeCallback(levelIndex, e.target.value); addPlantToEditedList(plantName); });
            const levelLabel = document.createElement('span');
            levelLabel.className = 'level-label';
            levelLabel.textContent = `Lv. ${levelIndex + 1}`;
            levelIndicator.appendChild(levelLabel);
            levelIndicator.appendChild(input);
            valuesContainer.appendChild(levelIndicator);
        });

        itemDiv.appendChild(valuesContainer);
        return itemDiv;
    }

    function addPlantToEditedList(plantName) { editedPlants.add(plantName); updateEditedPlantsList(); }
    function updateEditedPlantsList() {
        editedPlantsList.innerHTML = '';
        if (editedPlants.size > 0) {
            editedPlantsSection.style.display = 'block';
            editedPlants.forEach(plantName => {
                const li = document.createElement('li');
                // THAY ĐỔI: Chèn cả ảnh và tên vào trong thẻ li
                li.innerHTML = `
                <img src="./images/${plantName}.png" class="edited-plant-icon" alt="${plantName}">
                <span>${plantName}</span>
            `;
                editedPlantsList.appendChild(li);
            });
        } else {
            editedPlantsSection.style.display = 'none';
        }
    }

    // Xử lý khi người dùng nhấn nút tải về
    downloadBtn.addEventListener('click', () => {
        if (!plantData) { alert('Không có dữ liệu để tải về.'); return; }
        const jsonString = JSON.stringify(plantData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'PlantLevels_edited.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});