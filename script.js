document.addEventListener('DOMContentLoaded', function() {
	const defoltMenuLogo = 'images/fon/8years.png';
	const version = '0.34.12F';


	function createOverlayModal() {
		const el = document.createElement('div');
		el.className = 'modal';
		el.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000;display:flex;justify-content:center;align-items:center;';
		return el;
	}

	function addEscapeClose(modal) {
		const handler = (e) => {
			if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', handler); }
		};
		document.addEventListener('keydown', handler);
		modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
	}

	function createItemObj({itemInStore, id, name, collection, stock, price, rarity, imageSrc, isCase=false, contains=[], dropChances={}, isCharm=false, isSticker=false, isItemWithoutSlot=false, priceMultiply='null'}) {
		if (priceMultiply === 'null') priceMultiply = Math.round(price * 100 / 10) / 100;
		const item = { itemInStore, id, name, collection, stock, price, initialPrice: price, rarity, image: imageSrc, isRental: false, isCase, isCharm, isSticker, isItemWithoutSlot, priceMultiply };
		if (isCase) { item.contains = contains; item.dropChances = dropChances; }
		return item;
	}

	function createRentalItemObj({id, name, collection, stock, price, rarity, imageSrc, isItemWithoutSlot=false}) {
		return { itemInStore: true, id: id + '_rental', name: name + ' (TimeLimited)', collection, stock: stock * 2, price: price * 0.01, initialPrice: price * 0.01, rarity, image: imageSrc, isRental: true, isItemWithoutSlot, priceMultiply: 0 };
	}

	const currencyColor = 'gold'
	const balanceElement = document.getElementById('balance-amount');
	if (balanceElement) {
		balanceElement.style.color = currencyColor;
	}
	
	let alwaysUpgradeSuccess = false;

	function loadItemsData() {
		return new Promise((resolve, reject) => {
			if (document.querySelector('script[src="items-data.js"]')) { resolve(); return; }
			const script = document.createElement('script');
			script.src = 'items-data.js';
			script.onload = resolve;
			script.onerror = reject;
			document.head.appendChild(script);
		});
	}
	
	const marketToggle = document.createElement('div');
        marketToggle.className = 'market-toggle';
        marketToggle.innerHTML = `
          <button id="normal-market-btn" class="market-btn active"><a style="font-size: 120%">Рынок</a></button>
          <button id="rental-market-btn" class="market-btn"><a style="font-size: 120%">Аренда</a></button>
        `;
        document.querySelector('.sort-container').insertAdjacentElement('beforebegin', marketToggle);

        // Вкладки Платформа / Мои запросы (только для рынка)
        const platformTabs = document.createElement('div');
        platformTabs.className = 'platform-tabs';
        platformTabs.innerHTML = `
          <button id="platform-tab" class="platform-tab active">Платформа</button>
          <button id="my-requests-tab" class="platform-tab">Мои запросы</button>
        `;
        marketToggle.insertAdjacentElement('afterend', platformTabs);

        document.getElementById('generate-promo-btn').addEventListener('click', generateRandomPromocode);

        let currentMarket = 'normal'; // 'normal' или 'rental'
        let currentPlatformTab = 'platform'; // 'platform' или 'my-requests'

        document.getElementById('normal-market-btn').addEventListener('click', function() {
                if (currentMarket !== 'normal') {
                        currentMarket = 'normal';
                        this.classList.add('active');
                        document.getElementById('rental-market-btn').classList.remove('active');
                        platformTabs.style.display = 'flex';
                        initShop(); // Перезагружаем магазин
                }
        });

        document.getElementById('rental-market-btn').addEventListener('click', function() {
                if (currentMarket !== 'rental') {
                        currentMarket = 'rental';
                        this.classList.add('active');
                        document.getElementById('normal-market-btn').classList.remove('active');
                        platformTabs.style.display = 'none';
                        initShop(); // Перезагружаем магазин
                }
        });

        document.getElementById('platform-tab').addEventListener('click', function() {
                if (currentPlatformTab !== 'platform') {
                        currentPlatformTab = 'platform';
                        this.classList.add('active');
                        document.getElementById('my-requests-tab').classList.remove('active');
                        initShop();
                }
        });

        document.getElementById('my-requests-tab').addEventListener('click', function() {
                if (currentPlatformTab !== 'my-requests') {
                        currentPlatformTab = 'my-requests';
                        this.classList.add('active');
                        document.getElementById('platform-tab').classList.remove('active');
                        initShop();
                }
        });

        let balance = 0;
        const balanceAmount = document.getElementById('balance-amount');
        let inventory = [];

        function addBattlePassButton() {
                const battlePassBtn = document.getElementById('battle-pass-btn');
                battlePassBtn.addEventListener('click', openBattlePassMenu);
        }
        
        function addScrollButtons() {
		const scrollToTopBtn = document.createElement('button');
		const scrollToBottomBtn = document.createElement('button');
		
		scrollToTopBtn.className = 'scroll-btn scroll-to-top';
		scrollToTopBtn.innerHTML = '↑';
		scrollToTopBtn.title = 'Вверх';
		scrollToTopBtn.addEventListener('click', () => {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		});
		
		scrollToBottomBtn.className = 'scroll-btn scroll-to-bottom';
		scrollToBottomBtn.innerHTML = '↓';
		scrollToBottomBtn.title = 'Вниз';
		scrollToBottomBtn.addEventListener('click', () => {
			window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
		});
		
		document.body.appendChild(scrollToTopBtn);
		document.body.appendChild(scrollToBottomBtn);
	}
	addScrollButtons();
	
	const promoItemsBtn = document.getElementById('promo-items-btn');
	
	const promoItemsDatabase = [
	];	
	
	function addNewPromoItem(itemInStore = true, id, name, collection, stock, price, rarity, imageSrc, isCase = false, contains = [], dropChances = {}, isCharm = false, isSticker = false, isItemWithoutSlot = false, priceMultiply = 'null') {
	  if (priceMultiply === 'null') {
		  priceMultiply = Math.round(price * 100 / 10) / 100;
	  }
	  const newItem = {
		itemInStore,
		id,
		name,
		collection,
		stock,
		price,
		initialPrice: price,
		rarity,
		image: imageSrc,
		isRental: false,
		isCase,
		isCharm,
		isSticker,
		isItemWithoutSlot,
		priceMultiply
	  };
	
	   const promoPriceChnager = {
		  'common': 0.01,
		  'uncommon': 0.05,
		  'rare': 0.1,
		  'epic': 0.25,
		  'legendary': 0.5,
		  'arcane': 0.65,
		  'nameless': 0.75,
		  'none': 0.9,
		  'gold-none': 0.9,
		  'box-none': 0.3,
		  'case-none': 0.7
	  }
	  let promoPrice = Math.round(price * (promoPriceChnager[rarity] || 1) * 100) / 100;

	  const newPromoItem = {
		itemInStore,
		id,
		name,
		collection,
		stock,
		price: promoPrice,
		initialPrice: promoPrice,
		rarity,
		image: imageSrc,
		isRental: false,
		isCase,
		isCharm,
		isSticker,
		isItemWithoutSlot,
		priceMultiply
	  };
	  
	  if (isCase) {
		newItem.contains = contains;
		newItem.dropChances = dropChances;
	  }
	  
	  const itemIndex0 = itemsDatabase.findIndex(item => item.id === id);
	  if (itemIndex0 === -1) {
		  itemsDatabase.push(newItem);
	  }
	  
	  const itemIndex1 = promoItemsDatabase.findIndex(item => item.id === id);
	  if (itemIndex1 === -1) {
		  promoItemsDatabase.push(newPromoItem);
	  }
	  
	  if (itemInStore) {
		addItemToShop(newItem);
	  }
	  
	  if (itemInStore && !isCase && !isCharm && !isSticker) {
		itemsDatabase.push(createRentalItemObj({id, name, collection, stock, price, rarity, imageSrc, isItemWithoutSlot}));
	  }
	}
	
	/**
	 * Настраивает 3D-просмотр для элемента инвентаря/магазина/промо
	 * @param {HTMLElement} imgContainer - контейнер с изображением (клик по нему откроет вьювер)
	 * @param {Object} item - объект предмета (из inventory/promoItemsDatabase/itemsDatabase)
	 * @param {Object} [originalItem] - оригинальный предмет из базы (если есть, для получения доп. свойств)
	*/
	function fxCan3D(invItem) {
		const item = itemsDatabase.find(i => i.id === invItem.id);
		const x = !item.isSticker && !item.isCharm && !item.name.endsWith("Fragment") && !(item.name.startsWith("Graffiti")
		&& !item.name.startsWith("GraffitiPack")) && !item.name.startsWith("Medal") && !item.name.startsWith("Agent");
		if (x) return true;
		else return false;
	}
	
	function setup3DViewer(imgContainer, item, originalItem = null) {
		if (!imgContainer) return;

		const sourceItem = originalItem || item;

		// Базовые проверки на тип предмета
		const canShow3D = fxCan3D(item);
		if (!canShow3D) {
			imgContainer.style.cursor = 'default';
			return;
		}

		let modelFile = '', albedoFile = '', metalnessFile = '', patternFile = '', patternMask = '';
		let StatTrackFlag = false;

		const displayNameOld = item.name;
		// Убираем StatTrack для определения базовых файлов
		let displayName = item.name.replace(/\bStatTrack\b/g, '').trim();

		if (displayName !== displayNameOld) {
			StatTrackFlag = true;
		}

		displayName = displayName.replace(/\s*\(?\bTimeLimited\b\)?\s*/g, ' ').replace(/\s+/g, ' ').trim();

		const quoteMatch = displayName.match(/^([^\s"']+)\s+"([^"]+)"(.*)$/);
		let flagContainers = '';

		if (quoteMatch) {
			const baseName = quoteMatch[1].toLowerCase();
			const variantInside = quoteMatch[2];
			const suffixAfter = quoteMatch[3].trim();
			const fullVariant = variantInside + suffixAfter;
			const variantNoSpaces = fullVariant.replace(/\s+/g, '');

			albedoFile = `${baseName}_${variantNoSpaces}_A.png`;
			metalnessFile = `${baseName}_${variantNoSpaces}_M.png`;
			patternMask = `${baseName}_${variantNoSpaces}_P.png`;
			patternFile = variantNoSpaces + '.png';
			modelFile = StatTrackFlag ? `${baseName}_st.glb` : `${baseName}.glb`;
			flagContainers = baseName; // Используем baseName для дальнейших проверок
		} else {
			const baseName = displayName.split(' ')[0].toLowerCase();
			albedoFile = `${baseName}_A.png`;
			metalnessFile = `${baseName}_M.png`;
			patternMask = `${baseName}_P.png`;
			patternFile = baseName + '.png';
			modelFile = `${baseName}.glb`;
			flagContainers = baseName;
		}

		patternFile = "patterns/" + patternFile;
		patternMask = "materials_p/" + patternMask;
		modelFile = "models/" + modelFile;
		albedoFile = "materials/" + albedoFile;
		metalnessFile = "materials_m/" + metalnessFile;
		const roughnessFile = "black.png";

		const collectionName = (collectionsDatabase[sourceItem.collection] || { name: sourceItem.collection }).name;
		const background = 'backgrounds/' + sourceItem.collection.replace(/\_collection\b/g, '').trim();
		const backUrl = encodeURIComponent(window.location.href);

		let rar = item.rarity;
		if (rar === 'none') rar = 'none-rarity';
		const logo = 'collections/' + collectionName.toLowerCase().replace(/\s+/g, '') + 'Collection_icon.png';
		
		// Список исключений (в нижнем регистре)
		// Исключения для осмотра паков / кейсов / юоксов
		const exceptionKeywords = [
			'giftbox', 
			'giftcase', 
			'gift',
			'eventcase', 
			'eventbox', 
			'eventcrate', 
			'tacticalbox',
			'fragmentbox'
		];
		const isException = exceptionKeywords.some(keyword => 
			displayName.toLowerCase().includes(keyword)
		);
		if ((rar === 'box-none' || rar === 'case-none') && !isException) {
			albedoFile = logo;
		}

		const viewerUrl = `viever.html?model=${encodeURIComponent(modelFile)}&rarity=${rar}&logo=${encodeURIComponent(logo)}&collection=${encodeURIComponent(collectionName)}&albedo=${encodeURIComponent(albedoFile)}&metalness=${encodeURIComponent(metalnessFile)}&pattern=${encodeURIComponent(patternFile)}&mask=${encodeURIComponent(patternMask)}&roughness=${encodeURIComponent(roughnessFile)}&bg=${encodeURIComponent(background + '.png')}&title=${encodeURIComponent(item.name)}&backUrl=${backUrl}`;

		imgContainer.style.cursor = 'pointer';
		imgContainer.style.display = 'inline-block';
		imgContainer.style.position = 'relative';
		imgContainer.style.zIndex = '10';

		imgContainer.onmouseenter = function() { this.style.opacity = '0.9'; };
		imgContainer.onmouseleave = function() { this.style.opacity = '1'; };

		imgContainer.addEventListener('click', function(e) {
			e.stopPropagation();
			e.preventDefault();
			window.open(viewerUrl, '_block');
		});
	}
	
	function openPromoItemsModal() {
		const modal = createOverlayModal();

		modal.innerHTML = `
			<div class="modal-content" style="
			  background: rgba(30,30,30,0.95);
			  padding: 20px;
			  border-radius: 8px;
			  width: 90%;
			  max-width: 800px;
			  max-height: 80vh;
			  overflow-y: auto;
			  color: white;
			">
			  <h2 style="text-align: center; margin-top: 0; color: gold;">🔥 Акционные скины</h2>
			  <p style="text-align: center; color: #aaa; margin-bottom: 20px;">
				Эти скины доступны только сейчас! После покупки они будут в вашем инвентаре, но их пока нельзя продать!
			  </p>
			  <div id="promo-items-grid" style="
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
				gap: 15px;
			  "></div>
			  <div style="text-align: center; margin-top: 20px;">
				<button id="close-promo-modal" style="
				  padding: 10px 20px;
				  background: #f44336;
				  color: white;
				  border: none;
				  border-radius: 4px;
				  cursor: pointer;
				">Закрыть</button>
			  </div>
			</div>
		`;

		document.body.appendChild(modal);

		const grid = modal.querySelector('#promo-items-grid');
		
		// Объект для хранения количества выбранных предметов
		const itemQuantities = {};
		
		promoItemsDatabase.forEach(item => {
			itemQuantities[item.id] = 1; // По умолчанию количество = 1
			
			const rarityInfo = rarities[item.rarity] || { color: 'none', name: item.rarity };
			const itemEl = document.createElement('div');
			itemEl.style.cssText = `
			  background: #2a2a2a;
			  padding: 12px;
			  border-radius: 8px;
			  text-align: center;
			  cursor: pointer;
			  transition: all 0.2s;
			  position: relative;
			`;
			const collectionInfo = collectionsDatabase[item.collection] || { name: item.collection, image: '' };

			itemEl.innerHTML = `	  
			  <div class="item-img"><img data-src="${item.image}" alt="" class="logo lazy" width="150" src="${item.image}"></div>
			  <div class="item-rarity ${rarityInfo.color}" style="font-size: 12px;transform: translate(0px, -9px);"><div class="item-name">${item.name}</div></div>
			  <div style="color: gold; margin-top: 5px;">
				${collectionInfo.image ? `<img src="${collectionInfo.image}" class="collection-icon" alt="${collectionInfo.name}" style="width: 30px; auto;">` : ''}
				${item.price.toLocaleString('ru-RU')} ₽
			  </div>
			  <div class="quantity-display" style="
				margin-top: 8px;
				padding: 4px 8px;
				background: rgba(255, 215, 0, 0.2);
				border-radius: 4px;
				font-size: 12px;
				color: gold;
				display: inline-block;
			  ">
				Кол-во: <span class="quantity-value">1</span>
			  </div>
			  <button class="buy-promo-item" data-id="${item.id}" style="
				margin-top: 10px;
				padding: 6px 12px;
				background: #4CAF50;
				color: white;
				border: none;
				border-radius: 4px;
				cursor: pointer;
				width: 100%;
			  ">Купить</button>
			`;
			
			const imgContainer = itemEl.querySelector('.item-img');
			setup3DViewer(imgContainer, item, item);
			
			// Добавляем обработчик прокрутки с Ctrl
			itemEl.addEventListener('wheel', function(e) {
				if (e.ctrlKey) {
					e.preventDefault();
					
					// Определяем направление прокрутки
					const delta = e.deltaY > 0 ? -1 : 1;
					let newQuantity = itemQuantities[item.id] + delta;
					
					// Ограничиваем количество от 1 до 100
					newQuantity = Math.max(1, Math.min(100, newQuantity));
					
					// Обновляем количество
					itemQuantities[item.id] = newQuantity;
					
					// Обновляем отображение
					const quantityValue = this.querySelector('.quantity-value');
					quantityValue.textContent = newQuantity;
				}
			});
			
			grid.appendChild(itemEl);
		});

		modal.querySelectorAll('.buy-promo-item').forEach(btn => {
			btn.addEventListener('click', function() {
				const id = this.getAttribute('data-id');
				const item = promoItemsDatabase.find(i => i.id === id);
				if (!item) return;

				const quantity = itemQuantities[id] || 1;
				const totalPrice = item.price * quantity;

				if (balance < totalPrice) {
					showToast(`Недостаточно средств! Нужно: ${totalPrice.toLocaleString('ru-RU')} ₽`, true);
					return;
				}

				balance -= totalPrice;
				balance = Math.round(balance * 100) / 100;
				balanceAmount.textContent = balance.toLocaleString('ru-RU');
				UpdateStatrackFrame(balance);
				addExp(Math.round(totalPrice));

				// Добавляем предметы в инвентарь по количеству
				for (let i = 0; i < quantity; i++) {
					inventory.push({
						id: item.id,
						name: item.name,
						rarity: item.rarity,
						image: item.image,
						itemInStore: false
					});
				}

				showToast(`Получено ${quantity} акционных скинов: ${item.name}!`);
				updateInventory();
				saveGameState();
				
				// Сбрасываем количество после покупки
				itemQuantities[id] = 1;
				const quantityDisplay = btn.parentElement.querySelector('.quantity-value');
				if (quantityDisplay) {
					quantityDisplay.textContent = '1';
				}
			});
		});

		modal.querySelector('#close-promo-modal').addEventListener('click', () => modal.remove());
		modal.addEventListener('click', (e) => {
			if (e.target === modal) modal.remove();
		});
	}

	promoItemsBtn.addEventListener('click', openPromoItemsModal);
	
	let userClan = {
		name: "",
		rank: "colib_clan",
		stars: 0,
		members: [],
		balance: 0,
		storage: []
	};
	
	let userLevel = 1;
	let userExp = 0;
	let expToNextLevel = 300;
	
	function startClanBalanceGrowth() {
	  setInterval(() => {
		if (userClan.name) { // Проверяем, что у игрока есть клан
		  if (userClan.balance > 0) {
			userClan.balance *= 1.2;
			userClan.balance = Math.round(userClan.balance * 100) / 100; // Округляем до 2 знаков
			saveGameState();
			showToast('Баланс клана увеличен', false);
			
			const clanModal = document.querySelector('.modal-content');
			if (clanModal && clanModal.querySelector('h2').textContent.includes(userClan.name)) {
				clanModal.querySelector('.clan-balance-display').textContent = `Баланс клана: ${userClan.balance.toLocaleString('ru-RU')} ₽`;
			}
			
			const withdrawModal = document.querySelector('#clan-withdraw-balance');
			if (withdrawModal) {
				const totalValueElement = document.querySelector('#clan-withdraw-total');
				const totalValue = parseFloat(totalValueElement.textContent.replace('Общая стоимость: ', '').replace(' ₽', '')) || 0;
				const remainingBalance = userClan.balance - totalValue;
				
				withdrawModal.textContent = `Баланс клана: ${remainingBalance.toLocaleString('ru-RU')} ₽`;
				
				if (remainingBalance < 0) {
					withdrawModal.style.color = '#ff3333';
				} else {
					withdrawModal.style.color = '#ffaa00';
				}
			}
			const clanBalanceTotal = document.querySelector('#clan-balance-total');
			if (clanBalanceTotal) {
				clanBalanceTotal.textContent = `Доступно: ${userClan.balance.toLocaleString('ru-RU')} ₽`;
			}
		  }
		}
	  }, 30000); // 30000 мс = 30 секунд
	}
	
	const battlePassesDatabase = {
		'default_pass': {
			id: 'default_pass',
			name: 'Default Pass',
			stars_for_up: 1,
			free_pass: [false],
			gold_pass: [false],
			cost_gold_pass: null,
			levels_costs: {},
			stars_for_craft_rarites: {
				'common': 0,
				'uncommon': 0,
				'rare': 0,
				'epic': 0,
				'legendary': 0,
				'arcane': 0,
				'nameless': 0
			}
		}
	};
	
	const rangsDatabase = {
		'lock_mm': {
			id: 'lock_mm',
			name: 'Заблокированно',
			stars_for_up: 100,
			rang_img: 'images/ranks/lock_mm.png',
			rang_before: 'NaN',
			next_rang: 'colib_mm',
			type: 'mm'
		},
		'lock_souz': {
			id: 'lock_souz',
			name: 'Заблокированно',
			stars_for_up: 100,
			rang_img: 'images/ranks/lock_souz.png',
			rang_before: 'NaN',
			next_rang: 'colib_souz',
			type: 'souz'
		},
		'lock_duel': {
			id: 'lock_duel',
			name: 'Заблокированно',
			stars_for_up: 100,
			rang_img: 'images/ranks/lock_duel.png',
			rang_before: 'NaN',
			next_rang: 'colib_duel',
			type: 'duel'
		},
		'colib_mm': {
			id: 'colib_mm',
			name: 'Калибровка',
			stars_for_up: 200,
			rang_img: 'images/ranks/colib_mm.png',
			rang_before: 'NaN',
			next_rang: 'bronze1_mm',
			type: 'mm',
			rewardRarity: 'common'
		},
		'colib_souz': {
			id: 'colib_souz',
			name: 'Калибровка',
			stars_for_up: 200,
			rang_img: 'images/ranks/colib_souz.png',
			rang_before: 'NaN',
			next_rang: 'bronze1_souz',
			type: 'souz',
			rewardRarity: 'common'
		},
		'colib_duel': {
			id: 'colib_duel',
			name: 'Калибровка',
			stars_for_up: 200,
			rang_img: 'images/ranks/colib_duel.png',
			rang_before: 'NaN',
			next_rang: 'bronze1_duel',
			type: 'duel',
			rewardRarity: 'common'
		},
		'colib_clan': {
			id: 'colib_clan',
			name: 'Калибровка',
			stars_for_up: 200,
			rang_img: 'images/ranks/colib_clan.png',
			rang_before: 'NaN',
			next_rang: 'bronze1_clan',
			type: 'clan'
		}
	};

	let userRangs = {
		mm: {
			current: 'lock_mm',
			stars: 0
		},
		souz: {
			current: 'lock_souz',
			stars: 0
		},
		duel: {
			current: 'lock_duel',
			stars: 0,
		}
	};
	
	const framesDatabase = {
		'null_frame': {
			id: 'null_frame',
			name: 'Null',
			rarity: 'none',
			image: 'images/frames/null_frame.png',
			equipped: true, // Базовая рамка по умолчанию
			levelFrameImg: 'images/frames/null_level.png',
			giveFromLevel: 0 // Выдается сразу
		}
	};

	let currentFrame = 'null_frame'; // Текущая выбранная рамка
	let currentMedals = [null, null, null, null, null]; // Массив из 5 слотов для медалей
	
	function initializeMedalSlots() {
		currentMedals = [null, null, null, null, null];
		
		inventory.forEach((item, idx) => {
			
			if (item.name && item.name.startsWith('Medal') && item.slot !== undefined && item.slot !== null) {
				if (item.slot >= 0 && item.slot < 5) {
					currentMedals[item.slot] = item.id;
				} else {
					delete item.slot;
				}
			}
		});
	}
	
	function validateAndFixMedalSlots() {
		let changed = false;
		
		for (let i = 0; i < currentMedals.length; i++) {
			const medalId = currentMedals[i];
			
			if (medalId !== null && medalId !== undefined) {
				const medalInInventory = inventory.find(item => 
					item && item.id === medalId && item.slot === i
				);
				
				if (!medalInInventory) {
					currentMedals[i] = null;
					changed = true;
				}
			}
		}
		
		inventory.forEach((item, idx) => {
			if (!item) return; // Пропускаем null/undefined элементы
			
			if (item.name && item.name.startsWith('Medal') && item.slot !== undefined && item.slot !== null) {
				const slotIndex = item.slot;
				if (slotIndex >= 0 && slotIndex < 5) {
					if (currentMedals[slotIndex] !== item.id) {
						delete item.slot;
						changed = true;
					}
				} else {
					delete item.slot;
					changed = true;
				}
			}
		});
		
		if (changed) {
			saveGameState();
			updateInventory();
			updateProfileMedalDisplay();
		}
		
		return changed;
	}
	
	if (!currentFrame) {
		currentFrame = 'null_frame';
	}
	if (framesDatabase['null_frame']) {
		framesDatabase['null_frame'].equipped = true;
	}
	
	const clanBtn = document.getElementById('open-clan-btn');
	clanBtn.addEventListener('click', openClanMenu);
	
	function calculateExpToNextLevel(currentLevel) {
		if (currentLevel <= 50) {
			return 300 + (currentLevel - 1) * 60;
		} else if (currentLevel <= 75) {
			return 560 + (currentLevel - 1) * 60;
		} else if (currentLevel <= 150) {
			return 1060 + (currentLevel - 1) * 60;
		} else if (currentLevel <= 300) {
			return 2060 + (currentLevel - 1) * 60;
		} else {
			return 20000;
		}
	}

	function addNewFrame(id, name, rarity, img, equipped = false, levelFrameImg = 'images/frames/null_level.png', giveFromLevel = 0) {
		if (framesDatabase[id]) {
			console.error('Рамка с таким ID уже существует!');
			return false;
		}

		framesDatabase[id] = {
			id,
			name,
			rarity,
			image: img,          // изображение для аватарки
			equipped,
			levelFrameImg,       // изображение для уровня (если есть)
			giveFromLevel        // уровень, с которого выдается рамка
		};

		if (Object.keys(framesDatabase).length === 2) {
		}
		return true;
	}
	
	function getRandomItemReward(rarity = null, type = null) {
		if (!rarity) return null;
		
		let rewardItems = [];
		if (type == 'mm') {
			rewardItems = itemsDatabase.filter(item => 
				item.id.includes('_5x5') && 
				item.rarity === rarity && 
				!item.isRental
			);
		} else if (type == 'souz') {
			rewardItems = itemsDatabase.filter(item => 
				item.id.includes('_2x2') && 
				item.rarity === rarity && 
				!item.isRental
			);
		} else if (type == 'duel') {
			rewardItems = itemsDatabase.filter(item => 
				item.id.includes('_1x1') && 
				item.rarity === rarity && 
				!item.isRental
			);
		} else {
			rewardItems = itemsDatabase.filter(item => 
				item.id.includes('_reward') && 
				item.rarity === rarity && 
				!item.isRental
			);
		}
			
		
		if (rewardItems.length === 0) {
			rewardItems = itemsDatabase.filter(item => 
				item.rarity === rarity && 
				!item.isRental
			);
		}
		
		if (rewardItems.length === 0) {
			rewardItems = itemsDatabase.filter(item => 
				!item.isRental
			);
		}
		
		if (rewardItems.length === 0) return null;
		
		const randomItem = rewardItems[Math.floor(Math.random() * rewardItems.length)];
		
		return {
			id: randomItem.id,
			name: randomItem.name,
			rarity: randomItem.rarity,
			image: randomItem.image
		};
	}

	function addNewRang(rang_id, rang_name, stars_for_up, rang_img, rang_before = 'NaN', next_rang = 'NaN', type, rewardRarity = null) {
		if (rangsDatabase[rang_id]) {
			console.error('Ранг с таким ID уже существует!');
			return false;
		}

		rangsDatabase[rang_id] = {
			id: rang_id,
			name: rang_name,
			stars_for_up: stars_for_up,
			rang_img: rang_img,
			rang_before: rang_before,
			next_rang: next_rang,
			type: type,
			rewardRarity: rewardRarity // Добавляем параметр редкости награды
		};
		
		const hasRangBefore = rang_before !== undefined && rang_before !== null && rang_before !== 'NaN';
		const hasNextRang = next_rang !== undefined && next_rang !== null && next_rang !== 'NaN';

		if (hasRangBefore && rangsDatabase[rang_before]) {
			rangsDatabase[rang_before].next_rang = rang_id;
		}

		if (hasNextRang && rangsDatabase[next_rang]) {
			rangsDatabase[next_rang].rang_before = rang_id;
		}

		return true;
	}
	

	
	function openFrameSelector() {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.display = 'flex';
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100%';
		modal.style.height = '100%';
		modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
		modal.style.zIndex = '1001';
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';

		modal.innerHTML = `
			<div class="modal-content" style="background-color: rgb(30 30 30 / 85%); padding: 20px; border-radius: 8px; width: 80%; max-width: 800px; max-height: 80vh; overflow: auto;">
				<h2 style="text-align: center;">Выберите рамку</h2>
				<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; margin-top: 20px;" id="frames-container">
					${Object.values(framesDatabase).map(frame => {
						const isLocked = frame.giveFromLevel > 0 && userLevel < frame.giveFromLevel;
						
						return `
							<div class="frame-item" data-id="${frame.id}" style="
								background-color: #2a2a2a; 
								padding: 15px; 
								border-radius: 8px; 
								text-align: center; 
								${frame.equipped ? 'border: 2px solid gold;' : ''}
								${isLocked ? 'opacity: 0.5; filter: grayscale(80%);' : ''}
							">
								<img src="${frame.image}" alt="${frame.name}" width="100" style="border-radius: 2%;">
								<div style="margin-top: 10px; font-weight: bold;">${frame.name}</div>
								<div class="frame-rarity ${rarities[frame.rarity].color}" style="padding: 3px 8px; border-radius: 4px; margin-top: 5px; display: inline-block;">
									${rarities[frame.rarity].name}
								</div>
								${isLocked ? `
									<div style="margin-top: 5px; color: #aaa; font-size: 12px;">
										Доступно с ${frame.giveFromLevel} уровня
									</div>
								` : `
									<button class="apply-frame-btn" data-id="${frame.id}" style="
										padding: 5px 10px; 
										background-color: ${frame.equipped ? '#4CAF50' : '#555555'}; 
										color: white; 
										border: none; 
										border-radius: 4px; 
										cursor: pointer; 
										margin-top: 10px; 
										width: 100%;
										${isLocked ? 'display: none;' : ''}
									">
										${frame.equipped ? 'Применена' : 'Применить'}
									</button>
								`}
							</div>
						`;
					}).join('')}
				</div>
				<div style="text-align: center; margin-top: 20px;">
					<button id="close-frame-selector" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Закрыть</button>
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		modal.querySelectorAll('.apply-frame-btn').forEach(btn => {
			btn.addEventListener('click', function() {
				const frameId = this.getAttribute('data-id');
				const frame = framesDatabase[frameId];
				
				if (frame.giveFromLevel > 0 && userLevel < frame.giveFromLevel) {
					showToast(`Эта рамка доступна с ${frame.giveFromLevel} уровня`, true);
					return;
				}
				
				Object.values(framesDatabase).forEach(f => f.equipped = false);
				
				framesDatabase[frameId].equipped = true;
				currentFrame = frameId;
				
				saveGameState();
				
				modal.querySelectorAll('.apply-frame-btn').forEach(b => {
					const id = b.getAttribute('data-id');
					b.textContent = id === frameId ? 'Применена' : 'Применить';
					b.style.backgroundColor = id === frameId ? '#4CAF50' : '#555555';
				});
				
				modal.querySelectorAll('.frame-item').forEach(item => {
					const id = item.getAttribute('data-id');
					item.style.border = id === frameId ? '2px solid gold' : 'none';
				});
				
				showToast(`Рамка "${framesDatabase[frameId].name}" применена`);
				modal.remove();
				openProfile();
			});
		});

		modal.querySelector('#close-frame-selector').addEventListener('click', function() {
			modal.remove();
			openProfile();
		});
	}
	
	function applyBackground(bgPath) {
	  let bgStyle = document.getElementById('background-style');
	  if (!bgStyle) {
		bgStyle = document.createElement('style');
		bgStyle.id = 'background-style';
		document.head.appendChild(bgStyle);
	  }
	  
	  bgStyle.textContent = `
		body::before {
		  content: "";
		  position: fixed;
		  top: 0;
		  left: 0;
		  width: 100%;
		  height: 100%;
		  background-image: url('${bgPath}');
		  background-size: cover;
		  background-repeat: no-repeat;
		  background-position: center;
		  opacity: 1;
		  z-index: -1;
		  background-color: #0a0a0a;
		  box-shadow: 
			inset 0 0 150px 100px rgba(10, 10, 10, 0.9),
			inset 0 0 300px 200px rgba(18, 18, 18, 0.95);
		}
	  `;
	}
	
	function openAvatarSettingsModal(currentAvatarUrl, pId, pName, pVerify) {
		if (document.querySelector('#avatar-settings-modal')) return;

		const modal = document.createElement('div');
		modal.id = 'avatar-settings-modal';
		modal.style.cssText = `display:flex;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:1002;justify-content:center;align-items:center;`;
		
		modal.innerHTML = `
		<div style="background:#282828;padding:25px;border-radius:10px;width:400px;text-align:center;color:white;">
			<h3 style="margin:0 0 20px;">Настройки профиля</h3>
			<img src="${currentAvatarUrl}" id="preview-avatar" style="width:120px;height:120px;border-radius:5%;border:2px solid #555;object-fit:cover;margin-bottom:20px;">
			
			<div style="display:flex;flex-direction:column;gap:12px;">
				<button id="modal-change-frame-btn" style="padding:10px;background:#2196F3;color:white;border:none;border-radius:4px;cursor:pointer;">Выбрать рамку</button>
				
				<div style="border-top:1px solid #555;margin:5px 0;"></div>
				
				<label style="text-align:left;font-size:14px;color:#ccc;">Уровень верификации:</label>
				<select id="verification-select" style="width:100%;padding:8px;background:#333;color:white;border:1px solid #555;border-radius:4px;">
					<option value="default" ${pVerify === 'default' ? 'selected' : ''}>Обычный</option>
					<option value="verified" ${pVerify === 'verified' ? 'selected' : ''}>Верифицированный</option>
					<option value="bad" ${pVerify === 'bad' ? 'selected' : ''}>Плохой (Бан)</option>
				</select>
				
				<button id="save-profile-settings-btn" style="padding:10px;background:#ff9800;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Сохранить</button>
				<button id="close-avatar-modal-btn" style="padding:8px;background:#555;color:white;border:none;border-radius:4px;cursor:pointer;">Закрыть</button>
			</div>
		</div>`;

		document.body.appendChild(modal);

		document.getElementById('modal-change-frame-btn').onclick = () => {
			modal.remove();
			if (typeof openFrameSelector === 'function') openFrameSelector();
			else { alert('Функция выбора рамки не найдена'); setTimeout(openProfile, 100); }
		};

		document.getElementById('save-profile-settings-btn').onclick = () => {
			localStorage.setItem('playerVerification', document.getElementById('verification-select').value);
			showToast('Настройки сохранены!');
			modal.remove();
			setTimeout(openProfile, 100);
		};

		document.getElementById('close-avatar-modal-btn').onclick = () => modal.remove();
		modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
	}
	
	function getVerificationImage(level) {
		if (level === 'verified') return 'mark/check.png';
		if (level === 'bad') return 'mark/ban.png';
		return 'mark/default.png';
	}
	
	function getVerificationStatus(level) {
		if (level === 'verified') return 'Аккаун подтверждён';
		if (level === 'bad') return 'Аккаунт заблокирован';
		return '';
	}
	
	function openDevTerminal() {
	  const modal = document.createElement('div');
	  modal.className = 'modal';
	  modal.style.display = 'flex';
	  modal.style.position = 'fixed';
	  modal.style.top = '0';
	  modal.style.left = '0';
	  modal.style.width = '100%';
	  modal.style.height = '100%';
	  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
	  modal.style.zIndex = '1001';
	  modal.style.justifyContent = 'center';
	  modal.style.alignItems = 'center';
	  modal.style.fontFamily = 'monospace';

	  modal.innerHTML = `
		<div class="modal-content" style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; width: 80%; max-width: 800px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
		  <h2 style="text-align: center; color: #00ff00; margin-top: 0;">Терминал разработчика</h2>
		  
		  <div id="terminal-output" class="global-ui" style="flex: 1; overflow-y: auto; background-color: #000; color: #00ff00; padding: 15px; border-radius: 4px; margin-bottom: 10px; font-family: monospace; height: 300px;">
			<div>Добро пожаловать в терминал разработчика!</div>
			<div>Пропишите /help чтобы получить список команд</div>
			<div id="command-history"></div>
		  </div>
		  
		  <div style="display: flex; align-items: center;">
			<span style="color: #00ff00; margin-right: 10px;">$</span>
			<input type="text" id="terminal-input" style="flex: 1; padding: 10px; background-color: #000; color: #00ff00; border: 1px solid #333; border-radius: 4px; font-family: monospace;" placeholder="Введите команду...">
			<button id="terminal-submit" style="padding: 10px 15px; background-color: #00aa00; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Выполнить</button>
		  </div>
		  
		  <div style="text-align: center; margin-top: 20px;">
			<button id="close-terminal" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Закрыть</button>
		  </div>
		</div>
	  `;

	  document.body.appendChild(modal);

	  const terminalInput = document.getElementById('terminal-input');
	  const terminalOutput = document.getElementById('terminal-output');
	  const commandHistory = document.getElementById('command-history');
	  let commandIndex = -1;
	  let commandsHistory = [];

	  setTimeout(() => terminalInput.focus(), 100);

	  function executeCommand() {
		const command = terminalInput.value.trim();
		if (!command) return;

		commandsHistory.push(command);
		commandIndex = commandsHistory.length;

		addToTerminal(`<span style="color: #00ffff;">$ ${command}</span>`);
		
		processCommand(command);
		
		terminalInput.value = '';
	  }

	  function addToTerminal(text) {
		commandHistory.innerHTML += `<div>${text}</div>`;
		terminalOutput.scrollTop = terminalOutput.scrollHeight;
	  }

	  function processCommand(command) {
		const parts = command.split(' ');
		const cmd = parts[0].toLowerCase();
		const args = parts.slice(1);

		switch(cmd) {
		  case '/help':
			addToTerminal(`
				<div>Доступные команды:</div>
				<div>/balance [сумма] - установить баланс</div>
				<div>/level [уровень] - установить уровень</div>
				<div>/exp [опыт] - установить опыт</div>
				<div>/frame [id_рамки] - применить рамку</div>
				<div>/rang [тип] [id_ранга] [звезды] - установить ранг</div>
				<div>&nbsp;&nbsp;Типы: mm, souz, duel</div>
				<div>/additem [id_предмета] [количество] - добавить предмет</div>
				<div>/addpromo [код] [кол-во активаций] [special_type] - создать специальный промокод</div>
				<div>&nbsp;&nbsp;Типы: upgrade - переключение 100% апгрейда</div>
				<div>/getitems - показать все ID предметов</div>
				<div>/getframes - показать все ID рамок</div>
				<div>/getranks - показать все ID рангов</div>
				<div>/clear - очистить терминал</div>
			`);
			break;
			  
		case '/addpromo':
			if (args.length >= 2) {
				const code = args[0].toUpperCase();
				const countActivaties = args[1].toUpperCase();
				let specialType = 'none';
				if (args.length >= 3) specialType = args[2].toLowerCase();
				
				if (specialType === 'upgrade') {
					addNewPromocode(code, 0, null, false, countActivaties, null, null, 'toggle_upgrade');
					addToTerminal(`Создан промокод для переключения апгрейда: ${code}`);
				} else if (specialType === 'none') {
					addNewPromocode(code, 5000, () => {
						const allItems = itemsDatabase.filter(item => !item.isRental).map(item => item.id);
						const result = [];
						for (let i = 0; i < 5; i++) {
							result.push(allItems[Math.floor(Math.random() * allItems.length)]);
						}
						return result;
					}, false, countActivaties, null, null);
					addToTerminal(`Создан промокод: ${code}`);
				} else if (specialType === 'admin') {
					addNewPromocode(code, 0, null, true, countActivaties, null, null);
					addToTerminal(`Создан промокод админа: ${code}`);
				} else {
					addToTerminal('Неизвестный специальный тип промокода. Доступно: upgrade, none, admin');
				}
			} else {
				addToTerminal('Использование: /addpromo [код] [кол-во активаций] [special_type]');
			}
			break;

		case '/getitems':
		  const itemIds = itemsDatabase.map(item => item.id);
		  addToTerminal(`Все ID предметов (${itemIds.length}):`);
		  addToTerminal(itemIds.join(', '));
		  break;

		case '/getframes':
		  const frameIds = Object.keys(framesDatabase);
		  addToTerminal(`Все ID рамок (${frameIds.length}):`);
		  addToTerminal(frameIds.join(', '));
		  break;

		case '/getranks':
		  const rankIds = Object.keys(rangsDatabase);
		  addToTerminal(`Все ID рангов (${rankIds.length}):`);
		  addToTerminal(rankIds.join(', '));
		  break;

		  case '/balance':
			if (args.length === 1) {
			  const amount = parseFloat(args[0]);
			  if (!isNaN(amount)) {
				balance = amount;
				balanceAmount.textContent = balance.toLocaleString('ru-RU');
				UpdateStatrackFrame(balance);
				saveGameState();
				addToTerminal(`Баланс установлен: ${amount} ₽`);
			  } else {
				addToTerminal('Ошибка: неверная сумма');
			  }
			} else {
			  addToTerminal('Использование: /balance [сумма]');
			}
			break;

		  case '/level':
			if (args.length === 1) {
			  const level = parseInt(args[0]);
			  if (!isNaN(level) && level > 0) {
				userLevel = level;
				expToNextLevel = calculateExpToNextLevel(userLevel);
				saveGameState();
				addToTerminal(`Уровень установлен: ${level}`);
			  } else {
				addToTerminal('Ошибка: неверный уровень');
			  }
			} else {
			  addToTerminal('Использование: /level [уровень]');
			}
			break;

		  case '/exp':
			if (args.length === 1) {
			  const exp = parseInt(args[0]);
			  if (!isNaN(exp) && exp >= 0) {
				userExp = exp;
				saveGameState();
				addToTerminal(`Опыт установлен: ${exp}`);
			  } else {
				addToTerminal('Ошибка: неверное значение опыта');
			  }
			} else {
			  addToTerminal('Использование: /exp [опыт]');
			}
			break;

		  case '/frame':
			if (args.length === 1) {
			  const frameId = args[0];
			  if (framesDatabase[frameId]) {
				Object.values(framesDatabase).forEach(f => f.equipped = false);
				
				framesDatabase[frameId].equipped = true;
				currentFrame = frameId;
				
				saveGameState();
				addToTerminal(`Рамка применена: ${framesDatabase[frameId].name}`);
			  } else {
				addToTerminal('Ошибка: рамка не найдена');
			  }
			} else {
			  addToTerminal('Использование: /frame [id_рамки]');
			  addToTerminal('Доступные рамки: ' + Object.keys(framesDatabase).join(', '));
			}
			break;

		  case '/rang':
			if (args.length === 3) {
				const [type, rangId, stars] = args;
				
				if (!rangId.endsWith('_' + type)) {
					addToTerminal('Ошибка: ID ранга не соответствует выбранному типу. ' + 
								 `Ожидается окончание "_${type}", получено: "${rangId}"`);
					break;
				}
				
				if (['mm', 'souz', 'duel'].includes(type)) {
					if (rangsDatabase[rangId]) {
						userRangs[type].current = rangId;
						userRangs[type].stars = parseInt(stars) || 0;
						saveGameState();
						addToTerminal(`Ранг ${type} установлен: ${rangsDatabase[rangId].name} (${stars} звезд)`);
					} else {
						addToTerminal('Ошибка: ранг не найден');
					}
				} else {
					addToTerminal('Ошибка: неверный тип ранга (mm, souz, duel)');
				}
			} else {
				addToTerminal('Использование: /rang [тип] [id_ранга] [звезды]');
			}
			break;

		  case '/additem':
			if (args.length >= 1) {
			  const itemId = args[0];
			  const count = parseInt(args[1]) || 1;
			  
			  const item = itemsDatabase.find(i => i.id === itemId);
			  if (item) {
				for (let i = 0; i < count; i++) {
				  inventory.push({
					id: item.id,
					name: item.name,
					rarity: item.rarity,
					image: item.image
				  });
				}
				updateInventory();
				saveGameState();
				addToTerminal(`Добавлено ${count} x ${item.name}`);
			  } else {
				addToTerminal('Ошибка: предмет не найден');
			  }
			} else {
			  addToTerminal('Использование: /additem [id_предмета] [количество]');
			}
			break;

		  case '/clear':
			commandHistory.innerHTML = '';
			addToTerminal('Терминал очищен');
			break;

		  default:
			addToTerminal(`Неизвестная команда: ${cmd}. Введите /help для списка команд`);
		}
	  }

	  document.getElementById('terminal-submit').addEventListener('click', executeCommand);
	  
	  terminalInput.addEventListener('keypress', function(e) {
		if (e.key === 'Enter') {
		  executeCommand();
		}
	  });

	  terminalInput.addEventListener('keydown', function(e) {
		if (e.key === 'ArrowUp') {
		  e.preventDefault();
		  if (commandsHistory.length > 0) {
			commandIndex = Math.max(0, commandIndex - 1);
			terminalInput.value = commandsHistory[commandIndex] || '';
		  }
		} else if (e.key === 'ArrowDown') {
		  e.preventDefault();
		  if (commandsHistory.length > 0) {
			commandIndex = Math.min(commandsHistory.length, commandIndex + 1);
			terminalInput.value = commandsHistory[commandIndex] || '';
		  }
		}
	  });

	  document.getElementById('close-terminal').addEventListener('click', function() {
		modal.remove();
		openProfile(); // Возвращаемся в профиль
	  });

	  modal.addEventListener('click', function(e) {
		if (e.target === modal) {
		  modal.remove();
		  openProfile();
		}
	  });

	  document.addEventListener('keydown', function(e) {
		if (e.key === 'Escape' && modal.parentNode) {
		  modal.remove();
		  openProfile();
		}
	  });
	}
	
	function generateMedalSlotsHTML() {
		let slotsHTML = '';
		const positions = [0, 80, 160, 240, 320]; // translateX значения для 5 слотов
		
		const filledSlots = [];
		for (let i = 0; i < currentMedals.length; i++) {
			if (currentMedals[i] !== null) {
				filledSlots.push({ slotIndex: i, medalId: currentMedals[i] });
			}
		}
		
		filledSlots.forEach((slot, displayIndex) => {
			const medalImage = getMedalImage(slot.medalId);
			
			if (medalImage) {
				slotsHTML += `<img class="profile-medal" src="${medalImage}" style="transform:translate(${positions[displayIndex] +170}%, 100px);" data-slot="${slot.slotIndex}">`;
			} else {
				slotsHTML += `<img class="profile-medal" src="images/none_item.png" style="transform:translate(${positions[displayIndex] +170}%, 100px);" data-slot="${slot.slotIndex}">`;
			}
		});
		return slotsHTML;
	}
	
	function openProfile() {
		validateAndFixMedalSlots();
		document.querySelectorAll('.modal').forEach(m => m.remove());

		const modal = document.createElement('div');
		modal.className = 'modal';
		Object.assign(modal.style, {
			display: 'flex', position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
			backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: '1000', 
			justifyContent: 'center', alignItems: 'center'
		});

		const avatar = localStorage.getItem('profile_avatar') || 'images/player.png';
		let pId = localStorage.getItem('playerId') || '';
		let pName = localStorage.getItem('playerName') || '';
		let pVerify = localStorage.getItem('playerVerification') || 'default';

		const getRangProgressText = (rangId, stars) => {
			const rangData = rangsDatabase[rangId];
			if (!rangData) return `${stars} ММР`;
			if (rangData.stars_for_up === 0) {
				if (stars > 999000000000) return `infinity`;
				if (stars > 999000000) return `${Math.round(stars/1000000000*10)/10}B ММР`;
				if (stars > 999000) return `${Math.round(stars/1000000*10)/10}M ММР`;
				if (stars > 999) return `${Math.round(stars/1000*10)/10}K ММР`;
				return `${stars} ММР`;
			}
			if (stars > 999000000000) return `infinity / ${rangData.stars_for_up}`;
			if (stars > 999000000) return `${Math.round(stars/1000000000*10)/10}B / ${rangData.stars_for_up} ММР`;
			if (stars > 999000) return `${Math.round(stars/1000000*10)/10}M / ${rangData.stars_for_up} ММР`;
			if (stars > 9999) return `${Math.round(stars/1000*10)/10}K / ${rangData.stars_for_up} ММР`;
			return `${stars} / ${rangData.stars_for_up} ММР`;
		};

		const formatNum = (num) => {
			if (num > 999000000000) return '∞';
			if (num > 999000000) return `${Math.round(num/1000000000*10)/10}B`;
			if (num > 999000) return `${Math.round(num/1000000*10)/10}M`;
			if (num > 999) return `${Math.round(num/1000*10)/10}K`;
			return num.toString();
		};

		const currentAppliedFrame = framesDatabase[currentFrame];
		const levelFrameToShow = currentAppliedFrame?.levelFrameImg || null;
		const isStatTrack = currentAppliedFrame?.name.includes("StatTrack");
		const hasClan = userClan.name !== "";
		const clTag = hasClan ? '['+ userClan.name + ']' : '';

		modal.innerHTML = `
		<div class="modal-content" style="background:rgb(30 30 30 / 85%);padding:20px;border-radius:8px;width:80%;max-width:800px;max-height:80vh;overflow:auto;position:relative;">
			<button id="close-profile-btn" style="position:absolute;top:10px;right:15px;padding:5px 12px;background:linear-gradient(19deg,#830e0e,#d32f2f);color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:18px;">×</button>
			
			<h2 style="text-align:center;margin:10px 0;">Профиль</h2>
			<div style="text-align:center;font-size:12px;color:#777;margin-bottom:15px;">GameVersion: ${version}</div>

			<!-- Основной блок: Слева аватар, Справа инфо -->
			<div class="player-profile" style="display:flex;align-items:flex-start;gap:30px;margin-bottom:20px;justify-content:center; flex-wrap: wrap;">
				
				<!-- ЛЕВАЯ ЧАСТЬ: Аватар + Рамка + Медали + Баланс -->
				<div style="transform: translatex(-50px);position:relative;display:inline-block;cursor:pointer;" id="avatar-click-area">
					<img id="profile-avatar" src="${avatar}" width="150" height="150" style="border-radius:2%;object-fit:cover;border:3px solid #333333;display:block; position:relative; z-index:0;">
					${currentFrame !== 'null_frame' ? `<img class="profile-frame" src="${currentAppliedFrame.image}">` : ''}
					<!-- Контейнер для медалей -->
					<div id="profile-medals-container" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;">
						${generateMedalSlotsHTML()}
					</div>
					
					${isStatTrack ? `<div class="profile-stattrack-balance">${balance.toLocaleString('ru-RU')} ₽</div>` : ''}
				</div>

				<!-- ПРАВАЯ ЧАСТЬ: ID, Имя, Верификация -->
				<div style="transform: translate(-30px, 20px);display:flex;flex-direction:column;justify-content:center;gap:15px;min-width:250px;">
					
					<!-- Блок ID -->
					<div style="display:flex;align-items:center;gap:6px;">
						<span style="font-size:16px;color:#aaa;">ID</span>
						<span id="display-player-id" style="font-size:16px;color:#aaa;">${pId}</span>
						<button id="edit-player-id-btn" title="Изменить ID" style="background:none;border:none;cursor:pointer;padding:2px;opacity:0.6;">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaaaaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
						</button>
					</div>

					<!-- Блок Имя + Значок -->
					<div style="display:flex;align-items:center;gap:8px;">
						<span style="font-size:18px;color:#aaa;font-weight:bold;">${clTag}</span>
						<span id="display-player-name" style="font-size:18px;color:white;font-weight:bold;">${pName}</span>
						<img src="${getVerificationImage(pVerify)}" alt="Mark" style="height:20px;width:auto;" title="${getVerificationStatus(pVerify)}">
						<button id="edit-player-name-btn" title="Изменить имя" style="background:none;border:none;cursor:pointer;padding:2px;opacity:0.6;">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaaaaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
						</button>
					</div>
				</div>
			</div>

			<!-- Уровень -->
			<div style="text-align:center;margin:30px 0 20px;position:relative;">
				${levelFrameToShow ? `<img class="level-frame" src="${levelFrameToShow}">` : ''}
				<div style="padding-top: 50px;top: 6px;font-size:24px;font-weight:bold;margin-bottom:5px;position: relative;z-index: 4;">
					${formatNum(userLevel)}
				</div>
				<div style="width:80%;margin:0 auto;background:#333;height:20px;border-radius:10px;overflow:hidden;position:relative;z-index:1;">
					<div style="width:${(userExp/expToNextLevel)*100}%;background:gold;height:100%;transition:width 0.3s;"></div>
				</div>
				<div style="margin-top:5px;font-size:13px;color:#ccc;">${formatNum(userExp)} / ${formatNum(expToNextLevel)} опыта</div>
			</div>

			<!-- Ранги -->
			<div style="display:flex;justify-content:space-around;flex-wrap:wrap;gap:10px;">
				<div class="rang-container" style="text-align:center;margin:10px;padding:15px;background:#2a2a2a;border-radius:8px;width:200px;">
					<h3>Соревновательный</h3>
					<img id="mm-rang-img" src="${rangsDatabase[userRangs.mm.current].rang_img}" width="100">
					<div id="mm-rang-name" style="font-weight:bold;margin:5px 0;">${rangsDatabase[userRangs.mm.current].name}</div>
					<div id="mm-rang-progress">${getRangProgressText(userRangs.mm.current, userRangs.mm.stars)}</div>
				</div>
				<div class="rang-container" style="text-align:center;margin:10px;padding:15px;background:#2a2a2a;border-radius:8px;width:200px;">
					<h3>Союзный</h3>
					<img id="souz-rang-img" src="${rangsDatabase[userRangs.souz.current].rang_img}" width="100">
					<div id="souz-rang-name" style="font-weight:bold;margin:5px 0;">${rangsDatabase[userRangs.souz.current].name}</div>
					<div id="souz-rang-progress">${getRangProgressText(userRangs.souz.current, userRangs.souz.stars)}</div>
				</div>
				<div class="rang-container" style="text-align:center;margin:10px;padding:15px;background:#2a2a2a;border-radius:8px;width:200px;">
					<h3>Дуэльный</h3>
					<img id="duel-rang-img" src="${rangsDatabase[userRangs.duel.current].rang_img}" width="100">
					<div id="duel-rang-name" style="font-weight:bold;margin:5px 0;">${rangsDatabase[userRangs.duel.current].name}</div>
					<div id="duel-rang-progress">${getRangProgressText(userRangs.duel.current, userRangs.duel.stars)}</div>
				</div>
			</div>

			<!-- Кнопки управления -->
			<div style="text-align:center;margin-top:30px;display:flex;flex-direction:column;gap:10px;align-items:center;">
				<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
					<button id="dev-terminal-btn" style="padding:8px 15px;background:#555;color:white;border:none;border-radius:4px;cursor:pointer;">Терминал</button>
				</div>
				<button id="reset-save-profile-btn" style="padding:10px 20px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:10px;">Сбросить сохранение</button>
			</div>
			
			<!-- Чит-меню -->
			<div id="cheat-menu-container" style="position:absolute;right:2%;top:15%;background-color:#2a2a2a;padding:15px;border-radius:8px;z-index:10001;display:${typeof editBalanceBtn !== 'undefined' && editBalanceBtn.style.display === 'block' ? 'block' : 'none'};max-width:300px;">
				<h3 style="margin:0 0 15px;color:gold;font-size:16px;">Чит-меню</h3>
				<div style="margin-bottom:15px;">
					<label style="display:flex;align-items:center;cursor:pointer;font-size:13px;">
						<input type="checkbox" id="always-upgrade-checkbox" ${typeof alwaysUpgradeSuccess !== 'undefined' && alwaysUpgradeSuccess ? 'checked' : ''} style="margin-right:10px;">
						Всегда успешный апгрейд
					</label>
				</div>
				<div style="margin-bottom:10px;">
					<label style="display:block;margin-bottom:5px;font-size:13px;">Тип ранга:</label>
					<select id="cheat-rang-type" style="width:100%;padding:6px;background:#333;border:none;border-radius:4px;color:white;font-size:12px;">
						<option value="mm">Соревновательный</option>
						<option value="souz">Союзный</option>
						<option value="duel">Дуэльный</option>
					</select>
				</div>
				<div style="margin-bottom:10px;">
					<label style="display:block;margin-bottom:5px;font-size:13px;">Ранг:</label>
					<select id="cheat-rang-select" style="width:100%;padding:6px;background:#333;border:none;border-radius:4px;color:white;font-size:12px;"></select>
				</div>
				<div style="margin-bottom:10px;">
					<label style="display:block;margin-bottom:5px;font-size:13px;">ММР:</label>
					<input type="number" id="cheat-rang-stars" style="width:100%;padding:6px;background:#333;border:none;border-radius:4px;color:white;font-size:12px;">
				</div>
				<div style="margin-bottom:10px;">
					<label style="display:block;margin-bottom:5px;font-size:13px;">Уровень:</label>
					<input type="number" id="cheat-level" min="1" value="${userLevel}" style="width:100%;padding:6px;background:#333;border:none;border-radius:4px;color:white;font-size:12px;">
				</div>
				<div style="margin-bottom:10px;">
					<label style="display:block;margin-bottom:5px;font-size:13px;">Опыт:</label>
					<input type="number" id="cheat-exp" min="0" value="${userExp}" style="width:100%;padding:6px;background:#333;border:none;border-radius:4px;color:white;font-size:12px;">
				</div>
				<div style="display:flex;gap:5px;margin-bottom:15px;">
					<button id="cheat-unlock-all-frames" style="padding:6px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;flex:1;">Все рамки</button>
					<button id="cheat-lock-frames" style="padding:6px;background:#ff5555;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;flex:1;">Сброс рамок</button>
				</div>
				<button id="cheat-apply-btn" style="padding:8px;width:100%;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Применить</button>
			</div>
		</div>`;

		document.body.appendChild(modal);

		function openEditIdModal(currentId) {
			const subModal = document.createElement('div');
			subModal.style.cssText = `display:flex;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000;justify-content:center;align-items:center;`;
			subModal.innerHTML = `
			<div style="background:#282828;padding:25px;border-radius:10px;width:350px;text-align:center;color:white;box-shadow:0 0 20px rgba(0,0,0,0.5);">
				<h3 style="margin:0 0 20px;">Изменить ID</h3>
				<input type="text" id="edit-id-input" value="${currentId}" style="width:100%;padding:10px;background:#333;color:white;border:1px solid #555;border-radius:4px;margin-bottom:20px;font-family:monospace;">
				<div style="display:flex;gap:10px;justify-content:center;">
					<button id="save-id-btn" style="padding:10px 20px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;">Сохранить</button>
					<button id="cancel-id-btn" style="padding:10px 20px;background:#555;color:white;border:none;border-radius:4px;cursor:pointer;">Отмена</button>
				</div>
			</div>`;
			document.body.appendChild(subModal);
			const input = document.getElementById('edit-id-input');
			input.focus(); input.select();
			document.getElementById('save-id-btn').onclick = () => {
				const input = document.getElementById('edit-id-input');
				if (!input) return;
				const val = input.value.trim();
				localStorage.setItem('playerId', val);
				saveGameState();
				if (val) {
					pId = val;
					const idDisplay = document.getElementById('display-player-id');
					if (idDisplay) idDisplay.textContent = val;
					
					if(typeof showToast === 'function') showToast('ID изменен');
				}
				subModal.remove();
			};
			document.getElementById('cancel-id-btn').onclick = () => subModal.remove();
			subModal.onclick = (e) => { if(e.target===subModal) subModal.remove(); };
			input.onkeydown = (e) => { if(e.key==='Enter') document.getElementById('save-id-btn').click(); };
		}

		function openEditNameModal(currentName) {
			const subModal = document.createElement('div');
			subModal.style.cssText = `display:flex;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000;justify-content:center;align-items:center;`;
			subModal.innerHTML = `
			<div style="background:#282828;padding:25px;border-radius:10px;width:350px;text-align:center;color:white;box-shadow:0 0 20px rgba(0,0,0,0.5);">
				<h3 style="margin:0 0 20px;">Изменить Имя</h3>
				<input type="text" id="edit-name-input" value="${currentName}" style="width:100%;padding:10px;background:#333;color:white;border:1px solid #555;border-radius:4px;margin-bottom:20px;">
				<div style="display:flex;gap:10px;justify-content:center;">
					<button id="save-name-btn" style="padding:10px 20px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;">Сохранить</button>
					<button id="cancel-name-btn" style="padding:10px 20px;background:#555;color:white;border:none;border-radius:4px;cursor:pointer;">Отмена</button>
				</div>
			</div>`;
			document.body.appendChild(subModal);
			const input = document.getElementById('edit-name-input');
			input.focus(); input.select();
			document.getElementById('save-name-btn').onclick = () => {
				const input = document.getElementById('edit-name-input');
				if (!input) return;
				
				const val = input.value.trim();
				localStorage.setItem('playerName', val);
				saveGameState();
				if (val) {
					pName = val; 
					const nameDisplay = document.getElementById('display-player-name');
					if (nameDisplay) nameDisplay.textContent = val;
					if(typeof showToast === 'function') showToast('Имя изменено');
				}
				subModal.remove();
			};
			document.getElementById('cancel-name-btn').onclick = () => subModal.remove();
			subModal.onclick = (e) => { if(e.target===subModal) subModal.remove(); };
			input.onkeydown = (e) => { if(e.key==='Enter') document.getElementById('save-name-btn').click(); };
		}

		function openAvatarSelector() {
			const selectorModal = document.createElement('div');
			selectorModal.id = 'avatar-selector-modal';
			selectorModal.style.cssText = `display:flex;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:10002;justify-content:center;align-items:center;`;
			// Настройки
			const totalAvatarsToCheck = 120; // Проверяем до 120 файлов (можно увеличить)
			const folderPath = 'images/profile_avatars/';
			// Создаем контейнер для сетки аватаров
			const gridContainer = document.createElement('div');
			gridContainer.style.cssText = `
				display: grid; 
				grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); 
				gap: 10px; 
				margin-bottom: 20px; 
				max-height: 60vh; /* Ограничиваем высоту для прокрутки */
				overflow-y: auto; /* Включаем вертикальную прокрутку */
				padding: 10px;
				background: #1a1a1a;
				border-radius: 8px;
				border: 1px solid #333;
			`;
			// Заголовок модального окна
			const headerHtml = `<h3 style="margin:0 0 15px;color:#fff;">Выберите аватар</h3>`;
			// Кнопка закрытия
			const footerHtml = `<button id="close-avatar-selector-btn" style="padding:10px 25px;background:#555;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px;margin-top:10px;">Закрыть</button>`;
			const contentDiv = document.createElement('div');
			contentDiv.style.cssText = `background:#222;padding:25px;border-radius:12px;width:90%;max-width:600px;height:80vh;display:flex;flex-direction:column;color:white;box-shadow:0 0 30px rgba(0,0,0,0.8);`;
			contentDiv.innerHTML = headerHtml;
			contentDiv.appendChild(gridContainer);
			const footerDiv = document.createElement('div');
			footerDiv.style.textAlign = 'center';
			footerDiv.innerHTML = footerHtml;
			contentDiv.appendChild(footerDiv);

			selectorModal.appendChild(contentDiv);
			document.body.appendChild(selectorModal);
			let avatarPaths = [];
			for(let i = 1; i <= totalAvatarsToCheck; i++) {
				avatarPaths.push(`${folderPath}${i}.png`);
			}
			avatarPaths.sort((a, b) => {
				return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
			});
			// Рендеринг изображений
			avatarPaths.forEach(path => {
				const img = document.createElement('img');
				img.src = path;
				img.className = 'avatar-option';
				img.dataset.path = path;
				img.alt = `Avatar ${path}`;
				
				// Стили для каждого аватара
				Object.assign(img.style, {
					width: '80px',
					height: '80px',
					objectFit: 'cover',
					borderRadius: '8px',
					border: '2px solid #444',
					cursor: 'pointer',
					transition: 'transform 0.2s, border-color 0.2s',
					backgroundColor: '#333' // Фон пока грузится
				});

				// Эффекты наведения
				img.onmouseover = function() { this.style.transform='scale(1.1)'; this.style.borderColor='#fff'; this.style.zIndex='10'; };
				img.onmouseout = function() { this.style.transform='scale(1)'; this.style.borderColor='#444'; this.style.zIndex='1'; };
				img.onerror = function() {
					this.style.display = 'none';
				};

				img.onclick = () => {
					const newPath = img.getAttribute('data-path');
					localStorage.setItem('profile_avatar', newPath);
					if(typeof showToast === 'function') showToast('Аватар обновлен');
					selectorModal.remove();
					const settingsModal = document.querySelector('#avatar-settings-modal');
					if(settingsModal) settingsModal.remove();
					openAvatarSettingsModal(newPath, localStorage.getItem('playerVerification') || 'default');
				};

				gridContainer.appendChild(img);
			});

			document.getElementById('close-avatar-selector-btn').onclick = () => selectorModal.remove();
			selectorModal.onclick = (e) => { if(e.target === selectorModal) selectorModal.remove(); };
		}

		function openAvatarSettingsModal(curAv, curVer) {
			if (document.querySelector('#avatar-settings-modal')) return;
			const subModal = document.createElement('div');
			subModal.id = 'avatar-settings-modal';
			subModal.style.cssText = `display:flex;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000;justify-content:center;align-items:center;`;
			subModal.innerHTML = `
			<div style="background:#282828;padding:25px;border-radius:10px;width:350px;text-align:center;color:white;box-shadow:0 0 20px rgba(0,0,0,0.5);">
				<h3 style="margin:0 0 20px;">Настройки аватара</h3>
				<img src="${curAv}" id="preview-avatar" style="width:120px;height:120px;border-radius:5%;border:2px solid #555;object-fit:cover;margin-bottom:20px;">
				<div style="display:flex;flex-direction:column;gap:10px;">
					<!-- Новая кнопка выбора аватара -->
					<button id="modal-change-avatar-btn" style="padding:10px;background:#9C27B0;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Выбрать аватар</button>
					
					<button id="modal-change-frame-btn" style="padding:10px;background:#2196F3;color:white;border:none;border-radius:4px;cursor:pointer;">Выбрать рамку</button>
					<div style="border-top:1px solid #555;margin:5px 0;"></div>
					<label style="text-align:left;font-size:14px;color:#ccc;">Статус верификации:</label>
					<select id="verification-select" style="width:100%;padding:8px;background:#333;color:white;border:1px solid #555;border-radius:4px;">
						<option value="default" ${curVer==='default'?'selected':''}>Обычный</option>
						<option value="verified" ${curVer==='verified'?'selected':''}>Верифицированный</option>
						<option value="bad" ${curVer==='bad'?'selected':''}>Плохой (Бан)</option>
					</select>
					<button id="save-profile-settings-btn" style="padding:10px;background:#ff9800;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Сохранить</button>
					<button id="close-avatar-modal-btn" style="padding:8px;background:#555;color:white;border:none;border-radius:4px;cursor:pointer;">Закрыть</button>
				</div>
			</div>`;
			document.body.appendChild(subModal);

			// Привязка новой кнопки
			document.getElementById('modal-change-avatar-btn').onclick = () => {
				openAvatarSelector();
			};

			document.getElementById('modal-change-frame-btn').onclick = () => { subModal.remove(); if(typeof openFrameSelector==='function') openFrameSelector(); else setTimeout(openProfile,100); };
			document.getElementById('save-profile-settings-btn').onclick = () => {
				const newVerify = document.getElementById('verification-select').value;
				localStorage.setItem('playerVerification', newVerify);
				
				if(typeof showToast === 'function') showToast('Настройки профиля сохранены!');
				
				subModal.remove();
				setTimeout(() => {
					const mainModal = document.querySelector('.modal'); 
					if(mainModal) mainModal.remove();
					openProfile();
				}, 50);
			};
			document.getElementById('close-avatar-modal-btn').onclick = () => subModal.remove();
			subModal.onclick = (e) => { if(e.target===subModal) subModal.remove(); };
		}

		document.getElementById('avatar-click-area').onclick = () => openAvatarSettingsModal(avatar, pVerify);
		document.getElementById('edit-player-id-btn').onclick = () => openEditIdModal(pId);
		document.getElementById('edit-player-name-btn').onclick = () => openEditNameModal(pName);
		
		const termBtn = document.getElementById('dev-terminal-btn');
		if(termBtn) termBtn.onclick = () => { modal.remove(); openDevTerminal(); };
		
		const resetBtn = document.getElementById('reset-save-profile-btn');
		if(resetBtn) resetBtn.onclick = resetGameState;
		
		const closeBtn = document.getElementById('close-profile-btn');
		if(closeBtn) closeBtn.onclick = () => modal.remove();
		
		modal.onclick = (e) => { if(e.target === modal) modal.remove(); };

		const upCheck = modal.querySelector('#always-upgrade-checkbox');
		if(upCheck) upCheck.onchange = function() { 
			if(typeof alwaysUpgradeSuccess !== 'undefined') {
				alwaysUpgradeSuccess = this.checked; 
				if(typeof showToast==='function') showToast(this.checked?'Апгрейд 100% включен':'Выключен'); 
				saveGameState(); 
			}
		};

		modal.querySelector('#cheat-unlock-all-frames')?.addEventListener('click', () => {
			Object.values(framesDatabase).forEach(f => { if(f.originalGiveFromLevel===undefined) f.originalGiveFromLevel=f.giveFromLevel; f.giveFromLevel=0; });
			if(typeof showToast==='function') showToast('Все рамки разблокированы!');
		});
		modal.querySelector('#cheat-lock-frames')?.addEventListener('click', () => {
			Object.values(framesDatabase).forEach(f => { if(f.originalGiveFromLevel!==undefined) f.giveFromLevel=f.originalGiveFromLevel; });
			if(typeof showToast==='function') showToast('Оригинальные уровни рамок восстановлены.');
		});

		const typeSelect = modal.querySelector('#cheat-rang-type');
		const rankSelect = modal.querySelector('#cheat-rang-select');
		const starsInput = modal.querySelector('#cheat-rang-stars');
		
		function updateRankOptions() {
			if(!typeSelect || !rankSelect) return;
			const type = typeSelect.value;
			rankSelect.innerHTML = Object.values(rangsDatabase).filter(r => r.type === type).map(r => `<option value="${r.id}">${r.name}</option>`).join('');
			if(userRangs[type]) {
				rankSelect.value = userRangs[type].current;
				if(starsInput) starsInput.value = userRangs[type].stars;
			}
		}
		if(typeSelect) typeSelect.onchange = updateRankOptions;
		setTimeout(updateRankOptions, 50);

		modal.querySelector('#cheat-apply-btn')?.addEventListener('click', () => {
			const type = typeSelect?.value;
			const rId = rankSelect?.value;
			const st = parseInt(starsInput?.value) || 0;
			const lv = parseInt(document.getElementById('cheat-level')?.value) || 1;
			const ex = parseInt(document.getElementById('cheat-exp')?.value) || 0;

			if(['mm','souz','duel'].includes(type) && rId) {
				userRangs[type].current = rId;
				userRangs[type].stars = st;
			}
			userLevel = Math.max(1, lv);
			userExp = Math.max(0, ex);
			if(typeof calculateExpToNextLevel === 'function') expToNextLevel = calculateExpToNextLevel(userLevel);
			
			saveGameState();
			if(typeof showToast==='function') showToast('Читы применены!');
			modal.remove();
			openProfile();
		});
		
		if (isStatTrack) UpdateStatrackFrame(balance);
	}

	const profileBtn = document.getElementById('profile-btn');
	if(profileBtn) profileBtn.addEventListener('click', openProfile);
	
	let currentBattlePass = null;
	let selectedBattlePassId = null;
	let battlePassLocked = false;
	let battlePassCooldown = null;

	const userBattlePasses = {};

	function initBattlePasses() {
		const savedBattlePasses = localStorage.getItem("battlePasses");
		if (savedBattlePasses) {
			Object.assign(userBattlePasses, JSON.parse(savedBattlePasses));
		}
		
		Object.keys(battlePassesDatabase).forEach(passId => {
			if (!userBattlePasses[passId]) {
				userBattlePasses[passId] = {
					level: 1,
					stars: 0,
					goldPass: false,
					locked: false,
					cooldown: 0
				};
			}
		});
		
		const savedCurrentPass = localStorage.getItem("currentBattlePass");
		if (savedCurrentPass && battlePassesDatabase[savedCurrentPass]) {
			currentBattlePass = battlePassesDatabase[savedCurrentPass];
			selectedBattlePassId = savedCurrentPass;
		} else {
			const firstPassId = Object.keys(battlePassesDatabase)[0];
			currentBattlePass = battlePassesDatabase[firstPassId];
			selectedBattlePassId = firstPassId;
		}
		
		checkBattlePassCooldowns();
		
		addBattlePassButton();
	}

	function checkBattlePassCooldowns() {
		const now = Date.now();
		Object.keys(userBattlePasses).forEach(passId => {
			if (userBattlePasses[passId].cooldown > now) {
				userBattlePasses[passId].locked = true;
			} else if (userBattlePasses[passId].cooldown > 0) {
				userBattlePasses[passId].locked = false;
				userBattlePasses[passId].cooldown = 0;
				saveBattlePasses();
			}
		});
	}

	function saveBattlePasses() {
		localStorage.setItem("battlePasses", JSON.stringify(userBattlePasses));
		localStorage.setItem("currentBattlePass", selectedBattlePassId);
	}
	
	function showToast(message, isError = false) {
		const toast = document.querySelector('.toast');
		toast.textContent = message;
		toast.style.backgroundColor = isError ? '#ff3333' : 'green';
		
		if (message.length > 50) {
			toast.classList.add('long');
		} else {
			toast.classList.remove('long');
		}
		
		toast.classList.add('show');
		
		setTimeout(() => {
			toast.classList.remove('show');
		}, 3000);
	}
	
	function exportGameState() {
		return JSON.stringify({
			balance: balance,
			inventory: inventory,
			userRangs: userRangs,
			userClan: userClan,
			currentFrame: currentFrame,
			userLevel: userLevel,
			userExp: userExp,
			expToNextLevel: expToNextLevel,
			currentMedals: currentMedals,
			// Добавляем настройки профиля в экспорт
			playerId: localStorage.getItem('playerId') || '',
			playerName: localStorage.getItem('playerName') || '',
			playerVerification: localStorage.getItem('playerVerification') || 'default',
			profileAvatar: localStorage.getItem('profile_avatar') || 'images/player.png'
		});
	}

	function downloadGameState() {
		const content = exportGameState();
		const blob = new Blob([content], { type: 'application/json' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = 'game_state.json';
		link.click();
		URL.revokeObjectURL(link.href);
	}
		
	function saveGameState() {
		localStorage.setItem("gameState", JSON.stringify({
			balance: balance,
			inventory: inventory,
			userRangs: userRangs,
			userClan: userClan,
			currentFrame: currentFrame,
			userLevel: userLevel,
			userExp: userExp,
			expToNextLevel: expToNextLevel,
			currentMedals: currentMedals,
			// Сохраняем профиль вместе с игрой
			playerId: localStorage.getItem('playerId'),
			playerName: localStorage.getItem('playerName'),
			playerVerification: localStorage.getItem('playerVerification'),
			profileAvatar: localStorage.getItem('profile_avatar')
		}));
	}

	function loadSavedGameState() {
		const savedState = localStorage.getItem("gameState");
		if (savedState) {
			try {
				const loadedState = JSON.parse(savedState);
				// Восстановление основных данных
				if (loadedState.balance !== undefined) balance = loadedState.balance;
				if (loadedState.inventory) inventory = loadedState.inventory;
				initializeMedalSlots();
				validateAndFixMedalSlots();
				if (loadedState.userRangs) Object.assign(userRangs, loadedState.userRangs);
				if (loadedState.userClan) Object.assign(userClan, loadedState.userClan);
				if (loadedState.currentFrame) currentFrame = loadedState.currentFrame;
				if (loadedState.userLevel !== undefined) userLevel = loadedState.userLevel;
				if (loadedState.userExp !== undefined) userExp = loadedState.userExp;
				if (loadedState.expToNextLevel !== undefined) expToNextLevel = loadedState.expToNextLevel;
				if (loadedState.currentMedals) currentMedals = loadedState.currentMedals;

				// Логика медалей при отсутствии данных
				if (!loadedState.currentMedals && inventory) {
					currentMedals = [null, null, null, null, null];
					inventory.forEach(item => {
						if (item.name.startsWith('Medal') && item.slot !== undefined && item.slot !== null) {
							if (item.slot >= 0 && item.slot < 5) {
								currentMedals[item.slot] = item.id;
							}
						}
					});
				}

				if (loadedState.playerId) localStorage.setItem('playerId', loadedState.playerId);
				if (loadedState.playerName) localStorage.setItem('playerName', loadedState.playerName);
				if (loadedState.playerVerification) localStorage.setItem('playerVerification', loadedState.playerVerification);
				if (loadedState.profileAvatar) {
					localStorage.setItem('profile_avatar', loadedState.profileAvatar);
				}

				// Логика рамок
				if (loadedState.currentFrame && framesDatabase[loadedState.currentFrame]) {
					Object.values(framesDatabase).forEach(f => f.equipped = false);
					framesDatabase[loadedState.currentFrame].equipped = true;
					currentFrame = loadedState.currentFrame;
				} else {
					Object.values(framesDatabase).forEach(f => f.equipped = false);
					framesDatabase['null_frame'].equipped = true;
					currentFrame = 'null_frame';
				}

				// Обновление интерфейса
				if(typeof balanceAmount !== 'undefined') balanceAmount.textContent = balance.toLocaleString('ru-RU');
				if(typeof UpdateStatrackFrame === 'function') UpdateStatrackFrame(balance);
				if(typeof updateInventory === 'function') updateInventory();
				
			} catch (err) { console.error("Ошибка загрузки:", err); }
		} else {
			// Если сохранения нет, ставим дефолты
			Object.values(framesDatabase).forEach(f => f.equipped = false);
			framesDatabase['null_frame'].equipped = true;
			currentFrame = 'null_frame';
		}
	}

	function resetGameState() {
		const existing = document.querySelector('#reset-confirm-modal');
		if (existing) existing.remove();
		const modal = document.createElement('div');
		modal.id = 'reset-confirm-modal';
		modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;z-index:10000;`;
		modal.innerHTML = `
		<div style="background:#222;padding:25px;border-radius:8px;text-align:center;border:2px solid #f44336;color:white;">
			<h3 style="color:#f44336;margin:0 0 15px;">Сброс сохранения</h3>
			<p>Вы уверены? Действие необратимо.</p>
			<div style="display:flex;gap:15px;justify-content:center;margin-top:20px;">
				<button id="confirm-reset" style="padding:10px 20px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;">Да</button>
				<button id="cancel-reset" style="padding:10px 20px;background:#555;color:white;border:none;border-radius:4px;cursor:pointer;">Отмена</button>
			</div>
		</div>`;
		document.body.appendChild(modal);

		document.getElementById('confirm-reset').onclick = () => {
			localStorage.clear();
			balance = 0; inventory = [];
			const candidates = itemsDatabase.filter(i => i.rarity === 'box-none');
			if (candidates.length) inventory.push({...candidates[Math.floor(Math.random() * candidates.length)]});
			userRangs = { mm: { current: 'lock_mm', stars: 0 }, souz: { current: 'lock_souz', stars: 0 }, duel: { current: 'lock_duel', stars: 0 } };
			userClan = { name: "", rank: "colib_clan", stars: 0, members: [], balance: 0, storage: [] };
			currentFrame = 'null_frame'; userLevel = 1; userExp = 0;
			if(typeof calculateExpToNextLevel === 'function') expToNextLevel = calculateExpToNextLevel(1); 
			currentMedals = [null, null, null, null, null];
			Object.values(framesDatabase).forEach(f => f.equipped = false);
			framesDatabase['null_frame'].equipped = true;
			localStorage.removeItem("gameState");
			localStorage.setItem('playerId', '');
			localStorage.setItem('playerName', '');
			localStorage.setItem('playerVerification', 'default');
			if(typeof balanceAmount !== 'undefined') balanceAmount.textContent = "0"; 
			if(typeof UpdateStatrackFrame === 'function') UpdateStatrackFrame(0); 
			if(typeof updateInventory === 'function') updateInventory();
			if(typeof showToast === 'function') showToast("Сохранение сброшено");
			modal.remove();
			location.reload();
		};
		document.getElementById('cancel-reset').onclick = () => modal.remove();
		modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
	}
	
	function addResetButtonToInventory() {
		const inventoryActions = document.querySelector('.inventory-actions');
		if (inventoryActions && !document.getElementById('reset-save-btn')) {
			const resetBtn = document.createElement('button');
			resetBtn.id = 'reset-save-btn';
			resetBtn.textContent = 'Сбросить сохранение';
			resetBtn.style.padding = '10px 15px';
			resetBtn.style.backgroundColor = '#ff4444';
			resetBtn.style.color = 'white';
			resetBtn.style.border = 'none';
			resetBtn.style.borderRadius = '4px';
			resetBtn.style.cursor = 'pointer';
			resetBtn.style.marginLeft = '10px';
			
			resetBtn.addEventListener('click', resetGameState);
			
			const exportBtn = document.getElementById('export-database-btn');
			if (exportBtn) {
				exportBtn.parentNode.insertBefore(resetBtn, exportBtn.nextSibling);
			} else {
				inventoryActions.appendChild(resetBtn);
			}
		}
	}
	
	function getMedalImage(medalId) {
		if (!medalId) {
			return 'images/none_item.png';
		}
		
		const medalFromDb = itemsDatabase.find(item => item.id === medalId);
		if (medalFromDb && medalFromDb.image) {
			return medalFromDb.image;
		}
		
		const medalFromInventory = inventory.find(item => item.id === medalId);
		if (medalFromInventory && medalFromInventory.image) {
			return medalFromInventory.image;
		}
		return 'images/none_item.png';
	}

	function UpdateStatrackFrame(balance) {
		const balanceDisplay = document.querySelector('.profile-stattrack-balance');
		if (balanceDisplay) {
			let formattedBalance;
			if (balance > 999000000000) {
				formattedBalance = 'infinity';
			} else if (balance > 999000000) {
				formattedBalance = `${Math.round(balance/1000000000)}B ₽`;
			} else if (balance > 999000) {
				formattedBalance = `${Math.round(balance/1000000)}M ₽`;
			} else if (balance > 999) {
				formattedBalance = `${Math.round(balance/1000)}K ₽`;
			} else {
				formattedBalance = `${balance.toLocaleString('ru-RU')} ₽`;
			}
			balanceDisplay.textContent = formattedBalance;
		}
	}

	function loadGameState(fileContent) {
		try {
			const loadedState = JSON.parse(fileContent);
			
			if (!loadedState || !loadedState.balance || !Array.isArray(loadedState.inventory)) {
				showToast("Некорректный формат файла: отсутствуют необходимые поля balance или inventory.");
			}

			balance = loadedState.balance;
			inventory = loadedState.inventory;
			balanceAmount.textContent = balance.toLocaleString('ru-RU');
			UpdateStatrackFrame(balance);
			
			if (loadedState.userRangs) {
				Object.assign(userRangs, loadedState.userRangs);
			}
			
			if (loadedState.userClan) {
				Object.assign(userClan, loadedState.userClan);
			} else {
				userClan = {
					name: "",
					rank: "colib_clan",
					stars: 0,
					members: [],
					balance: 0,
					storage: []
				};
			}
			
			 if (loadedState.currentMedals) {
                currentMedals = loadedState.currentMedals;
                currentMedals = currentMedals.map(idx => {
                    if (idx !== null && (idx < 0 || idx >= inventory.length)) {
                        return null;
                    }
                    return idx;
                });
            } else if (loadedState.currentMedal) {
                const oldMedalIndex = inventory.findIndex(item => item.id === loadedState.currentMedal);
                currentMedals = [oldMedalIndex !== -1 ? oldMedalIndex : null, null, null, null, null];
            }
			
			validateAndFixMedalSlots();
			
			if (loadedState.playerId) localStorage.setItem('playerId', loadedState.playerId);
			if (loadedState.playerName) localStorage.setItem('playerName', loadedState.playerName);
			if (loadedState.playerVerification) localStorage.setItem('playerVerification', loadedState.playerVerification);
			
			if (loadedState.currentFrame) {
				Object.values(framesDatabase).forEach(f => {
					f.equipped = false;
				});
				
				if (framesDatabase[loadedState.currentFrame]) {
					framesDatabase[loadedState.currentFrame].equipped = true;
					if (loadedState.userLevel < framesDatabase[loadedState.currentFrame].giveFromLevel) {
						framesDatabase[loadedState.currentFrame].giveFromLevel = 0; // снимаем ограничение по уровню с рамки
					}
					currentFrame = loadedState.currentFrame;
					framesDatabase[currentFrame].equipped = true;
				} else {
					framesDatabase['null_frame'].equipped = true;
					currentFrame = 'null_frame';
				}
			} else {
				Object.values(framesDatabase).forEach(f => {
					f.equipped = false;
				});
				framesDatabase['null_frame'].equipped = true;
				currentFrame = 'null_frame';
			}
			
			if (loadedState.userLevel) {
				userLevel = loadedState.userLevel;
				userExp = loadedState.userExp || 0;
				expToNextLevel = loadedState.expToNextLevel || calculateExpToNextLevel(userLevel);
			} else {
				userLevel = 1;
				userExp = 0;
				expToNextLevel = 300;
			}
			
			updateInventory();
			showToast("Игра восстановлена успешно!");
		} catch (err) {
			showToast("Ошибка при загрузке файла:" + err.message);
		}
	}
	
	function addExp(amount) {
		userExp += amount * 0.5;

		const levelsGained = Math.floor(userExp / expToNextLevel);
		const oldLevel = userLevel;
		
		if (levelsGained > 0) {
			userLevel += levelsGained;
			userExp %= expToNextLevel;
			expToNextLevel = calculateExpToNextLevel(userLevel);

			showToast(`Поздравляем! Вы получили ${levelsGained} уровней (текущий: ${userLevel})`);

			const unlockedFrames = Object.values(framesDatabase).filter(frame => 
				frame.giveFromLevel > oldLevel && 
				frame.giveFromLevel <= userLevel && 
				frame.levelFrameImg
			);

			if (unlockedFrames.length > 0) {
				
				const bestFrame = unlockedFrames.reduce((prev, current) => 
					(prev.giveFromLevel > current.giveFromLevel) ? prev : current
				);
				if (unlockedFrames.length === 1) {
					showToast(`Разблокирована новая рамка: ${bestFrame.name}!`);
				} else {
					showToast(`Разблокировано ${unlockedFrames.length} новых рамок! Применена: ${bestFrame.name}`);
				}
			}
		}

		balanceAmount.textContent = balance.toLocaleString('ru-RU');
		UpdateStatrackFrame(balance);
		saveGameState();
	}
	
	function openClanItemDepositModal() {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.display = 'flex';
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100%';
		modal.style.height = '100%';
		modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
		modal.style.zIndex = '1001';
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';

		modal.innerHTML = `
			<div class="modal-content" style="background-color: rgb(30 30 30 / 85%); padding: 20px; border-radius: 8px; width: 80%; max-width: 800px; max-height: 80vh; overflow: auto;">
				<h2 style="text-align: center;">Выберите предметы для пополнения клана</h2>
				
				<!-- Добавляем кнопки управления выделением -->
				<div style="text-align: center; margin-bottom: 15px;">
					<button id="select-all-items" style="padding: 8px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Выделить все</button>
					<button id="deselect-all-items" style="padding: 8px 15px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Снять выделение</button>
				</div>
				
				<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; margin-top: 20px;" id="clan-items-container">
					${inventory.map((item, index) => {
						const originalItem = itemsDatabase.find(dbItem => dbItem.id === item.id);
						if (!originalItem || originalItem.itemInStore === false) return '';
						if (item.name && item.name.startsWith('Medal')) {
							if (item.slot !== undefined && item.slot !== null) {
								return  ''; // Примененную медаль не продаем
							}
						}
						
						let itemValue = Math.round((originalItem.price * 0.8) * 100) / 100;
						
						if (item.isRental) {
							itemValue = Math.round((originalItem.price) * 100) / 100;
						}
						
						if (item.stickers) {
							item.stickers.forEach(sticker => {
								const stickerItem = itemsDatabase.find(dbItem => dbItem.id === sticker.id);
								if (stickerItem && stickerItem.itemInStore !== false) {
									itemValue += Math.round((stickerItem.price * 0.1) * 100) / 100;
								}
							});
						}
						
						if (item.charm) {
							const charmItem = itemsDatabase.find(dbItem => dbItem.id === item.charm.id);
							if (charmItem && charmItem.itemInStore !== false) {
								itemValue += Math.round((charmItem.price * 0.8) * 100) / 100;
							}
						}
						
						return `
							<div class="clan-item" data-index="${index}" data-value="${itemValue}" data-is-rental="${item.isRental || 'false'}" style="background-color: #2a2a2a; padding: 15px; border-radius: 8px; text-align: center; cursor: pointer;">
								<img src="${item.image}" alt="${item.name}" width="80">
								<div style="margin-top: 10px; font-weight: bold;">${item.name}</div>
								<div class="inventory-item-rarity ${rarities[item.rarity].color}">
									${rarities[item.rarity].name}
								</div>
								<div style="margin-top: 5px; color: gold;">${itemValue.toFixed(2)} ₽</div>
								${item.isRental ? `
									<div style="margin-top: 5px; font-size: 12px; color: #ffa500;">
										Арендованный предмет
									</div>
								` : ''}
								${item.stickers && item.stickers.length > 0 ? `
									<div style="margin-top: 5px; font-size: 12px; color: #aaa;">
										Стикеры: ${item.stickers.length}
									</div>
								` : ''}
								${item.charm ? `
									<div style="margin-top: 5px; font-size: 12px; color: #aaa;">
										Есть брелок
									</div>
								` : ''}
							</div>
						`;
					}).join('')}
				</div>
				<div style="text-align: center; margin-top: 20px;">
					<div id="clan-items-total" style="font-size: 18px; margin-bottom: 10px;">Общая стоимость: 0 ₽</div>
					<button id="confirm-clan-items-deposit" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Внести выбранное</button>
					<button id="cancel-clan-items-deposit" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Отмена</button>
				</div>
			</div>
		`;

		document.body.appendChild(modal);
		
		let selectedItems = [];
		let totalValue = 0;
		
		modal.querySelectorAll('.clan-item').forEach(item => {
			item.addEventListener('click', function() {
				const index = parseInt(this.getAttribute('data-index'));
				const value = Math.round(parseFloat(this.getAttribute('data-value')) * 100) / 100;
				
				if (this.classList.contains('selected')) {
					this.classList.remove('selected');
					this.style.border = 'none';
					selectedItems = selectedItems.filter(i => i.index !== index);
					totalValue -= value;
					totalValue = Math.round(totalValue * 100) / 100;
				} else {
					this.classList.add('selected');
					this.style.border = '2px solid gold';
					selectedItems.push({ index, value });
					totalValue += value;
					totalValue = Math.round(totalValue * 100) / 100;
				}
				
				modal.querySelector('#clan-items-total').textContent = `Общая стоимость: ${totalValue.toFixed(2)} ₽`;
			});
		});
		
		document.getElementById('select-all-items').addEventListener('click', function() {
			modal.querySelectorAll('.clan-item').forEach(item => {
				const index = parseInt(item.getAttribute('data-index'));
				const value =  Math.round(parseFloat(item.getAttribute('data-value')) * 100) / 100;
				
				if (!item.classList.contains('selected')) {
					item.classList.add('selected');
					item.style.border = '2px solid gold';
					
					if (!selectedItems.some(i => i.index === index)) {
						selectedItems.push({ index, value });
						totalValue += value;
						totalValue = Math.round(totalValue * 100) / 100;
					}
				}
			});
			
			modal.querySelector('#clan-items-total').textContent = `Общая стоимость: ${totalValue.toFixed(2)} ₽`;
			showToast('Все предметы выделены');
		});

		document.getElementById('deselect-all-items').addEventListener('click', function() {
			modal.querySelectorAll('.clan-item').forEach(item => {
				item.classList.remove('selected');
				item.style.border = 'none';
			});
			
			selectedItems = [];
			totalValue = 0;
			modal.querySelector('#clan-items-total').textContent = `Общая стоимость: 0 ₽`;
			showToast('Выделение снято со всех предметов');
		});
		
		modal.querySelector('#confirm-clan-items-deposit').addEventListener('click', function() {
			if (selectedItems.length === 0) {
				showToast('Выберите хотя бы один предмет', true);
				return;
			}

			let totalDepositValue = 0;
			let totalExpToAdd = 0;
			let totalMmrToAdd = 0;

			const indicesToRemove = new Set(selectedItems.map(item => item.index));

			selectedItems.forEach(selected => {
				const value = selected.value;
				totalDepositValue += value;
				
				totalExpToAdd += Math.round(value);
				totalMmrToAdd += Math.round(value * 0.1 * 100) / 100;
			});

			inventory = inventory.filter((item, index) => !indicesToRemove.has(index));

			userClan.balance += totalDepositValue;
			userClan.balance = Math.round(userClan.balance * 100) / 100;

			if (totalExpToAdd > 0) {
				addExp(totalExpToAdd);
				updateDuelRang(totalDepositValue); // Передаем общую сумму, если функция поддерживает
			}
			
			if (totalMmrToAdd > 0) {
				updateClanRank(totalMmrToAdd);
			}

			showToast(`Внесено предметов на сумму ${totalDepositValue.toFixed(2)} ₽`);
			saveGameState();

			document.querySelectorAll('.modal').forEach(modal => modal.remove());
			openClanMenu();
		});
		
		modal.querySelector('#cancel-clan-items-deposit').addEventListener('click', function() {
			modal.remove();
		});
	}

	function openClanWithdrawModal() {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.display = 'flex';
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100%';
		modal.style.height = '100%';
		modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
		modal.style.zIndex = '1001';
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';

		let availableItems = itemsDatabase.filter(item => 
			item.itemInStore !== false && !item.isRental
		);

		let sortConfig = {
			key: 'price', // 'price' или 'name'
			order: 'desc' // 'asc' или 'desc'
		};

		function sortItems(items) {
			return items.sort((a, b) => {
				let valA, valB;
				
				if (sortConfig.key === 'price') {
					valA = Math.round((a.price * 0.8) * 100) / 100;
					valB = Math.round((b.price * 0.8) * 100) / 100;
				} else {
					valA = a.name.toLowerCase();
					valB = b.name.toLowerCase();
				}

				if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
				if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
				return 0;
			});
		}

		sortItems(availableItems);

		modal.innerHTML = `
			<div class="modal-content" style="background-color: rgb(30 30 30 / 85%); padding: 20px; border-radius: 8px; width: 80%; max-width: 800px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
				<h2 style="text-align: center;">Снять предметы из клана</h2>
				
				<div style="margin-bottom: 15px; text-align: center;">
					<div class="clan-balance-total" id="clan-balance-total" style="font-size: 18px; margin-bottom: 10px; color: gold;">
						Баланс клана: ${userClan.balance.toLocaleString('ru-RU')} ₽
					</div>
					
					<!-- Поле поиска -->
					<div style="margin-bottom: 12px;">
						<input type="text" id="clan-withdraw-search" placeholder="Поиск по названию или коллекции..." 
							   style="width: 100%; max-width: 400px; padding: 8px 12px; border-radius: 4px; border: 1px solid #555; background: #222; color: white; box-sizing: border-box;">
					</div>
					
					<div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
						<button id="sort-by-price-btn" class="sort-btn active" style="padding: 5px 10px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
							По цене ↓
						</button>
						<button id="sort-by-name-btn" class="sort-btn" style="padding: 5px 10px; background-color: #5555ff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
							По названию
						</button>
						<button id="clear-selection-btn" class="sort-btn" style="padding: 5px 10px; background-color: #ff5555; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
							Очистить выделение
						</button>
					</div>
					<div style="margin-top: 5px; font-size: 11px; color: #aaa;">
						Подсказка: <b>Alt</b> = макс. кол-во, <b>Ctrl+Alt</b> = снять всё, <b>Shift</b> = +10 шт.
					</div>
				</div>
				
				<div style="position: relative; flex: 1; overflow: hidden;">
					<div id="clan-withdraw-items-container" class="global-ui" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; max-height: 400px; overflow-y: auto; padding: 10px;">
						${availableItems.map(item => {
							const itemValue = Math.round((item.price * 0.8) * 100) / 100;
							const collectionName = collectionsDatabase[item.collection]?.name || item.collection || '';
							return `
								<div class="clan-withdraw-item" 
										 data-id="${item.id}" 
										 data-value="${itemValue}" 
										 data-name="${item.name}" 
										 data-collection="${collectionName}"
										 style="background-color: #2a2a2a; padding: 15px; border-radius: 8px; text-align: center; cursor: pointer; position: relative; transition: transform 0.1s;">
									<img src="${item.image}" alt="${item.name}" width="80" style="border-radius: 5px;">
									<div style="margin-top: 10px; font-weight: bold; font-size: 14px; height: 40px; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
									<div style="margin-top: 5px; color: gold; font-weight: bold; font-size: 16px;">${itemValue.toFixed(2)} ₽</div>
									<div style="margin-top: 3px; font-size: 11px; color: #aaa;">${collectionName}</div>
								</div>
							`;
						}).join('')}
					</div>
					
					<!-- Кнопки прокрутки -->
					<button id="scroll-up-btn" class="scroll-btn" style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); width: 40px; height: 40px; border-radius: 50%; background-color: #333; color: white; border: none; cursor: pointer; z-index: 10; display: none;">↑</button>
					<button id="scroll-down-btn" class="scroll-btn" style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); width: 40px; height: 40px; border-radius: 50%; background-color: #333; color: white; border: none; cursor: pointer; z-index: 10; display: none;">↓</button>
				</div>
				
				<div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #333;">
					<div id="clan-withdraw-total" style="font-size: 18px; margin-bottom: 10px; font-weight: bold;">Общая стоимость: 0 ₽</div>
					<div id="clan-withdraw-balance" style="font-size: 16px; margin-bottom: 15px; color: #ffaa00;">
						Доступно: ${userClan.balance.toLocaleString('ru-RU')} ₽
					</div>
					<div style="display: flex; justify-content: center; gap: 10px;">
						<button id="confirm-clan-withdraw" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; min-width: 120px;">Снять выбранное</button>
						<button id="cancel-clan-withdraw" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; min-width: 120px;">Отмена</button>
					</div>
				</div>
			</div>
		`;

		document.body.appendChild(modal);
		
		let selectedItems = [];
		let totalValue = 0;
		let currentItems = [...availableItems];
		
		const itemsContainer = modal.querySelector('#clan-withdraw-items-container');
		const scrollUpBtn = modal.querySelector('#scroll-up-btn');
		const scrollDownBtn = modal.querySelector('#scroll-down-btn');
		const searchInput = modal.querySelector('#clan-withdraw-search');
		const priceBtn = modal.querySelector('#sort-by-price-btn');
		const nameBtn = modal.querySelector('#sort-by-name-btn');

		function filterItems() {
			const searchTerm = searchInput.value.trim().toLowerCase();
			
			let filtered = availableItems.filter(item => {
				const name = item.name.toLowerCase();
				const collectionName = (collectionsDatabase[item.collection]?.name || item.collection || '').toLowerCase();
				return name.includes(searchTerm) || collectionName.includes(searchTerm);
			});

			sortItems(filtered);
			currentItems = filtered;
			updateItemsDisplay(filtered);
		}

		searchInput.addEventListener('input', filterItems);
		
		function updateItemsDisplay(items) {
			itemsContainer.innerHTML = items.map(item => {
				const itemValue = Math.round((item.price * 0.8) * 100) / 100;
				const collectionName = collectionsDatabase[item.collection]?.name || item.collection || '';
				
				const selectedItem = selectedItems.find(si => si.id === item.id);
				const isSelectedClass = selectedItem ? 'selected' : '';
				const borderStyle = selectedItem ? '2px solid gold' : 'none';
				const badgeHtml = selectedItem ? 
					`<div class="selected-quantity" style="position: absolute; top: 5px; right: 5px; background-color: gold; color: black; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">${selectedItem.quantity}</div>` 
					: '';

				return `
					<div class="clan-withdraw-item ${isSelectedClass}" 
						 data-id="${item.id}" 
						 data-value="${itemValue}" 
						 data-name="${item.name}" 
						 style="background-color: #2a2a2a; padding: 15px; border-radius: 8px; text-align: center; cursor: pointer; position: relative; border: ${borderStyle};">
						${badgeHtml}
						<img src="${item.image}" alt="${item.name}" width="80" style="border-radius: 5px;">
						<div style="margin-top: 10px; font-weight: bold; font-size: 14px; height: 40px; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
						<div style="margin-top: 5px; color: gold; font-weight: bold; font-size: 16px;">${itemValue.toFixed(2)} ₽</div>
						<div style="margin-top: 3px; font-size: 11px; color: #aaa;">${collectionName}</div>
					</div>
				`;
			}).join('');
			
			bindItemHandlers();
		}
		
		function bindItemHandlers() {
			modal.querySelectorAll('.clan-withdraw-item').forEach(item => {
				item.addEventListener('click', function(e) {
					e.preventDefault(); // Предотвращаем стандартное поведение

					const itemId = this.getAttribute('data-id');
					const value = parseFloat(this.getAttribute('data-value'));
					const itemName = this.getAttribute('data-name');

					const isCtrl = e.ctrlKey || e.metaKey;
					const isShift = e.shiftKey;
					const isAlt = e.altKey;

					const existingItemIndex = selectedItems.findIndex(i => i.id === itemId);
					const isSelected = existingItemIndex !== -1;

					if (isCtrl && isAlt) {
						if (!isSelected) return;
						
						selectedItems.splice(existingItemIndex, 1);
						totalValue -= (selectedItems[existingItemIndex] ? selectedItems[existingItemIndex].totalValue : 0); // На случай ошибки логики, но лучше пересчитать
						
						recalculateTotal();
						
						updateItemsDisplay(currentItems); // Полная перерисовка для удаления бейджа
						showToast(`Полностью снято: ${itemName}`);
						return;
					}

					if (value === 0) {
						let quantityChange = 1;
						
						if (isAlt) {
							quantityChange = 100; 
						} else if (isShift) {
							quantityChange = 10;
						}

						if (isCtrl && !isAlt) {
							if (!isSelected) return;
							
							const currentQty = selectedItems[existingItemIndex].quantity;
							const removeAmount = isShift ? Math.min(10, currentQty) : 1; // Shift здесь работает как ускоритель удаления

							selectedItems[existingItemIndex].quantity -= removeAmount;
							
							if (selectedItems[existingItemIndex].quantity <= 0) {
								selectedItems.splice(existingItemIndex, 1);
							}
							
							recalculateTotal();
							updateItemsDisplay(currentItems);
							if (removeAmount > 1) showToast(`Удалено ${removeAmount} шт. ${itemName}`);
						} else {
							if (isSelected) {
								selectedItems[existingItemIndex].quantity += quantityChange;
							} else {
								selectedItems.push({ 
									id: itemId, 
									value: 0,
									quantity: quantityChange,
									totalValue: 0,
									name: itemName
								});
							}
							recalculateTotal();
							updateItemsDisplay(currentItems);
							if (quantityChange > 1) showToast(`Добавлено ${quantityChange} шт. ${itemName}`);
						}
						return;
					}

					if (isCtrl && !isAlt) {
						if (!isSelected) return;

						const currentQty = selectedItems[existingItemIndex].quantity;
						const removeAmount = isShift ? Math.min(10, currentQty) : 1;

						selectedItems[existingItemIndex].quantity -= removeAmount;
						
						if (selectedItems[existingItemIndex].quantity <= 0) {
							selectedItems.splice(existingItemIndex, 1);
						}

						recalculateTotal();
						updateItemsDisplay(currentItems);
						if (removeAmount > 1) showToast(`Удалено ${removeAmount} шт. ${itemName}`);
						return;
					}

					let quantityToAdd = 1;
					
					if (isAlt) {
						const affordableBalance = userClan.balance - totalValue;
						if (affordableBalance < value) {
							showToast('Недостаточно средств даже для 1 шт.', true);
							return;
						}
						quantityToAdd = Math.floor(affordableBalance / value);
					} else if (isShift) {
						quantityToAdd = 10;
					}

					const affordableBalance = userClan.balance - totalValue;
					const maxAffordable = Math.floor(affordableBalance / value);
					
					if (maxAffordable <= 0) {
						showToast('Недостаточно средств в клане', true);
						return;
					}

					const finalQuantityToAdd = Math.min(quantityToAdd, maxAffordable);

					if (finalQuantityToAdd <= 0) {
						 showToast('Невозможно добавить больше (лимит баланса)', true);
						 return;
					}

					if (isSelected) {
						selectedItems[existingItemIndex].quantity += finalQuantityToAdd;
					} else {
						selectedItems.push({ 
							id: itemId, 
							value: value,
							quantity: finalQuantityToAdd,
							totalValue: value * finalQuantityToAdd,
							name: itemName
						});
					}

					recalculateTotal();
					updateItemsDisplay(currentItems);
					
					if (isAlt) {
						showToast(`Добавлено макс. возможное: ${finalQuantityToAdd} шт.`);
					} else if (finalQuantityToAdd > 1) {
						showToast(`Добавлено ${finalQuantityToAdd} шт.`);
					}
				});
			});
		}

		function recalculateTotal() {
			totalValue = selectedItems.reduce((sum, item) => sum + (item.value * item.quantity), 0);
			totalValue = Math.round(totalValue * 100) / 100;
			updateTotalDisplay();
		}
		
		function clearSelection() {
			selectedItems = [];
			totalValue = 0;
			updateItemsDisplay(currentItems);
			showToast('Выделение очищено');
		}
		
		function updateTotalDisplay() {
			let itemsInfo = '';
			if (selectedItems.length > 0) {
				itemsInfo = selectedItems.map(item => 
					`${item.name} ×${item.quantity}`
				).join(', ');
				
				if (itemsInfo.length > 60) {
					itemsInfo = itemsInfo.substring(0, 57) + '...';
				}
			}
			
			modal.querySelector('#clan-withdraw-total').innerHTML = `
				<div>Общая стоимость: ${totalValue.toFixed(2)} ₽</div>
				${itemsInfo ? `<div style="font-size: 13px; color: #aaa; margin-top: 5px;">${itemsInfo}</div>` : ''}
			`;
			
			const remainingBalance = userClan.balance - totalValue;
			const balanceElement = modal.querySelector('#clan-withdraw-balance');
			balanceElement.textContent = `Доступно: ${remainingBalance.toLocaleString('ru-RU')} ₽`;
			
			balanceElement.style.color = remainingBalance < 0 ? '#ff3333' : '#ffaa00';
		}
		
		function applySorting(key) {
			if (sortConfig.key === key) {
				sortConfig.order = sortConfig.order === 'asc' ? 'desc' : 'asc';
			} else {
				sortConfig.key = key;
				sortConfig.order = 'desc'; // По умолчанию при смене категории сортируем по убыванию
			}

			[priceBtn, nameBtn].forEach(btn => btn.classList.remove('active'));
			
			const activeBtn = key === 'price' ? priceBtn : nameBtn;
			activeBtn.classList.add('active');
			
			const arrow = sortConfig.order === 'asc' ? '↑' : '↓';
			if (key === 'price') {
				priceBtn.innerHTML = `По цене ${arrow}`;
				priceBtn.style.backgroundColor = '#4CAF50';
				nameBtn.style.backgroundColor = '#5555ff';
			} else {
				nameBtn.innerHTML = `По названию ${arrow}`;
				nameBtn.style.backgroundColor = '#4CAF50'; // Зеленый для активной
				priceBtn.style.backgroundColor = '#5555ff';
			}

			sortItems(currentItems);
			updateItemsDisplay(currentItems);
		}

		priceBtn.addEventListener('click', () => applySorting('price'));
		nameBtn.addEventListener('click', () => applySorting('name'));
		
		modal.querySelector('#clear-selection-btn').addEventListener('click', clearSelection);
		
		scrollUpBtn.addEventListener('click', () => itemsContainer.scrollTo({ top: 0, behavior: 'smooth' }));
		scrollDownBtn.addEventListener('click', () => itemsContainer.scrollTo({ top: itemsContainer.scrollHeight, behavior: 'smooth' }));
		
		itemsContainer.addEventListener('scroll', function() {
			scrollUpBtn.style.display = this.scrollTop > 50 ? 'block' : 'none';
			scrollDownBtn.style.display = this.scrollTop < this.scrollHeight - this.clientHeight - 50 ? 'block' : 'none';
		});
		
		bindItemHandlers();
		
		modal.querySelector('#confirm-clan-withdraw').addEventListener('click', function() {
			if (selectedItems.length === 0) {
				showToast('Выберите хотя бы один предмет', true);
				return;
			}
			
			if (userClan.balance < totalValue) {
				showToast('Недостаточно средств в клане', true);
				return;
			}
			
			selectedItems.forEach(selected => {
				const itemData = itemsDatabase.find(item => item.id === selected.id);
				
				if (itemData) {
					userClan.balance -= selected.totalValue;
					userClan.balance = Math.round(userClan.balance * 100) / 100;
					
					if (typeof updateMMRang === 'function') updateMMRang(selected.totalValue);
					
					for (let i = 0; i < selected.quantity; i++) {
						inventory.push({
							id: itemData.id,
							name: itemData.name,
							rarity: itemData.rarity,
							image: itemData.image
						});
					}
				}
			});
			
			showToast(`Снято предметов на сумму ${totalValue.toFixed(2)} ₽`);
			if (typeof saveGameState === 'function') saveGameState();
			if (typeof updateInventory === 'function') updateInventory();
			
			document.querySelectorAll('.modal').forEach(m => m.remove());
			if (typeof openClanMenu === 'function') openClanMenu();
		});
		
		modal.querySelector('#cancel-clan-withdraw').addEventListener('click', () => modal.remove());
		
		modal.addEventListener('click', function(e) {
			if (e.target === modal) modal.remove();
		});
	}
	
	function openClanStorageDepositModal() {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.cssText = `display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); z-index: 1001; justify-content: center; align-items: center;`;
		
		let itemsHtml = '';
		inventory.forEach((item, index) => {
			if (item.name && item.name.startsWith('Medal')) {
				if (item.slot !== undefined && item.slot !== null) {
					return '';
				}
			}
			const originalItem = itemsDatabase.find(dbItem => dbItem.id === item.id);
			if (!originalItem || originalItem.itemInStore === false) return '';

			const rarityInfo = rarities[item.rarity] || { color: 'common', name: 'Обычный' };
			const hasStickers = item.stickers && item.stickers.length > 0;
			const hasCharm = !!item.charm;
			const isRental = item.isRental;

			itemsHtml += `
			<div class="clan-storage-item" data-index="${index}" style="background-color: #2a2a2a; padding: 12px; border-radius: 8px; text-align: center; cursor: pointer; border: 2px solid transparent; transition: 0.2s;">
				<div style="position: relative; margin-bottom: 8px;">
					<img src="${item.image}" alt="${item.name}" width="80" style="border-radius: 4px;">
					${isRental ? '<div style="position:absolute;top:2px;right:2px;background:#ffa500;color:#000;font-size:10px;padding:2px 4px;border-radius:3px;">RENT</div>' : ''}
				</div>
				<div style="font-weight:bold;font-size:13px;margin:5px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</div>
				<div class="inventory-item-rarity ${rarityInfo.color}" style="font-size:11px;padding:2px 6px;border-radius:3px;display:inline-block;">${rarityInfo.name}</div>
				
				<div style="margin-top:8px;font-size:11px;color:#aaa;display:flex;justify-content:center;gap:8px;">
					${hasStickers ? `<span>🏷️ ${item.stickers.length}</span>` : ''}
					${hasCharm ? `<span>🔑 Есть</span>` : ''}
				</div>
				
				${!isRental && (hasStickers || hasCharm) ? `
				<div style="margin-top:5px;display:flex;justify-content:center;gap:2px;flex-wrap:wrap;">
					${item.stickers ? item.stickers.slice(0, 3).map(s => `<img src="${s.image}" width="18" style="border:1px solid #444;border-radius:2px;">`).join('') : ''}
					${hasCharm ? `<img src="${item.charm.image}" width="18" style="border:1px solid #444;border-radius:2px;">` : ''}
				</div>` : ''}
			</div>`;
		});

		modal.innerHTML = `
		<div class="modal-content" style="background-color: rgb(30 30 30 / 85%); padding: 20px; border-radius: 8px; width: 90%; max-width: 900px; max-height: 85vh; display: flex; flex-direction: column;">
			<h2 style="text-align: center; margin-bottom: 15px;">Положить в хранилище клана</h2>
			<p style="text-align: center; color: #aaa; font-size: 13px; margin-bottom: 10px;">Предметы сохраняются со всеми стикерами и брелками.</p>
			
			<div style="text-align: center; margin-bottom: 10px;">
				<button id="select-all-storage-dep" style="padding: 6px 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Все</button>
				<button id="deselect-all-storage-dep" style="padding: 6px 12px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Снять</button>
			</div>

			<div id="storage-deposit-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; overflow-y: auto; padding: 5px; flex: 1;">
				${itemsHtml || '<div style="grid-column: 1/-1; text-align: center; padding: 20px;">Инвентарь пуст или нет подходящих предметов</div>'}
			</div>

			<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #444; text-align: center;">
				<div style="margin-bottom: 10px;">Выбрано: <span id="storage-dep-count" style="color: gold; font-weight: bold;">0</span></div>
				<button id="confirm-storage-dep" style="padding: 10px 25px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Внести в хранилище</button>
				<button id="cancel-storage-dep" style="padding: 10px 25px; background: #555; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Отмена</button>
			</div>
		</div>`;

		document.body.appendChild(modal);
		
		let selectedIndices = [];
		const grid = modal.querySelector('#storage-deposit-grid');
		const countSpan = modal.querySelector('#storage-dep-count');

		grid.querySelectorAll('.clan-storage-item').forEach(el => {
			el.addEventListener('click', function() {
				const idx = parseInt(this.dataset.index);
				if (this.classList.contains('selected')) {
					this.classList.remove('selected');
					this.style.borderColor = 'transparent';
					selectedIndices = selectedIndices.filter(i => i !== idx);
				} else {
					this.classList.add('selected');
					this.style.borderColor = 'gold';
					if (!selectedIndices.includes(idx)) selectedIndices.push(idx);
				}
				countSpan.textContent = selectedIndices.length;
			});
		});

		modal.querySelector('#select-all-storage-dep').addEventListener('click', () => {
			grid.querySelectorAll('.clan-storage-item').forEach(el => {
				if (!el.classList.contains('selected')) {
					el.classList.add('selected');
					el.style.borderColor = 'gold';
					const idx = parseInt(el.dataset.index);
					if (!selectedIndices.includes(idx)) selectedIndices.push(idx);
				}
			});
			countSpan.textContent = selectedIndices.length;
		});

		modal.querySelector('#deselect-all-storage-dep').addEventListener('click', () => {
			grid.querySelectorAll('.clan-storage-item').forEach(el => {
				el.classList.remove('selected');
				el.style.borderColor = 'transparent';
			});
			selectedIndices = [];
			countSpan.textContent = '0';
		});

		modal.querySelector('#confirm-storage-dep').addEventListener('click', () => {
			if (selectedIndices.length === 0) {
				showToast('Выберите предметы', true);
				return;
			}

			selectedIndices.sort((a, b) => b - a);

			selectedIndices.forEach(idx => {
				const itemToStore = inventory[idx];
				
				const storedItem = JSON.parse(JSON.stringify(itemToStore));
				storedItem.depositedAt = Date.now(); // Мета-информация (опционально)
				
				userClan.storage.push(storedItem);
				inventory.splice(idx, 1); // Удаляем из инвентаря игрока
			});

			showToast(`В хранилище добавлено ${selectedIndices.length} предметов`);
			saveGameState();
			updateInventory(); // Обновляем визуал инвентаря
			
			document.querySelectorAll('.modal').forEach(m => m.remove());
			openClanMenu(); // Возвращаемся в меню клана
		});

		modal.querySelector('#cancel-storage-dep').addEventListener('click', () => modal.remove());
		modal.addEventListener('click', (e) => { if(e.target === modal) modal.remove(); });
	}

	function openClanStorageWithdrawModal() {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.cssText = `display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); z-index: 1001; justify-content: center; align-items: center;`;

		if (!userClan.storage || userClan.storage.length === 0) {
			modal.innerHTML = `<div class="modal-content" style="background:#222; padding:20px; border-radius:8px; text-align:center;">
				<h3>Хранилище пусто</h3>
				<button onclick="this.closest('.modal').remove()" style="padding:8px 15px; background:#555; color:white; border:none; border-radius:4px; margin-top:10px; cursor:pointer;">Закрыть</button>
			</div>`;
			document.body.appendChild(modal);
			return;
		}

		let itemsHtml = '';
		userClan.storage.forEach((item, index) => {
			const rarityInfo = rarities[item.rarity] || { color: 'common', name: 'Обычный' };
			const hasStickers = item.stickers && item.stickers.length > 0;
			const hasCharm = !!item.charm;
			const isRental = item.isRental;

			itemsHtml += `
			<div class="clan-storage-withdraw-item" data-storage-index="${index}" style="background-color: #2a2a2a; padding: 12px; border-radius: 8px; text-align: center; cursor: pointer; border: 2px solid transparent; transition: 0.2s;">
				<div style="position: relative; margin-bottom: 8px;">
					<img src="${item.image}" alt="${item.name}" width="80" style="border-radius: 4px;">
					${isRental ? '<div style="position:absolute;top:2px;right:2px;background:#ffa500;color:#000;font-size:10px;padding:2px 4px;border-radius:3px;">RENT</div>' : ''}
				</div>
				<div style="font-weight:bold;font-size:13px;margin:5px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</div>
				<div class="inventory-item-rarity ${rarityInfo.color}" style="font-size:11px;padding:2px 6px;border-radius:3px;display:inline-block;">${rarityInfo.name}</div>
				
				<div style="margin-top:8px;font-size:11px;color:#aaa;display:flex;justify-content:center;gap:8px;">
					${hasStickers ? `<span>🏷️ ${item.stickers.length}</span>` : ''}
					${hasCharm ? `<span>🔑 Есть</span>` : ''}
				</div>

				${!isRental && (hasStickers || hasCharm) ? `
				<div style="margin-top:5px;display:flex;justify-content:center;gap:2px;flex-wrap:wrap;">
					${item.stickers ? item.stickers.slice(0, 3).map(s => `<img src="${s.image}" width="18" style="border:1px solid #444;border-radius:2px;">`).join('') : ''}
					${hasCharm ? `<img src="${item.charm.image}" width="18" style="border:1px solid #444;border-radius:2px;">` : ''}
				</div>` : ''}
			</div>`;
		});

		modal.innerHTML = `
		<div class="modal-content" style="background-color: rgb(30 30 30 / 85%); padding: 20px; border-radius: 8px; width: 90%; max-width: 900px; max-height: 85vh; display: flex; flex-direction: column;">
			<h2 style="text-align: center; margin-bottom: 15px;">Снять из хранилища</h2>
			<input type="text" id="storage-search-withdraw" placeholder="Поиск предмета..." style="padding:8px; border-radius:4px; border:1px solid #555; background:#222; color:white; margin-bottom:10px; width:100%; box-sizing:border-box;">
			
			<div style="text-align: center; margin-bottom: 10px;">
				<button id="select-all-storage-with" style="padding: 6px 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Все</button>
				<button id="deselect-all-storage-with" style="padding: 6px 12px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Снять</button>
			</div>

			<div id="storage-withdraw-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; overflow-y: auto; padding: 5px; flex: 1;">
				${itemsHtml}
			</div>

			<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #444; text-align: center;">
				<div style="margin-bottom: 10px;">Выбрано: <span id="storage-with-count" style="color: gold; font-weight: bold;">0</span></div>
				<button id="confirm-storage-with" style="padding: 10px 25px; background: #9C27B0; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Забрать в инвентарь</button>
				<button id="cancel-storage-with" style="padding: 10px 25px; background: #555; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Отмена</button>
			</div>
		</div>`;

		document.body.appendChild(modal);

		let selectedIndices = [];
		const grid = modal.querySelector('#storage-withdraw-grid');
		const countSpan = modal.querySelector('#storage-with-count');
		const searchInput = modal.querySelector('#storage-search-withdraw');

		searchInput.addEventListener('input', (e) => {
			const term = e.target.value.toLowerCase();
			grid.querySelectorAll('.clan-storage-withdraw-item').forEach(el => {
				const name = el.innerText.toLowerCase();
				el.style.display = name.includes(term) ? '' : 'none';
			});
		});

		grid.querySelectorAll('.clan-storage-withdraw-item').forEach(el => {
			el.addEventListener('click', function() {
				const idx = parseInt(this.dataset.storageIndex);
				if (this.classList.contains('selected')) {
					this.classList.remove('selected');
					this.style.borderColor = 'transparent';
					selectedIndices = selectedIndices.filter(i => i !== idx);
				} else {
					this.classList.add('selected');
					this.style.borderColor = 'gold';
					if (!selectedIndices.includes(idx)) selectedIndices.push(idx);
				}
				countSpan.textContent = selectedIndices.length;
			});
		});

		modal.querySelector('#select-all-storage-with').addEventListener('click', () => {
			grid.querySelectorAll('.clan-storage-withdraw-item').forEach(el => {
				if (el.style.display !== 'none' && !el.classList.contains('selected')) {
					el.classList.add('selected');
					el.style.borderColor = 'gold';
					const idx = parseInt(el.dataset.storageIndex);
					if (!selectedIndices.includes(idx)) selectedIndices.push(idx);
				}
			});
			countSpan.textContent = selectedIndices.length;
		});

		modal.querySelector('#deselect-all-storage-with').addEventListener('click', () => {
			grid.querySelectorAll('.clan-storage-withdraw-item').forEach(el => {
				el.classList.remove('selected');
				el.style.borderColor = 'transparent';
			});
			selectedIndices = [];
			countSpan.textContent = '0';
		});

		modal.querySelector('#confirm-storage-with').addEventListener('click', () => {
			if (selectedIndices.length === 0) {
				showToast('Выберите предметы', true);
				return;
			}

			selectedIndices.sort((a, b) => b - a);

			selectedIndices.forEach(idx => {
				const itemToRestore = userClan.storage[idx];
				
				inventory.push(JSON.parse(JSON.stringify(itemToRestore)));
				
				userClan.storage.splice(idx, 1);
			});

			showToast(`В инвентарь возвращено ${selectedIndices.length} предметов`);
			saveGameState();
			updateInventory();
			
			document.querySelectorAll('.modal').forEach(m => m.remove());
			openClanMenu();
		});

		modal.querySelector('#cancel-storage-with').addEventListener('click', () => modal.remove());
		modal.addEventListener('click', (e) => { if(e.target === modal) modal.remove(); });
	}
	
	function openClanMenu() {
		closeAllModals();
		if (!userClan.storage) {
			userClan.storage = []; // Массив для хранения полных объектов предметов
		}
		
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.display = 'flex';
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100%';
		modal.style.height = '100%';
		modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
		modal.style.zIndex = '1000';
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';

		const hasClan = userClan.name !== "";
		
		const getRangProgressText = (rangId, stars) => {
			const rangData = rangsDatabase[rangId];
			if (!rangData) return `${stars} ММР`;
			
			if (rangData.stars_for_up === 0) {
				if (stars > 999 && stars <= 999000) {
					return `${Math.round(stars/1000)}K ММР`;
				}
				if (stars > 999000 && stars <= 999000000) {
					return `${Math.round(stars/1000000)}M ММР`;
				}
				if (stars > 999000000 && stars <= 999000000000) {
					return `${Math.round(stars/1000000000)}B ММР`;
				}
				if (stars > 999000000000) {
					return `infinity`;
				}
				else {
					return `${stars} ММР`;
				}
			}
			else {
				if (stars > 999 && stars <= 9999) {
					return `${stars} / ${rangData.stars_for_up} ММР`;
				}
				if (stars > 9999 && stars <= 999000) {
					return `${Math.round(stars/1000)}K / ${rangData.stars_for_up} ММР`;
				}
				if (stars > 999000 && stars <= 999000000) {
					return `${Math.round(stars/1000000)}M / ${rangData.stars_for_up} ММР`;
				}
				if (stars > 999000000 && stars <= 999000000000) {
					return `${Math.round(stars/1000000000)}B / ${rangData.stars_for_up} ММР`;
				}
				if (stars > 999000000000) {
					return `infinity / ${rangData.stars_for_up}`;
				}
				else {
					return `${stars} / ${rangData.stars_for_up} ММР`;
				}
			}
		};
		
		modal.innerHTML = `
			<div class="modal-content" style="background-color: rgb(30 30 30 / 85%); padding: 20px; border-radius: 8px; width: 80%; max-width: 600px; max-height: 80vh; overflow: auto;">
				<h2 style="text-align: center;  margin-top: -3px;">${hasClan ? userClan.name : 'Клан'}</h2>
				
				${hasClan ? `
					<div style="text-align: center; margin-bottom: -5px;">
						<button id="leave-clan-btn" style="padding: 8px 10px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; width: 25%; margin-top: 0px;">Покинуть клан</button>
					</div>
					<button id="close-clan-btn" style="transform: translate(520px, -70px); padding: 1px 8px; background: linear-gradient(19deg, #830e0e, #d32f2f); 
					color: #ffffff; border: none; border-radius: 4px; cursor: pointer; text-align: center; font-size: 18px; ">x</button>
					<div style="text-align: center; margin-bottom: 10px;">
						<img src="${rangsDatabase[userClan.rank].rang_img}" width="100">
						<div style="font-weight: bold; margin: 10px 0;">${rangsDatabase[userClan.rank].name}</div>
						<div>Прогресс: ${getRangProgressText(userClan.rank, userClan.stars)}</div>
						<div class="clan-balance-display">Баланс клана: ${userClan.balance.toLocaleString('ru-RU')} ₽</div>
					</div>
					<div style="padding: 5px; border-top: 1px solid #444; margin-top: 10px;">
						<p style="margin-bottom: 10px; text-align: center;">📦 Хранилище предметов</p>
						<button id="deposit-to-clan-storage-btn" style="padding: 8px 15px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; width: 45%; margin: 2px;">
							Положить в хранилище
						</button>
						<button id="withdraw-from-clan-storage-btn" style="padding: 8px 15px; background-color: #9C27B0; color: white; border: none; border-radius: 4px; cursor: pointer; width: 45%; margin: 2px;">
							Снять из хранилища
						</button>
						<div style="text-align: center; margin-top: 8px; font-size: 13px; color: #aaa;">
							В хранилище: <span id="clan-storage-count">${userClan.storage?.length || 0}</span> предметов
						</div>
					</div>
					
					<div style="margin-bottom: 10px; text-align: center;">
						<p>Изменить название клана</p>
						<input type="text" id="clan-name-input" value="${userClan.name}" style="width: 85%; padding: 10px; margin-bottom: 15px; background-color: #2a2a2a; border: none; border-radius: 4px; color: white;">
						<button id="change-clan-name-btn" style="padding: 8px 10px; background-color: #555555; color: white; border: none; border-radius: 4px; cursor: pointer; width: 25%;">Изменить название</button>
					</div>
					<div style="margin-bottom: 10px; text-align: center;">
						<p>Пополнить баланс клана</p>
						<input type="number" id="clan-deposit-amount" placeholder="Сумма" style="width: 85%; padding: 10px; margin-bottom: 15px; background-color: #2a2a2a; border: none; border-radius: 4px; color: white;">
						<button id="deposit-to-clan-btn" style="padding: 8px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; width: 25%;">Пополнить деньгами</button>
						<button id="undeposit-to-clan-btn" style="padding: 8px 35px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; width: 25%;">Снять деньгами</button>
						<div style="padding: 10px;"></div>
						<button id="deposit-all-to-clan-btn" style="padding: 8px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; width: 25%;">Положить весь баланс</button>
						<button id="give-all-clan-cash-btn" style="padding: 8px 25px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; width: 25%;">Снять все деньги</button>
						<div></div>
						<button id="deposit-items-to-clan-btn" style="padding: 8px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; width: 25%; margin-top: 10px;">Пополнить предметами</button>
						<button id="withdraw-items-from-clan-btn" style="padding: 8px 35px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; width: 25%;">Снять предметы</button>
					</div>
					<div style="text-align: center; margin-top: 20px;">
				</div>
				` : `
					<div style="text-align: center; margin-bottom: 20px;">
						<p>У вас нет клана. Создайте его за 1000 ₽</p>
						<input type="text" id="clan-name-input" placeholder="Название клана" style="width: 85%; padding: 10px; margin-bottom: 15px; background-color: #2a2a2a; border: none; border-radius: 4px; color: white;">
						<button id="create-clan-btn" style="padding: 8px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; width: 30%;">Создать клан (1000 ₽)</button>
					</div>
					<div style="text-align: center; margin-top: 20px;">
						<button id="close-clan-btn" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Закрыть</button>
					</div>
				`}
			</div>
		`;

		document.body.appendChild(modal);

		if (hasClan) {
			document.getElementById('change-clan-name-btn').addEventListener('click', function() {
				const newName = document.getElementById('clan-name-input').value.trim();
				if (newName && newName !== userClan.name) {
					userClan.name = newName;
					showToast(`Название клана изменено на "${newName}"`);
					saveGameState();
					modal.remove();
					openClanMenu();
				}
			});
			
			document.getElementById('deposit-to-clan-storage-btn')?.addEventListener('click', openClanStorageDepositModal);
			document.getElementById('withdraw-from-clan-storage-btn')?.addEventListener('click', openClanStorageWithdrawModal);
			
			document.getElementById('deposit-all-to-clan-btn').addEventListener('click', function() {	
				if (balance > 0) {
					const amount = Math.round(balance * 100) / 100;
					userClan.balance += Math.round(amount * 100) / 100;
					addExp(Math.round(balance));
					balance = Math.round(0 * 100) / 100;
					const mmrToAdd = Math.round(amount * 0.1 * 100) / 100;
					if (mmrToAdd > 0) {
						updateClanRank(mmrToAdd);
					}
					if (amount >= 0) {
						updateDuelRang(Math.round(amount));
					}
					balanceAmount.textContent = balance.toLocaleString('ru-RU');
					UpdateStatrackFrame(balance);
					showToast(`Вся валюта отправлена в клан!`);
				} else {
					showToast(`Операция не удалась`);
				}
				saveGameState();
				
				modal.remove();
				openClanMenu();
			});
			
			document.getElementById('give-all-clan-cash-btn').addEventListener('click', function() {	
				if (userClan.balance > 0) {
					const amount = Math.round(userClan.balance * 100) / 100;
					balance += Math.round(amount * 100) / 100;
					addExp(Math.round(userClan.balance));
					userClan.balance = Math.round(0 * 100) / 100;
					balanceAmount.textContent = balance.toLocaleString('ru-RU');
					if (amount >= 0) {
						updateMMRang(Math.round(amount));
					}
					UpdateStatrackFrame(balance);
					showToast(`С клана списана вся валюта!`);
				} else {
					showToast(`Операция не удалась`);
				}
				saveGameState();
				
				modal.remove();
				openClanMenu();
			});
			
			document.getElementById('undeposit-to-clan-btn').addEventListener('click', function() {
				const amount = parseFloat(document.getElementById('clan-deposit-amount').value);
				if (isNaN(amount)) {
					showToast('Введите корректную сумму', true);
					return;
				}
				
				if (amount < 0) {
					showToast('Используйте кнопку "Пополнить деньгами" для пополнения денег!', true);
					return;
				}
				
				if (userClan.balance < amount) {
					showToast('Недостаточно средств', true);
					return;
				}
				
				balance += Math.round(amount * 100) / 100;
				userClan.balance -= Math.round(amount * 100) / 100;
				userClan.balance = Math.round(userClan.balance * 100) / 100;
				balance = Math.round(balance * 100) / 100;
				if (amount >= 0) {
					addExp(Math.round(amount));
				} else {
					addExp(Math.round(-amount));
				}
				
				balanceAmount.textContent = balance.toLocaleString('ru-RU');
				UpdateStatrackFrame(balance);
				if (amount < 0) {
					updateDuelRang(Math.round(amount));
				}
				else {
					updateMMRang(Math.round(-amount));
				}
			
				showToast(`${amount.toLocaleString('ru-RU')} ₽ снято с клана`);
				saveGameState();
				
				modal.remove();
				openClanMenu();
			});
			
			document.getElementById('deposit-to-clan-btn').addEventListener('click', function() {
				const amount = parseFloat(document.getElementById('clan-deposit-amount').value);
				if (isNaN(amount)) {
					showToast('Введите корректную сумму', true);
					return;
				}
				
				if (balance < amount) {
					showToast('Недостаточно средств', true);
					return;
				}
				
				if (amount < 0) {
					showToast('Используйте кнопку "Снять деньгами" для снятия денег!', true);
					return;
				}
				
				balance -= Math.round(amount * 100) / 100;
				userClan.balance += Math.round(amount * 100) / 100;
				userClan.balance = Math.round(userClan.balance * 100) / 100;
				balance = Math.round(balance * 100) / 100;
				if (amount >= 0) {
					addExp(Math.round(amount));
				} else {
					addExp(Math.round(-amount));
				}
				
				const mmrToAdd = Math.round(amount * 0.1 * 100) / 100;
				if (mmrToAdd > 0) {
					updateClanRank(mmrToAdd);
				}
				
				balanceAmount.textContent = balance.toLocaleString('ru-RU');
				UpdateStatrackFrame(balance);
				if (amount >= 0) {
					updateDuelRang(Math.round(amount));
				}
				else {
					updateMMRang(Math.round(-amount));
				}
			
				showToast(`${amount.toLocaleString('ru-RU')} ₽ переведено в клан (+${mmrToAdd} ММР)`);
				saveGameState();
				
				modal.remove();
				openClanMenu();
			});
			
			document.getElementById('deposit-items-to-clan-btn').addEventListener('click', function() {
				openClanItemDepositModal();
			});

			 document.getElementById('withdraw-items-from-clan-btn').addEventListener('click', function() {
				openClanWithdrawModal();
			});
			
			document.getElementById('leave-clan-btn').addEventListener('click', function() {
				userClan = {
					name: "",
					rank: "colib_clan",
					stars: 0,
					members: [],
					balance: 0,
					storage: []
				};
				showToast('Вы покинули клан');
				saveGameState();
				modal.remove();
			});
		} else {
			document.getElementById('create-clan-btn').addEventListener('click', function() {
				let clanName = document.getElementById('clan-name-input').value.trim();
				if (!clanName) {
					clanName = "Клан";
				}
				
				if (balance < 1000) {
					showToast('Недостаточно средств (нужно 1000 ₽)', true);
					return;
				}
				
				balance -= 1000;
				userClan = {
					name: clanName,
					rank: "colib_clan",
					stars: 0,
					members: [],
					balance: 0,
					storage: []
				};
				
				balanceAmount.textContent = balance.toLocaleString('ru-RU');
				UpdateStatrackFrame(balance);
				updateDuelRang(1000);
				showToast(`Клан "${clanName}" создан!`);
				saveGameState();
				modal.remove();
				openClanMenu();
			});
		}
		
		const storageCountEl = modal.querySelector('#clan-storage-count');
		if (storageCountEl) {
			storageCountEl.textContent = userClan.storage?.length || 0;
		}
		
		document.getElementById('close-clan-btn').addEventListener('click', function() {
			modal.remove();
		});
	}

	function updateClanRank(starsToAdd) {
		let currentRank = userClan.rank;
		userClan.stars += starsToAdd * 0.01;
		userClan.stars = Math.round(userClan.stars * 10) / 10;
		if (userClan.stars > 100000) {
			userClan.stars = Math.round(userClan.stars / 1000) * 1000
		}
		
		while (true) {
			const nextRank = rangsDatabase[currentRank]?.next_rang;
			const hasNextRank = nextRank !== undefined && nextRank !== null && nextRank !== 'NaN';
			
			if (userClan.stars >= rangsDatabase[currentRank].stars_for_up && hasNextRank) {
				userClan.rank = nextRank;
				currentRank = nextRank;
				showToast(`Поздравляем! Клан поднял ранг до ${rangsDatabase[nextRank].name}`);
			} else {
				break;
			}
		}
		
		saveGameState();
	}
	
	function updateMMRang(price) {
		const starsToAdd = Math.round(price / 100);
		if (starsToAdd <= 0) return;

		let currentRang = userRangs.mm.current;
		userRangs.mm.stars += starsToAdd * 0.1;
		userRangs.mm.stars = Math.round(userRangs.mm.stars * 10) / 10;
		if (userRangs.mm.stars > 100000) {
			userRangs.mm.stars = Math.round(userRangs.mm.stars / 1000) * 1000
		}
		
		while (true) {
			const nextRang = rangsDatabase[currentRang]?.next_rang;
			const hasNextRang = nextRang !== undefined && nextRang !== null && nextRang !== 'NaN';
			
			if (userRangs.mm.stars >= rangsDatabase[currentRang].stars_for_up && hasNextRang) {
				const rewardRarity = rangsDatabase[currentRang]?.rewardRarity;
				if (rewardRarity) {
					const rewardItem = getRandomItemReward(rewardRarity, 'mm');
					if (rewardItem) {
						inventory.push(rewardItem);
						showToast(`Поздравляем! За повышение ранга получен: ${rewardItem.name}`);
						updateInventory();
					}
				}
				
				userRangs.mm.current = nextRang;
				currentRang = nextRang;
				showToast(`Поздравляем! Вы подняли ранг до ${rangsDatabase[nextRang].name}`);
			} else {
				break;
			}
		}

		saveGameState();
	}

	function updateSouzRang(rarity) {
		let count = 1;
		let rarityKey = 'none';

		if (Array.isArray(rarity) && rarity.length > 0) {
			rarityKey = String(rarity[0]).toLowerCase().trim(); // Приводим к строке, нижний регистр, убираем пробелы
			
			if (rarity.length > 1) {
				const parsedCount = parseFloat(rarity[1]);
				if (!isNaN(parsedCount) && parsedCount > 0) {
					count = Math.round(parsedCount);
				} else {
					count = 1;
				}
			}
		} else if (typeof rarity === 'string') {
			rarityKey = rarity.toLowerCase().trim();
		} else {
			rarityKey = 'none';
		}
		
		const rang_stars_rarity = {
			'common': 0.00,
			'uncommon': parseFloat((Math.random() * (5 - 0) + 0).toFixed(2)),
			'rare': parseFloat((Math.random() * (10 - 5) + 5).toFixed(2)),
			'epic': parseFloat((Math.random() * (15 - 10) + 10).toFixed(2)),
			'legendary': parseFloat((Math.random() * (20 - 15) + 15).toFixed(2)),
			'arcane': parseFloat((Math.random() * (25 - 20) + 20).toFixed(2)),
			'nameless': parseFloat((Math.random() * (50 - 25) + 25).toFixed(2)),
			'none': parseFloat((Math.random() * (100 - 50) + 50).toFixed(2))
		};

		let mmrGain = rang_stars_rarity[rarityKey];
		
		if (mmrGain === undefined || isNaN(mmrGain)) {
			mmrGain = 0;
		}

		if (!userRangs || !userRangs.souz) {
			return;
		}

		if (typeof userRangs.souz.stars !== 'number' || isNaN(userRangs.souz.stars)) {
			userRangs.souz.stars = 0;
		}

		let currentRang = userRangs.souz.current;
		
		const starsToAdd = mmrGain * count;
		userRangs.souz.stars += starsToAdd;
		
		userRangs.souz.stars = Math.round(userRangs.souz.stars * 10) / 10;

		if (userRangs.souz.stars > 100000) {
			userRangs.souz.stars = Math.round(userRangs.souz.stars / 1000) * 1000;
		}

		while (true) {
			if (!currentRang || !rangsDatabase[currentRang]) {
				break;
			}

			const currentRankData = rangsDatabase[currentRang];
			const nextRang = currentRankData.next_rang;
			
			const hasNextRang = (nextRang !== undefined && nextRang !== null && nextRang !== 'NaN' && nextRang !== '');

			const requiredStars = currentRankData.stars_for_up;
			
			if (typeof requiredStars !== 'number' || isNaN(requiredStars)) {
				 break;
			}

			if (userRangs.souz.stars >= requiredStars && hasNextRang) {
				const rewardRarity = currentRankData.rewardRarity;
				if (rewardRarity) {
					if (typeof getRandomItemReward === 'function') {
						const rewardItem = getRandomItemReward(rewardRarity, 'souz');
						if (rewardItem) {
							inventory.push(rewardItem);
							if (typeof showToast === 'function') {
								showToast(`Поздравляем! За повышение ранга получен: ${rewardItem.name}`);
							}
							if (typeof updateInventory === 'function') {
								updateInventory();
							}
						}
					}
				}

				userRangs.souz.current = nextRang;
				currentRang = nextRang;
				
				if (typeof showToast === 'function') {
					if (rangsDatabase[nextRang] && rangsDatabase[nextRang].name) {
						showToast(`Поздравляем! Новый союзный ранг: ${rangsDatabase[nextRang].name}`);
					} else {
						showToast(`Поздравляем! Новый союзный ранг: ${nextRang}`);
					}
				}
			} else {
				break;
			}
		}

		if (typeof saveGameState === 'function') {
			saveGameState();
		} else {
			return;
		}
	}

	function updateDuelRang(price) {
		const starsToAdd = Math.round(price / 100);
		
		let currentRang = userRangs.duel.current;
		userRangs.duel.stars += starsToAdd * 0.1;
		userRangs.duel.stars = Math.round(userRangs.duel.stars * 10) / 10;
		if (userRangs.duel.stars >= 100000) {
			userRangs.duel.stars = Math.round(userRangs.duel.stars / 1000) * 1000
		}
		
		while (true) {
			const nextRang = rangsDatabase[currentRang]?.next_rang;
			const hasNextRang = nextRang !== undefined && nextRang !== null && nextRang !== 'NaN';

			if (userRangs.duel.stars >= rangsDatabase[currentRang].stars_for_up && hasNextRang) {
				const rewardRarity = rangsDatabase[currentRang]?.rewardRarity;
				if (rewardRarity) {
					const rewardItem = getRandomItemReward(rewardRarity, 'duel');
					if (rewardItem) {
						inventory.push(rewardItem);
						showToast(`Поздравляем! За повышение ранга получен: ${rewardItem.name}`);
						updateInventory();
					}
				}
				
				userRangs.duel.current = nextRang;
				currentRang = nextRang;
				showToast(`Поздравляем! Новый дуэльный ранг: ${rangsDatabase[nextRang].name}`);
			} else {
				break;
			}
		}

		saveGameState();
	}

	document.getElementById('manual-save-btn').addEventListener('click', function() {
		downloadGameState();
	});

	document.getElementById('load-file-btn').addEventListener('click', function() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.click();

		input.onchange = async function(event) {
			const file = event.target.files[0];
			if (!file) return;

			const reader = new FileReader();
			reader.readAsText(file);

			reader.onload = function(event) {
				loadGameState(event.target.result);
			};

			reader.onerror = function(err) {
				alert("Ошибка чтения файла.");
			};
		};
	});
	
	function calculateCurrentPrice(initialPrice, initialStock) {
		return initialPrice;
	}
	
	function calculateItemPriceInInventory(itemIndex) {
		const inventoryItem = inventory[itemIndex];
		if (!inventoryItem) return false;

		const originalItem = itemsDatabase.find(dbItem => dbItem.id === inventoryItem.id);
		if (!originalItem || originalItem.itemInStore === false) return false;

		if (originalItem.isCase) return false;

		let totalPrice = Math.round((originalItem.price) * 100) / 100;

		if (inventoryItem.stickers) {
			inventoryItem.stickers.forEach(sticker => {
				const stickerItem = itemsDatabase.find(dbItem => dbItem.id === sticker.id);
				if (stickerItem && stickerItem.itemInStore !== false) {
					totalPrice += Math.round((stickerItem.price * 0.4) * 100) / 100;
				}
			});
		}

		if (inventoryItem.charm) {
			const charmItem = itemsDatabase.find(dbItem => dbItem.id === inventoryItem.charm.id);
			if (charmItem && charmItem.itemInStore !== false) {
				totalPrice += Math.round((charmItem.price * 0.8) * 100) / 100;
			}
		}

		return totalPrice;
	}
	
	function updateItemPriceInUI(item) {
	  item = itemsDatabase.find(a => a.id === item.id);
	  const itemElement = document.getElementById(item.id);
	  const rentalItemId = item.id + '_rental';
	  const rentalItem = itemsDatabase.find(a => a.id === rentalItemId);
	  const rentalItemElement = document.getElementById(rentalItemId);
	  if (itemElement) {
		const priceElement = itemElement.querySelector('.item-price');
		if (priceElement) {
		  priceElement.textContent = `${item.price.toFixed(2)} ₽`;
		  item.price = Math.round(item.price * 100) / 100;
		  if (rentalItemElement) {
			rentalItem.price =  Math.round(item.price * 0.01 * 100) / 100;
		  } else if (rentalItem) {
			  rentalItem.price =  Math.round(item.price * 0.01 * 100) / 100;
		  }
		}
		
		const buttons = itemElement.querySelectorAll('.add-to-cart, .buy-all-btn');
		buttons.forEach(btn => {
		  btn.setAttribute('data-price',  Math.round(item.price * 100) / 100);
		});
	  } else {
		  item.price = Math.round(item.price * 100) / 100;
		  if (rentalItemElement) {
			  rentalItem.price =  Math.round(item.price * 0.01 * 100) / 100;
			  const rentalPriceElement = rentalItemElement.querySelector('.item-price');
			  if (rentalPriceElement) {
				  const rentalPrice = Math.round(rentalItem.price * 100) / 100; // 3% от оригинальной цены для аренды
				  rentalPriceElement.textContent = `${rentalPrice.toFixed(2)} ₽`;
			  }
			  const rentalButtons = rentalItemElement.querySelectorAll('.add-to-cart');
			  rentalButtons.forEach(btn => {
				  btn.setAttribute('data-price',  Math.round(rentalItem.price * 100) / 100); // Сохраняем цену аренды
			  });  
		  } else if (rentalItem) {
			  rentalItem.price =  Math.round(item.price * 0.01 * 100) / 100;
		  }
	  }
	  const isEligible = !item.isCase && !item.name.endsWith('Fragment') &&  !item.name.startsWith('Medal') && !item.priceMultiply == 0;
	  if (isEligible) {
		  if (item.price >= 100000) {
			  item.priceMultiply = Math.round(item.price / 5000) * 100;
		  }else if (item.price >= 10000) {
			  item.priceMultiply = Math.round(item.price / 400) * 10;
		  } else if (item.price >= 1000) {
			  item.priceMultiply = Math.round(item.price / 30);
		  } else if (item.price >= 100) {
			  item.priceMultiply = Math.round(item.price * 10 / 20) / 10;
		  } else if (item.price >= 0.05) {
			item.priceMultiply = Math.round(item.price * 100 / 10) / 100;
		  }
	  }
	}
	
	function restoreItemPrice(itemId, quantity = 1) {
		const shopItem = itemsDatabase.find(item => item.id === itemId);
		if (shopItem && shopItem.priceMultiply > 0) {
			shopItem.price = Math.max(
				shopItem.initialPrice,
				shopItem.price - (shopItem.priceMultiply * quantity)
			);
			updateItemPriceInUI(shopItem);
		}
	}
	
	function selectStickerWithWeight(stickers) {
		if (!stickers || stickers.length === 0) return null;
		
		const weights = stickers.map(sticker => 1 / (sticker.price + 1)); // +1 чтобы избежать деления на 0
		
		const sum = weights.reduce((a, b) => a + b, 0);
		const normalizedWeights = weights.map(w => w / sum);
		
		let random = Math.random();
		let weightSum = 0;
		
		for (let i = 0; i < stickers.length; i++) {
			weightSum += normalizedWeights[i];
			if (random <= weightSum) {
				return stickers[i];
			}
		}
		
		return stickers[stickers.length - 1];
	}
	
	function exportItemsDatabase() {
	  const filteredItems = itemsDatabase.filter(item => {
		return !item.id.endsWith('_rental') && !item.isRental;
	  });
	  
	  const rarityOrder = {
		'gold-none': 0,
		'none': 1,
		'nameless': 2,
		'arcane': 3,
		'legendary': 4,
		'epic': 5,
		'rare': 6,
		'uncommon': 7,
		'common': 8,
		'case-none': 9,
		'box-none': 10
	  };
	  
	  const sortedItems = filteredItems.sort((a, b) => {
		const rarityA = a.rarity.toLowerCase();
		const rarityB = b.rarity.toLowerCase();
		
		const orderA = rarityOrder[rarityA] !== undefined ? rarityOrder[rarityA] : 10;
		const orderB = rarityOrder[rarityB] !== undefined ? rarityOrder[rarityB] : 10;
		
		return orderA - orderB;
	  });
	  
	  let htmlContent = `
	<!DOCTYPE html>
	<html lang="ru">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>База данных предметов</title>
		<style>
			body {
				font-family: Arial, sans-serif;
				margin: 20px;
				background-color: #f5f5f5;
			}
			h1 {
				color: #333;
				text-align: center;
				margin-bottom: 20px;
			}
			table {
				width: 100%;
				border-collapse: collapse;
				background-color: white;
				box-shadow: 0 2px 5px rgba(0,0,0,0.1);
			}
			th, td {
				padding: 12px;
				text-align: left;
				border-bottom: 1px solid #ddd;
			}
			th {
				background-color: #4CAF50;
				color: white;
				font-weight: bold;
			}
			tr:hover {
				background-color: #f5f5f5;
			}
			.rarity-common { color: #a5a5a5; }
			.rarity-uncommon { color: #0eb2d3; }
			.rarity-rare { color: #5555ff; }
			.rarity-epic { color: #aa55ff; }
			.rarity-legendary { color: #ff66ff; }
			.rarity-arcane { color: #ff3333; }
			.rarity-nameless { color: #ffd700; }
			.rarity-none { color: lightgrey; }
			.rarity-gold-none { color: #ffde00; }
			.rarity-case-none { color: black; }
			.rairty-box-none { color: black; }
		</style>
	</head>
	<body>
		<h1>База данных предметов</h1>
		<table>
			<thead>
				<tr>
					<th>ID</th>
					<th>Название</th>
					<th>Коллекция</th>
					<th>Редкость</th>
					<th>Цена</th>
					<th>Кейс</th>
					<th>Чарм</th>
					<th>Стикер</th>
					<th>Без слота</th>
					<th>Доступен на рынке</th>
				</tr>
			</thead>
			<tbody>
	`;

	   sortedItems.forEach(item => {
		 const rarityClass = `rarity-${item.rarity.toLowerCase()}`;
		 
		 htmlContent += `
				<tr>
					<td>${item.id}</td>
					<td>${item.name}</td>
					<td>${item.collection || 'Нет'}</td>
					<td class="${rarityClass}">${item.rarity}</td>
					<td>${item.price}</td>
					<td>${item.isCase ? 'Да' : 'Нет'}</td>
					<td>${item.isCharm ? 'Да' : 'Нет'}</td>
					<td>${item.isSticker ? 'Да' : 'Нет'}</td>
					<td>${item.isItemWithoutSlot ? 'Да' : 'Нет'}</td>
					<td>${item.itemInStore ? 'Да' : 'Нет'}</td>
				</tr>
	 `;
	   });

	   htmlContent += `
			</tbody>
		</table>
	</body>
	</html>
	`;

	  const newWindow = window.open('', '_blank');
	  newWindow.document.write(htmlContent);
	  newWindow.document.close();
	  
	  showToast('База данных предметов успешно открыта в новой вкладке!');
	}
	
	document.getElementById('export-database-btn')?.addEventListener('click', function() {
	  exportItemsDatabase();
	});
	
//	const cart = [];
//	const checkoutBtn = document.getElementById('checkout-btn');
//	const clearCartBtn = document.getElementById('clear-cart-btn');
//	const cartItemsElement = document.getElementById('cart-items');
//	const cartTotalElement = document.getElementById('cart-total');
	const itemsContainer = document.getElementById('items-container');
	const inventoryBtn = document.getElementById('inventory-btn');
	const inventoryContainer = document.getElementById('inventory-container');
	const overlay = document.getElementById('overlay');
	const closeInventory = document.getElementById('close-inventory');
	const inventoryItemsElement = document.getElementById('inventory-items');
	const craftBtn = document.getElementById('craft-btn');
	const selectedCountElement = document.getElementById('selected-count');
	let filterButtons = document.querySelectorAll('.filter-btn');
	let isCaseOpening = false; // Флаг, указывающий, что кейс открывается
	// Система платформы (вместо корзины)
	const marketListings = []; // Лоты на рынке
	const myRequests = []; // Мои запросы на продажу/покупку
	const bots = []; // Боты для симуляции рынка
	
	let sortDescending = true; // Флаг сортировки по убыванию цены
	const sortPriceBtn = document.getElementById('sort-price-btn');
	
	const sortQuantityBtn = document.getElementById('sort-quantity-btn');
	let sortQtyDescending = true; // Начальная сортировка по убыванию
	
	sortQuantityBtn.addEventListener('click', function() {
		sortQtyDescending = !sortQtyDescending;
		this.textContent = sortQtyDescending ? 'Сортировать по количеству ↓' : 'Сортировать по количеству ↑';
		this.classList.toggle('active');
		sortItemsByQuantity();
	});
	
	const sellAllBtn = document.getElementById('sell-all-btn');
	
	let selectedItems = [];
	
	const rarities = {
		'box-none': {name: 'none', color: 'box-none', order: 0, next: null, ColorHex: '#adadad', craftsFrom: null},
		'case-none': {name: 'none', color: 'case-none', order: 1, next: null, ColorHex: '#ffc500', craftsFrom: null},
		'common': { name: 'Common', color: 'common', order: 2, next: 'uncommon', colorHex: '#a5a5a5', craftsFrom: null},
		'uncommon': { name: 'Uncommon', color: 'uncommon', order: 3, next: 'rare', colorHex: '#0eb2d3', craftsFrom: 'common'},
		'rare': { name: 'Rare', color: 'rare', order: 4, next: 'epic', colorHex: '#5555ff', craftsFrom: 'uncommon'},
		'epic': { name: 'Epic', color: 'epic', order: 5, next: 'legendary', colorHex: '#aa55ff', craftsFrom: 'rare'},
		'legendary': { name: 'Legendary', color: 'legendary', order: 6, next: 'arcane', colorHex: '#ff66ff', craftsFrom: 'epic'},
		'arcane': { name: 'Arcane', color: 'arcane', order: 7, next: null, colorHex: '#ff3333', craftsFrom: 'legendary'},
		'nameless': { name: 'Nameless', color: 'nameless', order: 8, next: null, colorHex: '#ffd700', craftsFrom: null},
		'none': {name: 'none', color: 'none', order: 10, next: null, ColorHex: 'lightgrey', craftsFrom: null},
		'gold-none': {name: 'none', color: 'gold-none', order: 11, next: null, ColorHex: '#ffde00', craftsFrom: null}
	};

	const editItemBtn = document.getElementById('edit-item-btn');
	const editItemModal = document.getElementById('edit-item-modal');
	const cancelEditItem = document.getElementById('cancel-edit-item');
	const confirmEditItem = document.getElementById('confirm-edit-item');
	const editItemRarity = document.getElementById('edit-item-rarity');
	const editItemSelect = document.getElementById('edit-item-select');
	const editItemIsCase = document.getElementById('edit-item-is-case');
	const editCaseFields = document.getElementById('edit-case-fields');
	let editItemTopRarity = '';

	editItemBtn.addEventListener('click', function() {
		editItemRarity.innerHTML = '<option value="">Выберите редкость</option>';
		Object.keys(rarities).forEach(rarity => {
			editItemRarity.innerHTML += `<option value="${rarity}">${rarities[rarity].name}</option>`;
		});
		
		editItemModal.style.display = 'flex';
		editItemSelect.disabled = true;
		editItemSelect.innerHTML = '<option value="">Сначала выберите редкость</option>';
		editCaseFields.style.display = 'none';
	});

	cancelEditItem.addEventListener('click', function() {
		editItemModal.style.display = 'none';
	});

	editItemRarity.addEventListener('change', function() {
		const rarity = this.value;
		editItemTopRarity = rarity;
		editItemSelect.innerHTML = '<option value="">Выберите предмет</option>';
		
		if (rarity) {
			const itemsOfRarity = itemsDatabase.filter(item => item.rarity === rarity);
			itemsOfRarity.forEach(item => {
				editItemSelect.innerHTML += `<option value="${item.id}">${item.name}</option>`;
			});
			editItemSelect.disabled = false;
		} else {
			editItemSelect.disabled = true;
		}
	});

	editItemSelect.addEventListener('change', function() {
		const itemId = this.value;
		if (!itemId) return;
		
		const item = itemsDatabase.find(item => item.id === itemId);
		if (!item) return;
		
		document.getElementById('edit-item-name').value = item.name;
		updateCollectionSelect('edit-item-collection', item.collection);
		document.getElementById('edit-item-stock').value = item.stock;
		document.getElementById('edit-item-price').value = item.price.toFixed(2);
		document.getElementById('edit-item-price-multiply').value = item.priceMultiply || 0;
		document.getElementById('edit-item-image').value = item.image;
		
		document.getElementById('edit-item-is-charm').checked = item.isCharm || false;
		document.getElementById('edit-item-is-sticker').checked = item.isSticker || false;
		document.getElementById('edit-item-is-without-slot').checked = item.isItemWithoutSlot || false;
		
		const isCase = item.isCase || false;
		editItemIsCase.checked = isCase;
		editCaseFields.style.display = isCase ? 'block' : 'none';
		
		if (isCase) {
			document.getElementById('edit-item-contains').value = item.contains.join(', ');
			
			const container = document.getElementById('edit-rarity-chances-container');
			container.innerHTML = '';
			
			Object.keys(rarities).forEach(rarity => {
				if (true) {
					const div = document.createElement('div');
					div.style.marginBottom = '10px';
					div.style.display = 'flex';
					div.style.alignItems = 'center';
					div.style.gap = '10px';
					
					const checkbox = document.createElement('input');
					checkbox.type = 'checkbox';
					checkbox.id = `edit-chance-${rarity}-checkbox`;
					checkbox.dataset.rarity = rarity;
					checkbox.checked = !!item.dropChances[rarity];
					
					const label = document.createElement('label');
					label.htmlFor = `edit-chance-${rarity}-checkbox`;
					if (rarity !== 'case-none' && rarity !== 'box-none') {
						label.textContent = `${rarities[rarity].name}`;
					} else {
						label.textContent = `${rarity}`;
					}
					label.style.color = getRarityColor(rarity);
					
					const input = document.createElement('input');
					input.type = 'number';
					input.id = `edit-chance-${rarity}`;
					input.min = '0';
					input.max = '100';
					input.value = item.dropChances[rarity] || '0';
					input.style.width = '60px';
					input.style.padding = '5px';
					input.disabled = !checkbox.checked;
					
					const percent = document.createElement('span');
					percent.textContent = '%';
					
					checkbox.addEventListener('change', function() {
						input.disabled = !this.checked;
						if (!this.checked) input.value = '0';
					});
					
					div.appendChild(checkbox);
					div.appendChild(label);
					div.appendChild(input);
					div.appendChild(percent);
					
					container.appendChild(div);
				}
			});
		}
	});

	editItemIsCase.addEventListener('change', function() {
		editCaseFields.style.display = this.checked ? 'block' : 'none';
		
		if (this.checked) {
			if (!document.getElementById('edit-item-contains').value) {
				const itemId = editItemSelect.value;
				const item = itemsDatabase.find(item => item.id === itemId);
				
				if (item && item.contains) {
					document.getElementById('edit-item-contains').value = item.contains.join(', ');
				} else {
					document.getElementById('edit-item-contains').value = '';
				}
			}
			
			const container = document.getElementById('edit-rarity-chances-container');
			if (container.children.length === 0) {
				container.innerHTML = '';
				
				Object.keys(rarities).forEach(rarity => {
					if (true) {
						const div = document.createElement('div');
						div.style.marginBottom = '10px';
						div.style.display = 'flex';
						div.style.alignItems = 'center';
						div.style.gap = '10px';
						
						const checkbox = document.createElement('input');
						checkbox.type = 'checkbox';
						checkbox.id = `edit-chance-${rarity}-checkbox`;
						checkbox.dataset.rarity = rarity;
						
						const label = document.createElement('label');
						label.htmlFor = `edit-chance-${rarity}-checkbox`;
						if (rarity !== 'case-none' && rarity !== 'box-none') {
							label.textContent = `${rarities[rarity].name}`;
						} else {
							label.textContent = `${rarity}`;
						}
						label.style.color = getRarityColor(rarity);
						
						const input = document.createElement('input');
						input.type = 'number';
						input.id = `edit-chance-${rarity}`;
						input.min = '0';
						input.max = '100';
						input.value = '0';
						input.style.width = '60px';
						input.style.padding = '5px';
						input.disabled = true;
						
						const percent = document.createElement('span');
						percent.textContent = '%';
						
						checkbox.addEventListener('change', function() {
							input.disabled = !this.checked;
							if (!this.checked) input.value = '0';
						});
						
						div.appendChild(checkbox);
						div.appendChild(label);
						div.appendChild(input);
						div.appendChild(percent);
						
						container.appendChild(div);
					}
				});
			}
		}
	});

	confirmEditItem.addEventListener('click', function() {
		const itemId = editItemSelect.value;
		const name = document.getElementById('edit-item-name').value.trim();
		const collection = document.getElementById('edit-item-collection').value.trim();
		const stock = parseInt(document.getElementById('edit-item-stock').value);
		const price = parseFloat(document.getElementById('edit-item-price').value);
		const priceMultiply = parseFloat(document.getElementById('edit-item-price-multiply').value) || 0;
		const image = document.getElementById('edit-item-image').value.trim();
		const isCase = editItemIsCase.checked;
		const isCharm = document.getElementById('edit-item-is-charm').checked;
		const isSticker = document.getElementById('edit-item-is-sticker').checked;
		const isItemWithoutSlot = document.getElementById('edit-item-is-without-slot').checked;
		const isItemLimited = document.getElementById('edit-item-is-limited').checked;
		
		if (isCharm && isSticker) {
			showToast('Предмет не может быть одновременно брелком и стикером!', true);
			return;
		}
		
		if (!itemId || !name || !collection || isNaN(stock) || isNaN(price) || !image) {
			showToast('Заполните все обязательные поля!', true);
			return;
		}
		
		let contains = [];
		let dropChances = {};
		
		if (isCase) {
			contains = document.getElementById('edit-item-contains').value
				.split(',')
				.map(item => item.trim())
				.filter(item => item);
			
			Object.keys(rarities).forEach(rarity => {
				if (true) {
					const checkbox = document.getElementById(`edit-chance-${rarity}-checkbox`);
					if (checkbox && checkbox.checked) {
						const chance = parseInt(document.getElementById(`edit-chance-${rarity}`).value) || 0;
						if (chance > 0) {
							dropChances[rarity] = chance;
						}
					}
				}
			});
			
			const totalChance = Object.values(dropChances).reduce((sum, chance) => sum + chance, 0);
			if (totalChance !== 100) {
				showToast('Сумма шансов должна быть равна 100%!', true);
				return;
			}
			
			if (Object.keys(dropChances).length === 0) {
				showToast('Выберите хотя бы одну редкость для кейса!', true);
				return;
			}
		}
		
		const itemIndex = itemsDatabase.findIndex(item => item.id === itemId);
		if (itemIndex === -1) {
			showToast('Предмет не найден!', true);
			return;
		}
		
		const updatedItem = {
			...itemsDatabase[itemIndex],
			name,
			collection,
			stock,
			price,
			image,
			isCase: isCase || false,
			isCharm,
			isSticker,
			isItemWithoutSlot
		};
		
		const promoPriceChnager = {
		  'common': 0.01,
		  'uncommon': 0.05,
		  'rare': 0.1,
		  'epic': 0.25,
		  'legendary': 0.5,
		  'arcane': 0.65,
		  'nameless': 0.75,
		  'none': 0.9,
		  'gold-none': 0.9,
		  'box-none': 0.3,
		  'case-none': 0.7
	  }
	  let promoPrice = Math.round(price * (promoPriceChnager[editItemTopRarity] || 1) * 100) / 100;

	   const updatedPromoItem = {
		...itemsDatabase[itemIndex],
		name,
		collection,
		stock,
		price: promoPrice,
		image,
		isCase: isCase || false,
		isCharm,
		isSticker,
		isItemWithoutSlot
	  };
		
		updatedItem.priceMultiply = priceMultiply;
		updateItemPriceInUI(updatedItem);
		
		if (isCase) {
			updatedItem.contains = contains;
			updatedItem.dropChances = dropChances;
		} else {
			delete updatedItem.contains;
			delete updatedItem.dropChances;
		}
		
		itemsDatabase[itemIndex] = updatedItem;
		
		if (isItemLimited) {
			const itemIndex1 = promoItemsDatabase.findIndex(item => item.id === itemId);
			if (itemIndex1 === -1) {
				promoItemsDatabase.push(updatedPromoItem);
			}
		}
		
		const itemElement = document.getElementById(itemId);
		if (itemElement) {
			itemElement.querySelector('.item-name').textContent = name;
			itemElement.querySelector('.available-stock').textContent = stock;
			itemElement.querySelector('.item-price').textContent = `${price.toFixed(2)} ₽`;
			itemElement.querySelector('.item-img img').src = image;
			itemElement.querySelector('.item-img img').alt = name;
			
			const buttons = itemElement.querySelectorAll('.add-to-cart, .buy-all-btn');
			buttons.forEach(btn => {
				btn.setAttribute('data-name', name);
				btn.setAttribute('data-price', price);
				btn.setAttribute('data-max', stock);
			});
			
			itemElement.querySelector('.stock-warning').style.display = stock <= 0 ? 'block' : 'none';
			buttons.forEach(btn => {
				btn.disabled = stock <= 0;
			});
			
			const collectionInfo = collectionsDatabase[collection] || { name: collection, image: '' };
			const collectionElement = itemElement.querySelector('.item-collection');
			collectionElement.innerHTML = `
				${collectionInfo.image ? `<img src="${collectionInfo.image}" class="collection-icon" alt="${collectionInfo.name}" style="width: 30px; height: auto;">` : ''}
				${collectionInfo.name}
			`;
			collectionElement.dataset.collection = collection;
			
			const raritySelect = document.getElementById('edit-item-rarity').value;
			if (raritySelect && raritySelect !== itemsDatabase[itemIndex].rarity) {
				itemsDatabase[itemIndex].rarity = raritySelect;
				itemElement.setAttribute('data-rarity', raritySelect);
				
				const rarityInfo = rarities[raritySelect];
				const rarityElement = itemElement.querySelector('.item-rarity');
				rarityElement.className = `item-rarity ${rarityInfo.color}`;
				rarityElement.textContent = rarityInfo.name;
			}
		}
		
		showToast(`Предмет "${name}" успешно обновлен!`);
		editItemModal.style.display = 'none';
	});
	
	const addRarityBtn = document.getElementById('add-rarity-btn');
	const addRarityModal = document.getElementById('add-rarity-modal');
	const cancelAddRarity = document.getElementById('cancel-add-rarity');
	const confirmAddRarity = document.getElementById('confirm-add-rarity');
	
	addRarityBtn.addEventListener('click', function() {
		const craftsFromSelect = document.getElementById('new-rarity-crafts-from');
		const craftsToSelect = document.getElementById('new-rarity-crafts-to');
		
		craftsFromSelect.innerHTML = '<option value="null">Null (не крафтится)</option>';
		craftsToSelect.innerHTML = '<option value="null">Null (не улучшается)</option>';
		
		Object.keys(rarities).forEach(rarity => {
			craftsFromSelect.innerHTML += `<option value="${rarity}">${rarities[rarity].name}</option>`;
			craftsToSelect.innerHTML += `<option value="${rarity}">${rarities[rarity].name}</option>`;
		});
		
		addRarityModal.style.display = 'flex';
	});

	cancelAddRarity.addEventListener('click', function() {
		addRarityModal.style.display = 'none';
	});

	confirmAddRarity.addEventListener('click', function() {
		const id = document.getElementById('new-rarity-id').value.trim();
		const name = document.getElementById('new-rarity-name').value.trim();
		const color = document.getElementById('new-rarity-color').value;
		const craftsFrom = document.getElementById('new-rarity-crafts-from').value;
		const craftsTo = document.getElementById('new-rarity-crafts-to').value;
		const order = parseInt(document.getElementById('new-rarity-order').value);

		if (!id || !name || !order) {
			showToast('Заполните обязательные поля!', true);
			return;
		}

		if (rarities[id]) {
			showToast('Редкость с таким ID уже существует!', true);
			return;
		}

		addNewRarity(
			id,          // ID редкости (англ.)
			name,          // Название
			color,         // Цвет в HEX
			order,                 // Порядок (чем больше, тем выше редкость)
			craftsTo,              // Во что крафтится (null если это самая высокая редкость)
			craftsFrom         // Из какой редкости крафтится (null если не крафтится)
		);

		showToast(`Редкость "${name}" успешно добавлена!`);
		addRarityModal.style.display = 'none';
		
		document.getElementById('new-rarity-id').value = '';
		document.getElementById('new-rarity-name').value = '';
		document.getElementById('new-rarity-order').value = '1';
	});
	
	sortPriceBtn.addEventListener('click', function() {
		sortDescending = !sortDescending;
		this.textContent = sortDescending ? 'Сортировать по цене ↓' : 'Сортировать по цене ↑';
		this.classList.toggle('active');
		sortItemsByPrice();
	});
	
	function sortItemsByQuantity() {
		const container = document.getElementById('items-container');
		const items = Array.from(container.querySelectorAll('.item-card'));
		
		items.sort((a, b) => {
			const qtyA = parseInt(a.querySelector('.available-stock').textContent);
			const qtyB = parseInt(b.querySelector('.available-stock').textContent);
			
			return sortQtyDescending ? qtyB - qtyA : qtyA - qtyB;
		});
		
		container.innerHTML = '';
		items.forEach(item => container.appendChild(item));
	}
	
	function sortItemsByPrice() {
		const container = document.getElementById('items-container');
		const items = Array.from(container.querySelectorAll('.item-card'));
		
		items.sort((a, b) => {
			const btnA = a.querySelector('.find-on-platform-btn') || a.querySelector('.rent-item-btn');
			const btnB = b.querySelector('.find-on-platform-btn') || b.querySelector('.rent-item-btn');
			const priceA = btnA && btnA.hasAttribute('data-price') ? parseFloat(btnA.getAttribute('data-price')) : 0;
			const priceB = btnB && btnB.hasAttribute('data-price') ? parseFloat(btnB.getAttribute('data-price')) : 0;
			return sortDescending ? priceB - priceA : priceA - priceB;
		});
		
		container.innerHTML = '';
		items.forEach(item => container.appendChild(item));
	}
	
	function getContrastColor(hexColor) {
		const r = parseInt(hexColor.substr(1, 2), 16);
		const g = parseInt(hexColor.substr(3, 2), 16);
		const b = parseInt(hexColor.substr(5, 2), 16);
		
		const brightness = (r * 299 + g * 587 + b * 114) / 1000;
		
		return brightness > 128 ? '#000000' : '#ffffff';
	}
	
	function updateCollectionSelect(selectId, selectedCollection = '') {
		const select = document.getElementById(selectId);
		if (!select) return;
		
		const currentValue = select.value;
		
		select.innerHTML = '<option value="">Выберите коллекцию</option>';
		
		Object.values(collectionsDatabase).forEach(collection => {
			const option = document.createElement('option');
			option.value = collection.id;
			option.textContent = collection.name;
			if (collection.id === selectedCollection) {
				option.selected = true;
			}
			select.appendChild(option);
		});
		
		if (currentValue && Array.from(select.options).some(opt => opt.value === currentValue)) {
			select.value = currentValue;
		}
	}

	document.getElementById('add-item-btn').addEventListener('click', function() {
		updateCollectionSelect('new-item-collection');
	});

	document.getElementById('edit-item-btn').addEventListener('click', function() {
		updateCollectionSelect('edit-item-collection');
	});
	
	const promocodes = {};

	const promocodeBtn = document.getElementById('promocode-btn');
	const promocodeModal = document.getElementById('promocode-modal');
	const promocodeInput = document.getElementById('promocode-input');
	const promocodeCancel = document.getElementById('promocode-cancel');
	const promocodeApply = document.getElementById('promocode-apply');
	const promocodeResult = document.getElementById('promocode-result');

	document.querySelectorAll('.add-item-container, .edit-item-container, .add-rarity-container, .admin-buttons-container').forEach(el => {
		el.style.display = 'none';
	});
	
	let lastPromoGenerationTime = 0;
	let currentGeneratedPromo = null;

	function generateRandomPromocode() {
		const now = Date.now();
		const oneMinute = 30 * 1000; // 1 минута в миллисекундах
		
		if (now - lastPromoGenerationTime < oneMinute) {
			const secondsLeft = Math.ceil((oneMinute - (now - lastPromoGenerationTime)) / 1000);
			promocodeResult.style.color = '#ff3333';
			promocodeResult.textContent = `Подождите еще ${secondsLeft} секунд перед генерацией нового промокода`;
			return;
		}
		
		if (currentGeneratedPromo && promocodes[currentGeneratedPromo]) {
			delete promocodes[currentGeneratedPromo];
		}
		
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let promoCode = '';
		const usedPromoCodes = new Set(Object.keys(promocodes));
		
		do {
			promoCode = '';
			for (let i = 0; i < 16; i++) {
				promoCode += chars.charAt(Math.floor(Math.random() * chars.length));
			}
		} while (usedPromoCodes.has(promoCode));

		const maxActivations = weightedRandom(
			[1, 2, 3, 5, 10],
			[0.7, 0.2, 0.06, 0.03, 0.01]  // 10 активаций теперь всего 1% chance
		);
		
		const balanceAdd = weightedRandom(
			[0, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000],
			[0.40, 0.33, 0.13, 0.065, 0.052, 0.013, 0.006, 0.003, 0.001]  // 1 млрд теперь 0.1% chance
		);
		
		const itemCount = weightedRandom(
			[0, 1, 3, 5, 10, 20, 50, 100],
			[0.40, 0.33, 0.13, 0.065, 0.052, 0.013, 0.006, 0.004]  // 100 предметов теперь 0.4% chance
		);
		
		const finalItemCount = (balanceAdd === 0 && itemCount === 0) ? 1 : itemCount;
		
		let itemsGenerator = [];
		if (finalItemCount > 0) {
			itemsGenerator = () => {
				const result = [];
				const rarityWeights = {
					'common': 0.22,     // было 0.26 	- 	26%
					'uncommon': 0.18,   // было 0.244 	- 	24,4%
					'rare': 0.16,       // было 0.195 	- 	19,5%
					'epic': 0.15,       // было 0.15 	- 	15%
					'legendary': 0.14,  // было 0.10	-	10%
					'arcane': 0.10,     // было 0.045	-	4,5%
					'nameless': 0.05    // было 0.006	-	0,6%
				};
				
				for (let i = 0; i < finalItemCount; i++) {
					let randomRarity = weightedRandom(
						Object.keys(rarityWeights),
						Object.values(rarityWeights)
					);
					
					let itemsOfRarity = itemsDatabase.filter(item => item.rarity === randomRarity);
					
					if (itemsOfRarity.length === 0) {
						itemsOfRarity = itemsDatabase;
					}
					
					const randomItem = itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)];
					
					if (randomItem) {
						const isTemporary = Math.random() < 0.8;
						
						if (isTemporary && !randomItem.isCase && !randomItem.isCharm && !randomItem.isSticker && !randomItem.name.endsWith('Fragment')) {
							const itemName = randomItem.name.includes("(TimeLimited)") 
								? randomItem.name 
								: randomItem.name + " (TimeLimited)";
							const itemId = randomItem.id.includes("_rental") 
								? randomItem.id 
								: randomItem.id + "_rental";
							result.push({
								id: itemId,
								name: itemName,
								rarity: randomItem.rarity,
								image: randomItem.image,
								isRental: true,
								rentalExpires: Date.now() + (3 * 60 * 1000) // 3 минуты
							});
						} else {
							if (randomItem.id.includes("_rental")) {
								const itemName = randomItem.name.includes("(TimeLimited)") 
									? randomItem.name 
									: randomItem.name + " (TimeLimited)";
								result.push({
									id: randomItem.id,
									name: itemName,
									rarity: randomItem.rarity,
									image: randomItem.image,
									isRental: true,
									rentalExpires: Date.now() + (3 * 60 * 1000) // 3 минуты
								});
							}
							else {
								result.push(randomItem.id);
							}
						}
					}
				}
				return result;
			};
		}
		
		addNewPromocode(promoCode, balanceAdd, itemsGenerator, false, maxActivations);
		
		currentGeneratedPromo = promoCode;
		lastPromoGenerationTime = now;
		
		setTimeout(() => {
			if (promocodes[promoCode]) {
				delete promocodes[promoCode];
				if (promocodeInput.value === promoCode) {
					promocodeResult.textContent = 'Промокод истек и был удален';
					promocodeResult.style.color = '#ff3333';
				}
				currentGeneratedPromo = null;
			}
		}, oneMinute);
		
		promocodeInput.value = promoCode;
		
		let info = `Сгенерирован промокод на:`;
		if (balanceAdd > 0) info += ` ${balanceAdd.toLocaleString('ru-RU')} ₽,`;
		if (finalItemCount > 0) info += ` ${finalItemCount} предмет(ов) (60% временные),`;
		info += ` ${maxActivations} активаций (действителен ${Math.ceil(oneMinute / 1000)} секунд)`;
		
		promocodeResult.textContent = info;
		promocodeResult.style.color = '#4CAF50';
	}

	function weightedRandom(values, weights) {
		let sum = weights.reduce((a, b) => a + b, 0);
		let normalizedWeights = weights.map(w => w / sum);
		
		let r = Math.random();
		let s = 0;
		
		for (let i = 0; i < normalizedWeights.length; i++) {
			s += normalizedWeights[i];
			if (r <= s) return values[i];
		}
		
		return values[values.length - 1];
	}

	promocodeBtn.addEventListener('click', function() {
		promocodeInput.value = '';
		promocodeResult.textContent = '';
		promocodeModal.style.display = 'flex';
	});
	
	promocodeModal.addEventListener('click', function(e) {
		if (e.target === promocodeModal) {
			promocodeModal.style.display = 'none';
		}
	});

	document.addEventListener('keydown', function(e) {
		if (e.key === 'Escape' && promocodeModal.style.display === 'flex') {
			promocodeModal.style.display = 'none';
		}
	});

	promocodeCancel.addEventListener('click', function() {
		promocodeModal.style.display = 'none';
	});

	promocodeApply.addEventListener('click', function() {
		const code = promocodeInput.value.trim().toUpperCase();
		if (!code) {
			promocodeResult.textContent = 'Введите промокод';
			promocodeResult.style.color = '#ff3333';
			return;
		}

		const promo = promocodes[code];
		if (!promo) {
			promocodeResult.textContent = 'Неверный промокод';
			promocodeResult.style.color = '#ff3333';
			return;
		}
		
		if (promo.maxActivations === 0) {
			promocodeResult.style.color = '#4CAF50';
		}
		else {
			if (promo.usedCount >= promo.maxActivations) {
				promocodeResult.textContent = 'Лимит использований промокода исчерпан';
				promocodeResult.style.color = '#ff3333';
				return;
			}
			else {
				promocodeResult.style.color = '#4CAF50';
			}
		}
		
		if (promo.specialType === 'toggle_upgrade') {
			alwaysUpgradeSuccess = !alwaysUpgradeSuccess;
			promocodeResult.textContent = `Режим 100% апгрейда ${alwaysUpgradeSuccess ? 'включен' : 'выключен'}!`;
			promocodeResult.style.color = '#4CAF50';
			promo.usedCount++;
			return;
		}

		if (promo.balanceAdd > 0) {
			balance += promo.balanceAdd;
			if (promo.balanceAdd > 10000) {
				addExp(Math.round(promo.balanceAdd));
			} else {
				addExp(Math.round(promo.balanceAdd));
			}
			
			updateMMRang(promo.balanceAdd);
			UpdateStatrackFrame(balance);
			balanceAmount.textContent = balance.toLocaleString('ru-RU');
		}
		
		if (promo.itemsGenerator) {
			const generatedItems = typeof promo.itemsGenerator === 'function' ? 
				promo.itemsGenerator() : 
				promo.itemsGenerator;
			
			generatedItems.forEach(item => {
				if (typeof item === 'object' && item.isRental) {
					inventory.push(item);
				} else {
					const itemData = itemsDatabase.find(i => i.id === item);
					if (itemData) {
						inventory.push({
							id: itemData.id,
							name: itemData.name,
							rarity: itemData.rarity,
							image: itemData.image
						});
					}
				}
			});
			
			const itemsCount = generatedItems.length;
			promocodeResult.textContent = `Промокод активирован! Получено: ${promo.balanceAdd} ₽ и ${itemsCount} предмет(ов)` + 
				(promo.maxActivations > 1 ? ` (Осталось использований: ${promo.maxActivations - 1 - promo.usedCount})` : '');
		} else {
			promocodeResult.textContent = `Промокод активирован! Получено: ${promo.balanceAdd} ₽` + 
				(promo.maxActivations > 1 ? ` (Осталось использований: ${promo.maxActivations - 1 - promo.usedCount})` : '');
		}
		
		if (promo.isAdmin === true && editBalanceBtn.style.display === 'none') {
			document.querySelectorAll('.add-item-container, .edit-item-container, .add-rarity-container, .admin-buttons-container').forEach(el => {
				el.style.display = 'block';
			});
			editBalanceBtn.style.display = 'block';
		} else {
			document.querySelectorAll('.add-item-container, .edit-item-container, .add-rarity-container, .admin-buttons-container').forEach(el => {
				el.style.display = 'none';
			});
			editBalanceBtn.style.display = 'none';
		}
		
		promocodes[code].usedCount++;
		
		updateInventory();
	});

	function addNewPromocode(code, balanceAdd, itemsGenerator, isAdmin = false, maxActivations = 1, allowedCollections = null, allowedRarities = null, specialType = null) {
		let filteredItems = itemsGenerator;
		if (Array.isArray(itemsGenerator)) {
			filteredItems = itemsGenerator.filter(itemId => {
				const item = itemsDatabase.find(i => i.id === itemId);
				return item && !item.isRental;
			});
		}
		
		promocodes[code.toUpperCase()] = {
			balanceAdd: balanceAdd,
			itemsGenerator: filteredItems,
			isAdmin: isAdmin,
			maxActivations: maxActivations,
			usedCount: 0,
			allowedCollections: allowedCollections,
			allowedRarities: allowedRarities,
			specialType: specialType // Добавляем специальный тип
		};
	}

	const collectionsDatabase = {
		'none_collection': {
			id: 'none_collection',
			name: 'None',
			image: 'images/none/none_collection_icon.png'
		}
	};
	
	const itemsDatabase = [
		{
			itemInStore: true,
			id: 'snowball',
			name: 'Snowball',
			collection: 'none_collection',
			stock: 25,
			price: 350,
			rarity: 'none',
			image: 'images/none/snowball.png',
			isItemWithoutSlot: true,
			priceMultiply: 0
		},
		{
			itemInStore: true,
			id: 'gold50',
			name: 'Gold50',
			collection: 'none_collection',
			stock: 1000,
			price: 62.5,
			rarity: 'gold-none',
			image: 'images/gold/gold1.png',
			isItemWithoutSlot: true,
			priceMultiply: 0
		},
		{
			itemInStore: true,
			id: 'gold100',
			name: 'Gold100',
			collection: 'none_collection',
			stock: 1000,
			price: 125,
			rarity: 'gold-none',
			image: 'images/gold/gold2.png',
			isItemWithoutSlot: true,
			priceMultiply: 0
		},
		{
			itemInStore: true,
			id: 'gold300',
			name: 'Gold300',
			collection: 'none_collection',
			stock: 1000,
			price: 375,
			rarity: 'gold-none',
			image: 'images/gold/gold3.png',
			isItemWithoutSlot: true,
			priceMultiply: 0
		},
		{
			itemInStore: true,
			id: 'gold500',
			name: 'Gold500',
			collection: 'none_collection',
			stock: 1000,
			price: 625,
			rarity: 'gold-none',
			image: 'images/gold/gold4.png',
			isItemWithoutSlot: true,
			priceMultiply: 0
		},
		{
			itemInStore: true,
			id: 'gold1000',
			name: 'Gold1000',
			collection: 'none_collection',
			stock: 1000,
			price: 1250,
			rarity: 'gold-none',
			image: 'images/gold/gold5.png',
			isItemWithoutSlot: true,
			priceMultiply: 0
		},
		{
			itemInStore: true,
			id: 'gold3000',
			name: 'Gold3000',
			collection: 'none_collection',
			stock: 1000,
			price: 3750,
			rarity: 'gold-none',
			image: 'images/gold/gold6.png',
			isItemWithoutSlot: true,
			priceMultiply: 0
		},
		{
			itemInStore: true,
			id: 'gold5000',
			name: 'Gold5000',
			collection: 'none_collection',
			stock: 1000,
			price: 6250,
			rarity: 'gold-none',
			image: 'images/gold/gold7.png',
			isItemWithoutSlot: true,
			priceMultiply: 0
		},
		{
			itemInStore: true,
			id: 'gold10000',
			name: 'Gold10000',
			collection: 'none_collection',
			stock: 1000,
			price: 12500,
			rarity: 'gold-none',
			image: 'images/gold/gold8.png',
			isItemWithoutSlot: true,
			priceMultiply: 0
		},
		{
			itemInStore: true,
			id: 'gold30000',
			name: 'Gold30000',
			collection: 'none_collection',
			stock: 1000,
			price: 37500,
			rarity: 'gold-none',
			image: 'images/gold/gold9.png',
			isItemWithoutSlot: true,
			priceMultiply: 0
		},
		{
			itemInStore: true,
			id: 'gold50000',
			name: 'Gold50000',
			collection: 'none_collection',
			stock: 1000,
			price: 62500,
			rarity: 'gold-none',
			image: 'images/gold/gold10.png',
			isItemWithoutSlot: true,
			priceMultiply: 0
		},
		{
			itemInStore: true,
			id: 'gold100000',
			name: 'Gold100000',
			collection: 'none_collection',
			stock: 1000,
			price: 125000,
			rarity: 'gold-none',
			image: 'images/gold/gold11.png',
			isItemWithoutSlot: true,
			priceMultiply: 0
		}
	];
	
	document.getElementById('collection-filter').addEventListener('change', function() {
		const collectionId = this.value;
		const activeRarityBtn = document.querySelector('.filter-btn.active');
		const selectedRarity = activeRarityBtn ? activeRarityBtn.getAttribute('data-rarity') : 'all';
		
		document.querySelectorAll('.item-card').forEach(card => {
			const itemCollection = card.querySelector('.item-collection').dataset.collection;
			const cardRarity = card.getAttribute('data-rarity');
			
			const collectionMatch = collectionId === 'all' || itemCollection === collectionId;
			const rarityMatch = selectedRarity === 'all' || cardRarity === selectedRarity;
			
			card.style.display = 'none';
			
			if (collectionMatch && rarityMatch) {
				card.style.display = 'block';
			}
		});
	});

	document.getElementById('add-collection-btn').addEventListener('click', function() {
		openAddCollectionModal();
	});

	document.getElementById('edit-collection-btn').addEventListener('click', function() {
		openEditCollectionModal();
	});

	document.getElementById('edit-rarity-btn').addEventListener('click', function() {
		openEditRarityModal();
	});
	
	const editBalanceBtn = document.getElementById('edit-balance-btn');
	const balanceEditModal = document.getElementById('balance-edit-modal');
	const balanceDisplay = document.getElementById('balance-display');
	const balanceCancel = document.getElementById('balance-cancel');
	const balanceSave = document.getElementById('balance-save');
	const balanceKeys = document.querySelectorAll('.balance-key');
	
	editBalanceBtn.style.display = 'none';
	
	balanceAmount.addEventListener('click', function() {
		openCurrencyShop();
	});
	
	const currencyPacksDatabase = [
		{
			id: 'pack_50',
			amount: 50,
			price: 75,
			image: 'images/gold/cartG50.png',
			name: 'gold50',
			rewards: ['gold50']
		},
		{
			id: 'pack_100',
			amount: 100,
			price: 119,
			image: 'images/gold/cartG100.png',
			name: 'gold100',
			rewards: ['gold100']
		},
		{
			id: 'pack_300',
			amount: 300,
			price: 319,
			image: 'images/gold/cartG300.png',
			name: 'gold300',
			rewards: ['gold300']
		},
		{
			id: 'pack_500',
			amount: 500,
			price: 499,
			image: 'images/gold/cartG500.png',
			name: 'gold500',
			rewards: ['gold500']
		},
		{
			id: 'pack_1000',
			amount: 1000,
			price: 890,
			image: 'images/gold/cartG1000.png',
			name: 'gold1000',
			rewards: ['gold1000']
		},
		{
			id: 'pack_3000',
			amount: 3000,
			price: 1999,
			image: 'images/gold/cartG3000.png',
			name: 'gold3000',
			rewards: ['gold3000']
		}
	];
	
	function addCurrencyPack(id, amount, price, image, name, rewards=[]) {
		var existingPack = currencyPacksDatabase.find(function(pkg) {
			return pkg.id === id;
		});
		
		if (existingPack) {
			console.error('Пакет с таким ID уже существует!');
			return false;
		}

		currencyPacksDatabase.push({
			id: id,
			amount: amount,
			price: price,
			image: image,
			name: name,
			rewards: rewards
		});
		
		return true;
	}
	
	addCurrencyPack('pack_5000', 5000, 2999, 'images/gold/cartG5000.png', 'gold5000', ['gold5000']);
	addCurrencyPack('pack_10000', 10000, 5399, 'images/gold/cartG10000.png', 'gold10000', ['gold10000']);
	addCurrencyPack('pack_30000', 30000, 14999, 'images/gold/cartG30000.png', 'gold30000', ['gold30000']);
	addCurrencyPack('pack_50000', 50000, 21890, 'images/gold/cartG50000.png', 'gold50000', ['gold50000']);
	addCurrencyPack('pack_100000', 100000, 32700, 'images/gold/cartG100000.png', 'gold100000', ['gold100000']);
	
	function openCurrencyShop() {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.display = 'flex';
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100%';
		modal.style.height = '100%';
		modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
		modal.style.zIndex = '1001';
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';

		const packsHTML = currencyPacksDatabase.map(function(pack) {
			return `
			<div class="currency-pack" style="min-width: 160px; background: #2a2a2a; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #444; flex-shrink: 0;">
				<div class="currency-pack-image" style="width: 100px; height: 100px; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; cursor: pointer;" data-pack-name="${pack.name}">
					<img src="${pack.image}" alt="${pack.name}" style="transform: translateY(30px);max-width: 200%;max-height: 200%;object-fit: contain;">
				</div>
				<div style="transform: translateY(15px);font-size: 20px;color: gold;margin-bottom: 20px;">${pack.amount.toLocaleString('ru-RU')} ₽</div>
				<div style="font-size: 16px; color: #ffd700; margin-bottom: 15px; font-weight: bold;">${pack.price.toLocaleString('ru-RU')} RUB</div>
				<button class="buy-currency-btn" data-id="${pack.id}" data-amount="${pack.amount}" data-price="${pack.price}">
					Купить
				</button>
			</div>
			`;
		}).join('');

		modal.innerHTML = `
			<div class="modal-content" style="background-color: rgb(30 30 30 / 95%); padding: 25px; border-radius: 10px; width: 90%; max-width: 900px; max-height: 80vh; overflow: auto; position: relative;">
				<button id="close-currency-shop" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: white; font-size: 20px; cursor: pointer; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">×</button>
				<h2 style="text-align: center; margin-bottom: 25px; color: gold;">Пополнение баланса</h2>
				
				<div style="display: flex; gap: 15px; margin-bottom: 25px; overflow-x: auto; padding: 10px;">
					${packsHTML}
				</div>

				<div style="text-align: center; color: #aaa; font-size: 14px; margin-top: 20px;">
					* После покупки валюта будет мгновенно зачислена на ваш счет
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		// Добавляем обработчики клика для просмотра 3D модели валюты
		const packImages = modal.querySelectorAll('.currency-pack-image');
		packImages.forEach(function(imgContainer) {
			imgContainer.addEventListener('click', function(e) {
				e.stopPropagation();
				e.preventDefault();
				
				const packName = imgContainer.getAttribute('data-pack-name');
				
				// Находим предмет в itemsDatabase по pack.name
				let item = null;
				itemsDatabase.forEach(dbItem => {
					if (dbItem.id === packName) {
						item = dbItem;
					}
				});
				
				if (item) {
					const originalItem = itemsDbMap.get(item.id);
					
					// Проверяем, можно ли показать 3D
					const sourceItem = originalItem || item;
					// Создаем временный контейнер, как в showCraftResult
					const tempContainer = document.createElement('div');
					document.body.appendChild(tempContainer);
					
					// Вызываем setup3DViewer
					setup3DViewer(tempContainer, item, originalItem);
					
					// Программно кликаем по контейнеру
					tempContainer.click();
					
					// Удаляем временный контейнер
					document.body.removeChild(tempContainer);
				}
			});
		});

		var buttons = modal.querySelectorAll('.buy-currency-btn');
		for (var i = 0; i < buttons.length; i++) {
			buttons[i].addEventListener('click', function() {
				var packId = this.getAttribute('data-id');
				var amount = parseInt(this.getAttribute('data-amount'));
				var price = parseInt(this.getAttribute('data-price'));
				
				var currencyPack = currencyPacksDatabase.find(function(pkg) {
					return pkg.id === packId;
				});
				
				if (currencyPack) {
					// balance += amount;
					balanceAmount.textContent = balance.toLocaleString('ru-RU');
					UpdateStatrackFrame(balance);
					
					let message = `Успешно! +${amount.toLocaleString('ru-RU')} ₽ за ${price.toLocaleString('ru-RU')} RUB`;
					
					if (currencyPack.rewards && currencyPack.rewards.length > 0) {
						const rewardNames = [];
						
						currencyPack.rewards.forEach(rewardId => {
							const rewardItem = itemsDatabase.find(item => item.id === rewardId);
							if (rewardItem) {
								inventory.push({
									id: rewardItem.id,
									name: rewardItem.name,
									rarity: rewardItem.rarity,
									image: rewardItem.image
								});
								rewardNames.push(rewardItem.name);
							}
						});
						
						if (rewardNames.length > 0) {
							message += `\nПолучены награды: x${rewardNames.length}`;
						}
					}
					
					showToast(message);
					
					if (currencyPack.rewards && currencyPack.rewards.length > 0) {
						updateInventory();
					}
					
					saveGameState();
				}
			});
		}

		modal.querySelector('#close-currency-shop').addEventListener('click', function() {
			modal.remove();
		});

		modal.addEventListener('click', function(e) {
			if (e.target === modal) {
				modal.remove();
			}
		});

		document.addEventListener('keydown', function closeOnEscape(e) {
			if (e.key === 'Escape') {
				modal.remove();
				document.removeEventListener('keydown', closeOnEscape);
			}
		});
	}

	balanceAmount.style.cursor = 'pointer';
	balanceAmount.title = 'Нажмите для пополнения баланса';

	editBalanceBtn.addEventListener('click', function() {
		balanceDisplay.textContent = balance;
		balanceEditModal.style.display = 'flex';
	});

	balanceCancel.addEventListener('click', function() {
		balanceEditModal.style.display = 'none';
	});

	balanceSave.addEventListener('click', function() {
		balance = parseFloat(balanceDisplay.textContent) || 0;
		balanceAmount.textContent = balance.toLocaleString('ru-RU');
		UpdateStatrackFrame(balance);
		balanceEditModal.style.display = 'none';
		showToast('Баланс обновлён');
	});

	balanceKeys.forEach(key => {
		key.addEventListener('click', function () {
			const value = this.getAttribute('data-value');

			if (value === '.') {
				if (!balanceDisplay.textContent.includes('.')) {
					balanceDisplay.textContent += '.';
				}
			} else if (value === 'backspace') {
				balanceDisplay.textContent = balanceDisplay.textContent.slice(0, -1);
				
				if (balanceDisplay.textContent === '' || balanceDisplay.textContent === '-') {
					balanceDisplay.textContent = '0';
				}
			} else if (value === 'clear') {
				balanceDisplay.textContent = '0';
			} else {
				if (balanceDisplay.textContent.includes('.') && balanceDisplay.textContent.split('.')[1]?.length >= 2) {
					return; // Избегаем ввода третьей цифры после точки
				}
				
				if (balanceDisplay.textContent === '0') {
					balanceDisplay.textContent = value;
				} else {
					balanceDisplay.textContent += value;
				}
			}
		});
	});
	
	const addItemBtn = document.getElementById('add-item-btn');
	const addItemModal = document.getElementById('add-item-modal');
	const cancelAddItem = document.getElementById('cancel-add-item');
	const confirmAddItem = document.getElementById('confirm-add-item');

	addItemBtn.addEventListener('click', function() {
		addItemModal.style.display = 'flex';
	});

	cancelAddItem.addEventListener('click', function() {
		addItemModal.style.display = 'none';
	});

	confirmAddItem.addEventListener('click', function() {
		const id = document.getElementById('new-item-id').value.trim();
		const name = document.getElementById('new-item-name').value.trim();
		const collection = document.getElementById('new-item-collection').value.trim();
		const stock = parseInt(document.getElementById('new-item-stock').value);
		const price = parseFloat(document.getElementById('new-item-price').value);
		const priceMultiply = parseFloat(document.getElementById('new-item-price-multiply'));
		const rarity = document.getElementById('new-item-rarity').value;
		const image = document.getElementById('new-item-image').value.trim();
		const isCase = document.getElementById('new-item-is-case').checked;
		const isCharm = document.getElementById('new-item-is-charm').checked;
		const isSticker = document.getElementById('new-item-is-sticker').checked;
		const isItemWithoutSlot = document.getElementById('new-item-is-without-slot').checked;
		const isItemLimited = document.getElementById('new-item-is-limited').checked;
		
		if (!id || !name || !collection || isNaN(stock) || isNaN(price) || !image) {
			showToast('Заполните все поля!', true);
			return;
		}

		if (itemsDatabase.some(item => item.id === id)) {
			showToast('Предмет с таким ID уже существует!', true);
			return;
		}

		let contains = [];
		let dropChances = {};
		
		if (isCase) {
			contains = document.getElementById('new-item-contains').value
				.split(',')
				.map(item => item.trim())
				.filter(item => item);
				
			Object.keys(rarities).forEach(rarity => {
				if (true) {
					const checkbox = document.getElementById(`chance-${rarity}-checkbox`);
					if (checkbox && checkbox.checked) {
						const chance = parseInt(document.getElementById(`chance-${rarity}`).value) || 0;
						if (chance > 0) {
							dropChances[rarity] = chance;
						}
					}
				}
			});
			
			const totalChance = Object.values(dropChances).reduce((sum, chance) => sum + chance, 0);
			if (totalChance !== 100) {
				showToast('Сумма шансов должна быть равна 100%!', true);
				return;
			}
			
			if (Object.keys(dropChances).length === 0) {
				showToast('Выберите хотя бы одну редкость для кейса!', true);
				return;
			}
		}

		if (isItemLimited) {
			addNewPromoItem(
				true, id, name, collection, stock, price, rarity, image, 
				isCase, contains, dropChances, isCharm, isSticker, isItemWithoutSlot, priceMultiply
			);
		} else {
			addNewItem(
				true, id, name, collection, stock, price, rarity, image, 
				isCase, contains, dropChances, isCharm, isSticker, isItemWithoutSlot, priceMultiply
			);
		}

		showToast('Предмет успешно добавлен!');

		addItemModal.style.display = 'none';
		document.getElementById('new-item-id').value = '';
		document.getElementById('new-item-name').value = '';
		document.getElementById('new-item-collection').value = '';
		document.getElementById('new-item-stock').value = '1';
		document.getElementById('new-item-price').value = '0';
		document.getElementById('new-item-price-multiply').value = '0';
		document.getElementById('new-item-image').value = '';
		document.getElementById('new-item-is-case').checked = false;
		document.getElementById('case-fields').style.display = 'none';
	});
	
	document.getElementById('new-item-is-case').addEventListener('change', function() {
		  const caseFields = document.getElementById('case-fields');
		  caseFields.style.display = this.checked ? 'block' : 'none';
		  
		  if (this.checked) {
			const colorsContainer = document.getElementById('rarity-colors');
			colorsContainer.innerHTML = '';
			
			const container = document.getElementById('rarity-chances-container');
			container.innerHTML = '';
			
			Object.keys(rarities).forEach(rarity => {
				if (true) { // Исключаем case-none из возможных редкостей в кейсе
					const div = document.createElement('div');
					div.style.marginBottom = '10px';
					div.style.display = 'flex';
					div.style.alignItems = 'center';
					div.style.gap = '10px';
					
					const checkbox = document.createElement('input');
					checkbox.type = 'checkbox';
					checkbox.id = `chance-${rarity}-checkbox`;
					checkbox.dataset.rarity = rarity;
					
					const label = document.createElement('label');
					label.htmlFor = `chance-${rarity}-checkbox`;
					if (rarity !== 'case-none' && rarity !== 'box-none') {
						label.textContent = `${rarities[rarity].name}`;
					} else {
						label.textContent = `${rarity}`;
					}
					label.style.color = getRarityColor(rarity);
					
					const input = document.createElement('input');
					input.type = 'number';
					input.id = `chance-${rarity}`;
					input.min = '0';
					input.max = '100';
					input.value = '0';
					input.style.width = '60px';
					input.style.padding = '5px';
					input.disabled = true;
					
					const percent = document.createElement('span');
					percent.textContent = '%';
					
					checkbox.addEventListener('change', function() {
						input.disabled = !this.checked;
						if (!this.checked) input.value = '0';
					});
					
					div.appendChild(checkbox);
					div.appendChild(label);
					div.appendChild(input);
					div.appendChild(percent);
					
					container.appendChild(div);
				}
			});
		}
	});
	
	document.getElementById('add-promocode-btn').addEventListener('click', function() {
			openAddPromocodeModal();
		});
	
	function openAddPromocodeModal() {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.display = 'flex';
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100%';
		modal.style.height = '100%';
		modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
		modal.style.zIndex = '1000';
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';
		
		modal.innerHTML = `
			<div class="modal-content" style="background-color: rgb(30 30 30 / 85%); padding: 20px; border-radius: 8px; width: 400px; max-width: 90%;">
				<h3 style="margin-top: 0;">Добавить промокод</h3>
				<div class="form-group" style="margin-bottom: 15px;">
					<label style="display: block; margin-bottom: 5px;">Код промокода:</label>
					<input type="text" id="new-promocode-code" style="width: 100%; padding: 8px; background-color: #2a2a2a; border: none; border-radius: 4px; color: white;">
				</div>
				<div class="form-group" style="margin-bottom: 15px;">
					<label style="display: block; margin-bottom: 5px;">Баланс (₽):</label>
					<input type="number" id="new-promocode-balance" min="0" value="0" style="width: 100%; padding: 8px; background-color: #2a2a2a; border: none; border-radius: 4px; color: white;">
				</div>
				<div class="form-group" style="margin-bottom: 15px;">
					<input type="checkbox" id="new-promocode-random-items">
					<label for="new-promocode-random-items">Случайные предметы</label>
				</div>
				<div class="form-group" id="items-id-group" style="margin-bottom: 15px;">
					<label style="display: block; margin-bottom: 5px;">ID предметов (через запятую):</label>
					<input type="text" id="new-promocode-items" style="width: 100%; padding: 8px; background-color: #2a2a2a; border: none; border-radius: 4px; color: white;">
				</div>
				<div class="form-group" id="items-count-group" style="margin-bottom: 15px; display: none;">
					<label style="display: block; margin-bottom: 5px;">Количество случайных предметов:</label>
					<input type="number" id="new-promocode-items-count" min="1" value="1" style="width: 100%; padding: 8px; background-color: #2a2a2a; border: none; border-radius: 4px; color: white;">
				</div>
				<div class="form-group" id="collections-group" style="margin-bottom: 15px; display: none;">
					<label style="display: block; margin-bottom: 5px;">Коллекции (оставьте пустым для всех):</label>
					<div class="collections-checkboxes" style="max-height: 150px; overflow-y: auto; border: 1px solid #444; padding: 10px; border-radius: 4px;">
						${Object.values(collectionsDatabase).map(collection => `
							<div style="margin-bottom: 5px;">
								<input type="checkbox" id="promo-collection-${collection.id}" value="${collection.id}">
								<label for="promo-collection-${collection.id}">${collection.name}</label>
							</div>
						`).join('')}
					</div>
				</div>
				<div class="form-group" id="rarities-group" style="margin-bottom: 15px; display: none;">
					<label style="display: block; margin-bottom: 5px;">Редкости (оставьте пустым для всех):</label>
					<div class="rarities-checkboxes" style="max-height: 150px; overflow-y: auto; border: 1px solid #444; padding: 10px; border-radius: 4px;">
						${Object.keys(rarities).filter(r => r !== 'case-none' && r !== 'box-none').map(rarity => `
							<div style="margin-bottom: 5px;">
								<input type="checkbox" id="promo-rarity-${rarity}" value="${rarity}">
								<label for="promo-rarity-${rarity}" style="color: ${rarities[rarity].colorHex}">${rarities[rarity].name}</label>
							</div>
						`).join('')}
					</div>
				</div>
				<div class="form-group" style="margin-bottom: 15px;">
					<input type="checkbox" id="new-promocode-admin">
					<label for="new-promocode-admin">Разблокировать админ-панель</label>
				</div>
				<div class="form-group" style="margin-bottom: 15px;">
					<input type="checkbox" id="new-promocode-upgrade">
					<label for="new-promocode-upgrade">100% на апгрейды</label>
				</div>
				<div class="form-group" style="margin-bottom: 15px;">
					<label style="display: block; margin-bottom: 5px;">Количество активаций (0 = без ограничений):</label>
					<input type="number" id="new-promocode-activations" min="0" value="1" style="width: 100%; padding: 8px; background-color: #2a2a2a; border: none; border-radius: 4px; color: white;">
				</div>
				<div class="form-actions" style="display: flex; justify-content: space-between;">
					<button id="cancel-add-promocode" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Отмена</button>
					<button id="confirm-add-promocode" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Добавить</button>
				</div>
			</div>
		`;
		
		document.body.appendChild(modal);
		
		document.getElementById('new-promocode-random-items').addEventListener('change', function() {
			const isRandom = this.checked;
			document.getElementById('items-id-group').style.display = isRandom ? 'none' : 'block';
			document.getElementById('items-count-group').style.display = isRandom ? 'block' : 'none';
			document.getElementById('collections-group').style.display = isRandom ? 'block' : 'none';
			document.getElementById('rarities-group').style.display = isRandom ? 'block' : 'none';
		});

		document.getElementById('cancel-add-promocode').addEventListener('click', function() {
			modal.remove();
		});
		
		document.getElementById('confirm-add-promocode').addEventListener('click', function() {
			const code = document.getElementById('new-promocode-code').value.trim().toUpperCase();
			const balanceAdd = parseFloat(document.getElementById('new-promocode-balance').value) || 0;
			const isRandomItems = document.getElementById('new-promocode-random-items').checked;
			const itemsCount = parseInt(document.getElementById('new-promocode-items-count').value) || 1;
			const itemsStr = document.getElementById('new-promocode-items').value.trim();
			const items = itemsStr ? itemsStr.split(',').map(item => item.trim()).filter(item => item) : [];
			const isAdmin = document.getElementById('new-promocode-admin').checked;
			const UpgradeChange = document.getElementById('new-promocode-upgrade').checked;
			const maxActivations = parseInt(document.getElementById('new-promocode-activations').value) || 0;
			
			if (!code) {
				showToast('Введите код промокода!', true);
				return;
			}
			
			if (promocodes[code]) {
				showToast('Промокод с таким кодом уже существует!', true);
				return;
			}
			
			let allowedCollections = null;
			if (isRandomItems) {
				const collectionCheckboxes = modal.querySelectorAll('.collections-checkboxes input[type="checkbox"]:checked');
				if (collectionCheckboxes.length > 0) {
					allowedCollections = Array.from(collectionCheckboxes).map(cb => cb.value);
				}
			}
			
			let allowedRarities = null;
			if (isRandomItems) {
				const rarityCheckboxes = modal.querySelectorAll('.rarities-checkboxes input[type="checkbox"]:checked');
				if (rarityCheckboxes.length > 0 && rarityCheckboxes.length < Object.keys(rarities).length - 1) {
					allowedRarities = Array.from(rarityCheckboxes).map(cb => cb.value);
				}
			}
			
			let itemsGenerator;
			if (isRandomItems) {
				itemsGenerator = () => {
					let availableItems = itemsDatabase;
					
					if (allowedCollections && allowedCollections.length > 0) {
						availableItems = availableItems.filter(item => allowedCollections.includes(item.collection));
					}
					
					if (allowedRarities && allowedRarities.length > 0) {
						availableItems = availableItems.filter(item => allowedRarities.includes(item.rarity));
					}
					
					availableItems = availableItems.filter(item => !item.isRental && !item.id.includes('rental'));
					
					const itemIds = availableItems.map(item => item.id);
					const result = [];
					for (let i = 0; i < itemsCount; i++) {
						if (itemIds.length > 0) {
							result.push(itemIds[Math.floor(Math.random() * itemIds.length)]);
						}
					}
					return result;
				};
			} else {
				itemsGenerator = items;
			}
			
			if (UpgradeChange) {
				addNewPromocode(code, balanceAdd, itemsGenerator, false, maxActivations, allowedCollections, allowedRarities, 'toggle_upgrade');
				showToast(`Промокод успешно добавлен! Макс. использований: ${maxActivations === 0 ? '∞' : maxActivations} Может переключать шансы апгрейда!`);
				modal.remove();
				return
			}
			
			addNewPromocode(code, balanceAdd, itemsGenerator, isAdmin, maxActivations, allowedCollections, allowedRarities);
			showToast(`Промокод успешно добавлен! Макс. использований: ${maxActivations === 0 ? '∞' : maxActivations}`);
			modal.remove();
		});
	}
	
	function openAddCollectionModal() {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.display = 'flex';
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100%';
		modal.style.height = '100%';
		modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
		modal.style.zIndex = '1000';
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';
		
		modal.innerHTML = `
			<div class="modal-content" style="background-color: rgb(30 30 30 / 85%); padding: 20px; border-radius: 8px; width: 400px; max-width: 90%;">
				<h3 style="margin-top: 0;">Добавить коллекцию</h3>
				<div class="form-group" style="margin-bottom: 15px;">
					<label style="display: block; margin-bottom: 5px;">ID коллекции:</label>
					<input type="text" id="new-collection-id" style="width: 100%; padding: 8px; background-color: #2a2a2a; border: none; border-radius: 4px; color: white;">
				</div>
				<div class="form-group" style="margin-bottom: 15px;">
					<label style="display: block; margin-bottom: 5px;">Название:</label>
					<input type="text" id="new-collection-name" style="width: 100%; padding: 8px; background-color: #2a2a2a; border: none; border-radius: 4px; color: white;">
				</div>
				<div class="form-group" style="margin-bottom: 15px;">
					<label style="display: block; margin-bottom: 5px;">Ссылка на изображение:</label>
					<input type="text" id="new-collection-image" style="width: 100%; padding: 8px; background-color: #2a2a2a; border: none; border-radius: 4px; color: white;">
				</div>
				<div class="form-actions" style="display: flex; justify-content: space-between;">
					<button id="cancel-add-collection" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Отмена</button>
					<button id="confirm-add-collection" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Добавить</button>
				</div>
			</div>
		`;
		
		document.body.appendChild(modal);
		
		document.getElementById('cancel-add-collection').addEventListener('click', function() {
			modal.remove();
		});
		
		document.getElementById('confirm-add-collection').addEventListener('click', function() {
			const id = document.getElementById('new-collection-id').value.trim();
			const name = document.getElementById('new-collection-name').value.trim();
			const image = document.getElementById('new-collection-image').value.trim();
			
			if (!id || !name || !image) {
				showToast('Заполните все поля!', true);
				return;
			}
			
			if (collectionsDatabase[id]) {
				showToast('Коллекция с таким ID уже существует!', true);
				return;
			}
			
			addNewCollection(id, name, image);
			showToast('Коллекция успешно добавлена!');
			modal.remove();
		});
	}

	function openEditCollectionModal() {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.display = 'flex';
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100%';
		modal.style.height = '100%';
		modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
		modal.style.zIndex = '1000';
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';
		
		modal.innerHTML = `
			<div class="modal-content" style="background-color: rgb(30 30 30 / 85%); padding: 20px; border-radius: 8px; width: 400px; max-width: 90%;">
				<h3 style="margin-top: 0;">Изменить коллекцию</h3>
				<div class="form-group" style="margin-bottom: 15px;">
					<label style="display: block; margin-bottom: 5px;">Коллекция:</label>
					<select id="edit-collection-select" style="width: 100%; padding: 8px; background-color: #2a2a2a; border: none; border-radius: 4px; color: white;">
						<option value="">Выберите коллекцию</option>
						${Object.values(collectionsDatabase).map(collection => `
							<option value="${collection.id}">${collection.name}</option>
						`).join('')}
					</select>
				</div>
				<div class="form-group" style="margin-bottom: 15px;">
					<label style="display: block; margin-bottom: 5px;">Название:</label>
					<input type="text" id="edit-collection-name" style="width: 100%; padding: 8px; background-color: #2a2a2a; border: none; border-radius: 4px; color: white;">
				</div>
				<div class="form-group" style="margin-bottom: 15px;">
					<label style="display: block; margin-bottom: 5px;">Ссылка на изображение:</label>
					<input type="text" id="edit-collection-image" style="width: 100%; padding: 8px; background-color: #2a2a2a; border: none; border-radius: 4px; color: white;">
				</div>
				<div class="form-actions" style="display: flex; justify-content: space-between;">
					<button id="cancel-edit-collection" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Отмена</button>
					<button id="confirm-edit-collection" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Сохранить</button>
				</div>
			</div>
		`;
		
		document.body.appendChild(modal);
		
		document.getElementById('edit-collection-select').addEventListener('change', function() {
			const collectionId = this.value;
			if (!collectionId) return;
			
			const collection = collectionsDatabase[collectionId];
			document.getElementById('edit-collection-name').value = collection.name;
			document.getElementById('edit-collection-image').value = collection.image;
		});
		
		document.getElementById('cancel-edit-collection').addEventListener('click', function() {
			modal.remove();
		});
		
		document.getElementById('confirm-edit-collection').addEventListener('click', function() {
			const collectionId = document.getElementById('edit-collection-select').value;
			const name = document.getElementById('edit-collection-name').value.trim();
			const image = document.getElementById('edit-collection-image').value.trim();
			
			if (!collectionId || !name || !image) {
				showToast('Заполните все поля!', true);
				return;
			}
			
			collectionsDatabase[collectionId].name = name;
			collectionsDatabase[collectionId].image = image;
			
			updateCollectionFilter();
			
			document.querySelectorAll('.item-card').forEach(card => {
				if (card.querySelector('.item-collection').dataset.collection === collectionId) {
					const collection = collectionsDatabase[collectionId];
					const collectionElement = card.querySelector('.item-collection');
					collectionElement.innerHTML = `
						<img src="${collection.image}" class="collection-icon" alt="${collection.name}">
						${collection.name}
					`;
					collectionElement.dataset.collection = collectionId;
				}
			});
			
			showToast('Коллекция успешно обновлена!');
			modal.remove();
		});
	}

	function openEditRarityModal() {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.display = 'flex';
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100%';
		modal.style.height = '100%';
		modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
		modal.style.zIndex = '1000';
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';
		
		modal.innerHTML = `
			<div class="modal-content" style="background-color: rgb(30 30 30 / 85%); padding: 20px; border-radius: 8px; width: 400px; max-width: 90%;">
				<h3 style="margin-top: 0;">Изменить редкость</h3>
				<div class="form-group" style="margin-bottom: 15px;">
					<label style="display: block; margin-bottom: 5px;">Редкость:</label>
					<select id="edit-rarity-select" style="width: 100%; padding: 8px; background-color: #2a2a2a; border: none; border-radius: 4px; color: white;">
						<option value="">Выберите редкость</option>
						${Object.keys(rarities).map(rarity => `
							<option value="${rarity}">${rarities[rarity].name}</option>
						`).join('')}
					</select>
				</div>
				<div class="form-group" style="margin-bottom: 15px;">
					<label style="display: block; margin-bottom: 5px;">Название:</label>
					<input type="text" id="edit-rarity-name" style="width: 100%; padding: 8px; background-color: #2a2a2a; border: none; border-radius: 4px; color: white;">
				</div>
				<div class="form-group" style="margin-bottom: 15px;">
					<label style="display: block; margin-bottom: 5px;">Цвет (hex):</label>
					<input type="color" id="edit-rarity-color" value="#ffffff" style="width: 100%; height: 40px;">
				</div>
				<div class="form-group" style="margin-bottom: 15px;">
					<label style="display: block; margin-bottom: 5px;">Порядок:</label>
					<input type="number" id="edit-rarity-order" min="1" value="1" style="width: 100%; padding: 8px; background-color: #2a2a2a; border: none; border-radius: 4px; color: white;">
				</div>
				<div class="form-actions" style="display: flex; justify-content: space-between;">
					<button id="cancel-edit-rarity" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Отмена</button>
					<button id="confirm-edit-rarity" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Сохранить</button>
				</div>
			</div>
		`;
		
		document.body.appendChild(modal);
		
		document.getElementById('edit-rarity-select').addEventListener('change', function() {
			const rarityId = this.value;
			if (!rarityId) return;
			
			const rarity = rarities[rarityId];
			document.getElementById('edit-rarity-name').value = rarity.name;
			document.getElementById('edit-rarity-color').value = rarity.colorHex || '#ffffff';
			document.getElementById('edit-rarity-order').value = rarity.order;
		});
		
		document.getElementById('cancel-edit-rarity').addEventListener('click', function() {
			modal.remove();
		});
		
		document.getElementById('confirm-edit-rarity').addEventListener('click', function() {
			const rarityId = document.getElementById('edit-rarity-select').value;
			const name = document.getElementById('edit-rarity-name').value.trim();
			const color = document.getElementById('edit-rarity-color').value;
			const order = parseInt(document.getElementById('edit-rarity-order').value);
			
			if (!rarityId || !name || !order) {
				showToast('Заполните все обязательные поля!', true);
				return;
			}
			
			rarities[rarityId].name = name;
			rarities[rarityId].colorHex = color;
			rarities[rarityId].order = order;
			
			const rarityBtn = document.querySelector(`.filter-btn[data-rarity="${rarityId}"]`);
			if (rarityBtn) {
				rarityBtn.textContent = name;
				rarityBtn.style.backgroundColor = color;
				rarityBtn.style.color = getContrastColor(color);
			}
			
			document.querySelectorAll(`.item-card[data-rarity="${rarityId}"] .item-rarity`).forEach(el => {
				el.textContent = name;
				el.className = `item-rarity ${rarityId}`;
			});
			
			showToast('Редкость успешно обновлена!');
			modal.remove();
		});
	}

	function addNewCollection(id, name, image) {
		collectionsDatabase[id] = { id, name, image };
		updateCollectionFilter();
		updateCollectionSelect('new-item-collection');
		updateCollectionSelect('edit-item-collection');
		
		const style = document.createElement('style');
		style.innerHTML = `
			.collection-icon-${id} {
				content: url(${image});
				width: 20px;
				height: 20px;
				vertical-align: middle;
				margin-right: 5px;
			}
		`;
		document.head.appendChild(style);
	}

	function updateCollectionFilter() {
		const filter = document.getElementById('collection-filter');
		const currentValue = filter.value; // Сохраняем текущее значение
		
		filter.innerHTML = '<option value="all">Все коллекцииㅤㅤㅤㅤㅤ</option>';
		
		Object.values(collectionsDatabase).forEach(collection => {
			filter.innerHTML += `
				<option value="${collection.id}">${collection.name}</option>
			`;
		});
		
		if (currentValue && Array.from(filter.options).some(opt => opt.value === currentValue)) {
			filter.value = currentValue;
		}
	}
	
	function applyItem(index) {
		const itemToApply = inventory[index];
		if (!itemToApply) return;
		
		const originalItem = itemsDatabase.find(item => item.id === itemToApply.id);
		if (!originalItem) return;
		
		if (originalItem.isItemWithoutSlot) {
			showToast('Этот предмет не поддерживает применение стикеров/брелков', true);
			return;
		}
		
		const applyModal = document.createElement('div');
		applyModal.className = 'apply-modal';
		applyModal.style.display = 'flex';
		applyModal.style.position = 'fixed';
		applyModal.style.top = '0';
		applyModal.style.left = '0';
		applyModal.style.width = '100%';
		applyModal.style.height = '100%';
		applyModal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
		applyModal.style.zIndex = '20000';
		applyModal.style.justifyContent = 'center';
		applyModal.style.alignItems = 'center';
		applyModal.style.flexDirection = 'column';
		
		applyModal.innerHTML = `
			<div class="apply-content" style="background-color: rgb(30 30 30 / 85%); padding: 20px; border-radius: 8px; width: 80%; max-width: 800px; text-align: center;">
				<h2>Выберите предмет для применения ${itemToApply.name}</h2>
				<div class="apply-items-container" style="display: flex; flex-wrap: wrap; gap: 15px; max-height: 60vh; overflow-y: auto; margin: 20px 0;">
					${inventory.map((item, idx) => {
						const dbItem = itemsDatabase.find(db => db.id === item?.id);
						if (idx === index || dbItem?.isCase || dbItem?.isCharm || dbItem?.isSticker || 
							dbItem?.isItemWithoutSlot || item.isRental) return '';
						
						const appliedStickers = item.stickers ? item.stickers.map((sticker, stickerIndex) => 
							`<img src="${sticker.image}" width="20" title="${sticker.name}" 
							 style="border-radius: 3px; margin: 2px; cursor: pointer;" 
							 data-item-index="${idx}" data-sticker-index="${stickerIndex}"
							 onmouseover="showStickerReplaceHint(this)" 
							 onmouseout="hideStickerReplaceHint(this)">`
						).join('') : '';
						
						const charmElement = item.charm ? `
							<div style="margin-top: 5px; border-top: 1px solid #444; padding-top: 5px; position: relative;">
								<div style="font-size: 10px; color: #aaa; margin-bottom: 3px;">Брелок:</div>
								<img src="${item.charm.image}" width="20" title="${item.charm.name}" 
									 style="border-radius: 3px; cursor: pointer;"
									 onmouseover="showCharmRemoveHint(this)" 
									 onmouseout="hideCharmRemoveHint(this)"
									 data-item-index="${idx}">
							</div>
						` : '';
						
						return `
							<div class="apply-item" data-index="${idx}" style="background-color: #2a2a2a; padding: 10px; border-radius: 6px; width: 120px; text-align: center; cursor: pointer;">
								<img src="${item.image}" width="80">
								<div>${item.name}</div>
								${item.stickers && item.stickers.length > 0 ? `
									<div style="margin-top: 5px; border-top: 1px solid #444; padding-top: 5px;">
										<div style="font-size: 10px; color: #aaa; margin-bottom: 3px;">Стикеры:</div>
										<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 2px;">
											${appliedStickers}
										</div>
									</div>
								` : ''}
								${charmElement}
							</div>
						`;
					}).join('')}
				</div>
				<button class="cancel-apply-btn" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Отмена</button>
			</div>
		`;
		
		document.body.appendChild(applyModal);
		
		window.showStickerReplaceHint = function(element) {
			if (originalItem.isSticker) {
				element.style.border = '2px solid gold';
				element.title = 'Кликните для замены стикера';
			}
		};
		
		window.hideStickerReplaceHint = function(element) {
			if (originalItem.isSticker) {
				element.style.border = '';
				element.title = element.getAttribute('data-original-title') || '';
			}
		};
		
		window.showCharmRemoveHint = function(element) {
			element.style.border = '2px solid red';
			element.title = 'Кликните чтобы снять брелок';
		};
		
		window.hideCharmRemoveHint = function(element) {
			element.style.border = '';
			element.title = element.getAttribute('data-original-title') || '';
		};
		
		applyModal.querySelectorAll('.apply-item').forEach(el => {
			el.addEventListener('click', function(e) {
				if (e.target.classList.contains('sticker-replace') || e.target.hasAttribute('data-item-index')) return;
				
				const targetIndex = parseInt(this.getAttribute('data-index'));
				const targetItem = inventory[targetIndex];
				
				if (originalItem.isCharm) {
					if (!targetItem.charm) {
						targetItem.charm = {
							id: itemToApply.id,
							name: itemToApply.name,
							image: itemToApply.image
						};
						inventory.splice(index, 1);
						showToast(`Брелок "${itemToApply.name}" применен`);
					} else {
						showToast('На этом предмете уже есть брелок', true);
					}
				} else if (originalItem.isSticker) {
					if (!targetItem.stickers) targetItem.stickers = [];
					if (targetItem.stickers.length < 4) {
						targetItem.stickers.push({
							id: itemToApply.id,
							name: itemToApply.name,
							image: itemToApply.image
						});
						inventory.splice(index, 1);
						showToast(`Стикер "${itemToApply.name}" применен`);
					} else {
						showToast('Все слоты для стикеров заняты', true);
					}
				}
				
				updateInventory();
				applyModal.remove();
			});
		});
		
		applyModal.querySelectorAll('img[data-item-index][data-sticker-index]').forEach(img => {
			img.addEventListener('click', function(e) {
				if (!originalItem.isSticker) return;
				
				e.stopPropagation();
				
				const targetItemIndex = parseInt(this.getAttribute('data-item-index'));
				const stickerIndex = parseInt(this.getAttribute('data-sticker-index'));
				const targetItem = inventory[targetItemIndex];
				
				const confirmModal = document.createElement('div');
				confirmModal.className = 'confirm-modal';
				confirmModal.style.cssText = `
					position: fixed;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					background-color: rgb(30 30 30 / 85%);
					padding: 20px;
					border-radius: 8px;
					z-index: 20001;
					text-align: center;
				`;
				
				confirmModal.innerHTML = `
					<h3>Подтверждение замены</h3>
					<p>Вы хотите заменить ${targetItem.stickers[stickerIndex].name} на ${itemToApply.name}?</p>
					<div style="display: flex; justify-content: center; gap: 10px; margin-top: 20px;">
						<button class="confirm-replace-btn" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Да</button>
						<button class="cancel-replace-btn" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Нет</button>
					</div>
				`;
				
				document.body.appendChild(confirmModal);
				
				confirmModal.querySelector('.confirm-replace-btn').addEventListener('click', function() {
					const oldSticker = targetItem.stickers[stickerIndex];
					targetItem.stickers[stickerIndex] = {
						id: itemToApply.id,
						name: itemToApply.name,
						image: itemToApply.image
					};
					
					inventory.push({
						id: oldSticker.id,
						name: oldSticker.name,
						rarity: itemsDatabase.find(i => i.id === oldSticker.id)?.rarity || 'none',
						image: oldSticker.image
					});
					
					inventory.splice(index, 1);
					
					showToast(`Стикер заменен на "${itemToApply.name}"`);
					updateInventory();
					applyModal.remove();
					confirmModal.remove();
				});
				
				confirmModal.querySelector('.cancel-replace-btn').addEventListener('click', function() {
					confirmModal.remove();
				});
			});
		});
		
		applyModal.querySelectorAll('img[data-item-index]:not([data-sticker-index])').forEach(img => {
			img.addEventListener('click', function(e) {
				e.stopPropagation();
				
				const targetItemIndex = parseInt(this.getAttribute('data-item-index'));
				const targetItem = inventory[targetItemIndex];
				
				const confirmModal = document.createElement('div');
				confirmModal.className = 'confirm-modal';
				confirmModal.style.cssText = `
					position: fixed;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					background-color: rgb(30 30 30 / 85%);
					padding: 20px;
					border-radius: 8px;
					z-index: 20001;
					text-align: center;
				`;
				
				confirmModal.innerHTML = `
					<h3>Подтверждение снятия</h3>
					<p>Вы хотите снять ${targetItem.charm.name}?</p>
					<div style="display: flex; justify-content: center; gap: 10px; margin-top: 20px;">
						<button class="confirm-remove-btn" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Да</button>
						<button class="cancel-remove-btn" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Нет</button>
					</div>
				`;
				
				document.body.appendChild(confirmModal);
				
				confirmModal.querySelector('.confirm-remove-btn').addEventListener('click', function() {
					inventory.push({
						id: targetItem.charm.id,
						name: targetItem.charm.name,
						rarity: itemsDatabase.find(i => i.id === targetItem.charm.id)?.rarity || 'none',
						image: targetItem.charm.image
					});
					
					delete targetItem.charm;
					
					showToast(`Брелок снят`);
					updateInventory();
					applyModal.remove();
					confirmModal.remove();
				});
				
				confirmModal.querySelector('.cancel-remove-btn').addEventListener('click', function() {
					confirmModal.remove();
				});
			});
		});
		
		applyModal.querySelector('.cancel-apply-btn').addEventListener('click', function() {
			applyModal.remove();
		});
	}
	
	function getRarityColor(rarity) {
		if (rarities[rarity] && rarities[rarity].colorHex) {
			return rarities[rarity].colorHex;
		}
		
		return '#ffffff';
	}
	
	const caseModal = document.createElement('div');
	caseModal.className = 'case-modal';
	caseModal.style.display = 'none';
	caseModal.style.position = 'fixed';
	caseModal.style.top = '0';
	caseModal.style.left = '0';
	caseModal.style.width = '100%';
	caseModal.style.height = '100%';
	caseModal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
	caseModal.style.zIndex = '20000';
	caseModal.style.justifyContent = 'center';
	caseModal.style.alignItems = 'center';
	caseModal.style.flexDirection = 'column';
	document.body.appendChild(caseModal);

	function openCase(index) {
		const caseItem = inventory[index];
		const caseData = itemsDatabase.find(item => item.id === caseItem.id);
		
		if (!caseData || !caseData.contains) {
			showToast('Ошибка: данные кейса не найдены', true);
			return;
		}
		
		let lastSelectedItemId = null;
		
		caseModal.innerHTML = `
			<div class="case-content" style="background-color: rgb(30 30 30 / 85%); padding: 20px; border-radius: 8px; width: 80%; max-width: 800px; text-align: center;">
				<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
					<h2 style="margin: 0;">${caseItem.name}</h2>
					<button class="case-close-btn" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; margin-left: 10px;">×</button>
				</div>
				
				<!-- Блок выпадения -->
				<div class="case-drop-container" style="width: 100%; height: 150px; background-color: #2a2a2a; border-radius: 8px; margin: 20px 0; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
					<div class="case-drop-center-line" style="position: absolute; left: 50%; transform: translateX(-50%); width: 2px; height: 100%; background-color: gold; z-index: 1;"></div>
					<div class="case-drop-items" style="display: flex; gap: 10px; padding: 10px; position: relative;">
						<!-- Предметы будут добавляться динамически при открытии -->
					</div>
				</div>
				
				<!-- Кнопки открытия -->
				<div style="display: flex; gap: 10px; justify-content: center; margin: 20px 0;">
					<button class="open-case-start-btn" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">Открыть кейс</button>
					<button class="skip-animation-btn" style="padding: 10px 20px; background-color: #555555; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">➤</button>
				</div>
				
				<!-- Кнопка информации о шансах -->
				<div style="margin: 10px 0;">
					<button class="case-help-btn" style="background: none; border: none; color: #aaa; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 5px; margin: 0 auto;">
						<span style="background: #555; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">i</span>
						Шансы выпадения
					</button>
				</div>
				
				<!-- Блок содержимого кейса -->
				<div class="case-contents-container" style="width: 100%; max-height: 300px; overflow-y: auto; margin-top: 20px;">
					<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; padding: 10px;">
						${getSortedCaseContents(caseData).map(item => {
							const rarity = rarities[item.rarity];
							return `
								<div class="case-content-item" data-id="${item.id}" style="background-color: #2a2a2a; padding: 10px; border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.3s; position: relative;">
									<div style="position: relative; display: inline-block;">
										<img src="${item.image}" alt="${item.name}" width="60" style="border-radius: 5px;">
										${item.isRental ? `<img src="images/item_time_limited.png" alt="Арендовано" style="position: absolute; top: 0; left: 0; width: 60px; height: auto; pointer-events: none;">` : ''}
									</div>
									
									<div class="case-item-rarity ${rarity.color}" style="padding: 2px 5px; border-radius: 4px; margin-top: 5px; font-size: 10px;">
									<div class="case-item-name" style="display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; font-size: 12px; margin-top: 5px; height: auto; text-overflow: ellipsis;">${item.name}</div></div>
									<div class="case-item-selected" style="color: gold; font-size: 10px; margin-top: 3px; display: none;">Бустится</div>
								</div>
							`;
						}).join('')}
					</div>
				</div>
			</div>
			
			<!-- Модальное окно с шансами -->
			<div class="case-help-modal" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: rgb(30 30 30 / 95%); padding: 20px; border-radius: 8px; z-index: 20001; width: 300px;">
				<h3 style="margin-top: 0;">Шансы выпадения</h3>
				${Object.entries(caseData.dropChances).map(([rarity, chance]) => {
					const rarityInfo = rarities[rarity];
					return `
						<div style="margin-bottom: 10px; display: flex; justify-content: space-between;">
							<span style="color: ${rarityInfo.colorHex};">${rarityInfo.name}</span>
							<span>${chance}%</span>
						</div>
					`;
				}).join('')}
				<button class="close-case-help-btn" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px; width: 100%;">Закрыть</button>
			</div>
		`;

		function getSortedCaseContents(caseData) {
			const items = [];
			const addedIds = new Set();
			
			caseData.contains.forEach(itemId => {
				if (!addedIds.has(itemId)) {
					const item = itemsDatabase.find(i => i.id === itemId);
					if (item) {
						items.push(item);
						addedIds.add(itemId);
					}
				}
			});
			
			return items.sort((a, b) => {
				const orderA = rarities[a.rarity]?.order || 0;
				const orderB = rarities[b.rarity]?.order || 0;
				
				if (orderA !== orderB) {
					return orderA - orderB;
				}
				
				return a.name.localeCompare(b.name);
			});
		}

		caseModal.querySelectorAll('.case-content-item').forEach(itemElement => {
			itemElement.addEventListener('click', function() {
				const itemId = this.getAttribute('data-id');
				
				if (lastSelectedItemId === itemId) {
					this.style.boxShadow = 'none';
					this.style.border = 'none';
					this.querySelector('.case-item-selected').style.display = 'none';
					lastSelectedItemId = null;
					return;
				}
				
				caseModal.querySelectorAll('.case-content-item').forEach(el => {
					el.style.boxShadow = 'none';
					el.style.border = 'none';
					el.querySelector('.case-item-selected').style.display = 'none';
				});
				
				this.style.boxShadow = '0 0 10px gold';
				this.style.border = '2px solid gold';
				this.querySelector('.case-item-selected').style.display = 'block';
				
				lastSelectedItemId = itemId;
			});
		});

		const closeBtn = caseModal.querySelector('.case-close-btn');
		closeBtn.addEventListener('click', function() {
			if (!isCaseOpening) {
				caseModal.style.display = 'none';
			}
		});
		
		caseModal.style.display = 'flex';
		
		caseModal.querySelector('.case-help-btn').addEventListener('click', function() {
			caseModal.querySelector('.case-help-modal').style.display = 'block';
		});
		
		caseModal.querySelector('.close-case-help-btn').addEventListener('click', function() {
			caseModal.querySelector('.case-help-modal').style.display = 'none';
		});
		
		caseModal.querySelector('.open-case-start-btn').addEventListener('click', function() {
			if (!isCaseOpening) {
				openCaseWithAnimation(index, caseData, lastSelectedItemId);
			}
		});
		
		caseModal.querySelector('.skip-animation-btn').addEventListener('click', function() {
			if (!isCaseOpening) {
				openCaseWithoutAnimation(index, caseData, lastSelectedItemId);
			}
		});
		
		saveGameState();
	}

	function createWeightedItemsList(caseData, boostedItemId = null) {
		const weightedItems = [];
		
		caseData.contains.forEach(itemId => {
			const item = itemsDatabase.find(i => i.id === itemId);
			if (item) {
				const baseChance = caseData.dropChances[item.rarity] || 0;
				const boostedChance = itemId === boostedItemId ? baseChance * 50 : baseChance;
				
				for (let i = 0; i < boostedChance; i++) {
					weightedItems.push(itemId);
				}
			}
		});
		
		for (let i = weightedItems.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[weightedItems[i], weightedItems[j]] = [weightedItems[j], weightedItems[i]];
		}
		
		return weightedItems;
	}

	function populateDropContainer(caseData, boostedItemId = null, resultItemId = null) {
		const dropContainer = caseModal.querySelector('.case-drop-items');
		const weightedItems = createWeightedItemsList(caseData, boostedItemId);
		
		dropContainer.innerHTML = '';
		
		if (!resultItemId) {
			resultItemId = weightedItems[Math.floor(Math.random() * weightedItems.length)];
		}
		
		let resultIndex = weightedItems.indexOf(resultItemId);
		if (resultIndex === -1) resultIndex = 0;
		
		const displayItems = [];
		const totalItems = weightedItems.length;
		
		for (let i = 0; i < 40; i++) {
			const index = (resultIndex - 40 + i + totalItems) % totalItems;
			displayItems.push(weightedItems[index]);
		}
		
		displayItems.push(resultItemId);
		
		for (let i = 0; i < 9; i++) {
			const index = (resultIndex + i + 1) % totalItems;
			displayItems.push(weightedItems[index]);
		}
		
		displayItems.forEach((itemId, index) => {
			const item = itemsDatabase.find(i => i.id === itemId);
			if (item) {
				const rarity = rarities[item.rarity];
				const isResultItem = index === 40; // 40-й элемент - это результат
				
				const itemElement = document.createElement('div');
				itemElement.className = 'drop-item';
				itemElement.setAttribute('data-item-id', itemId);
				itemElement.style.cssText = `
					width: 206px;
					background-color: #2a2a2a;
					padding: 8px;
					border-radius: 6px;
					text-align: center;
					transition: all 0.3s;
					flex-shrink: 0;
				`;
				itemElement.innerHTML = `
					<div style="position: relative; display: inline-block;">
						<img src="${item.image}" alt="${item.name}" width="140" style="border-radius: 0px;">
						${item.isRental ? `<img src="images/item_time_limited.png" alt="Арендовано" style="position: absolute; top: 0; left: 0; width: 80px; height: auto; pointer-events: none;">` : ''}
					</div>
					<div class="${rarity.color}" style="width: 200px; padding: 2px 4px; border-radius: 3px; margin-top: 2px; font-size: 12px;">
						<div style="text-align: left; transform: translateX(2px); font-size: 14px; margin-top: 3px; height: 25px; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
					</div>
				`;
				dropContainer.appendChild(itemElement);
			}
		});
		
		/*
		<img src="${item.image}" alt="${item.name}" width="150" style="border-radius: 0px;">
		<div class="${rarity.color}" style="transform: translate(28px, -5px);width: 142px;padding: 2px 4px;border-radius: 0px;margin-top: 2px;font-size: 12px;">
			<div style="text-align: left;transform: translateX(2px);font-size: 14px;margin-top: 3px;height: 25px;overflow: hidden;text-overflow: ellipsis;">${item.name}</div>
		</div>
		*/
		
		return resultItemId;
	}

	function openCaseWithAnimation(index, caseData, boostedItemId = null) {
		if (isCaseOpening) return; // Защита от повторного вызова
		isCaseOpening = true;
		
		const openBtn = caseModal.querySelector('.open-case-start-btn');
		const skipBtn = caseModal.querySelector('.skip-animation-btn');
		const closeBtn = caseModal.querySelector('.case-close-btn');
		
		openBtn.disabled = true;
		skipBtn.disabled = true;
		closeBtn.disabled = true;
		openBtn.textContent = 'Открывается...';
		openBtn.style.backgroundColor = '#666';
		
		const dropContainer = caseModal.querySelector('.case-drop-container');
		const dropItems = caseModal.querySelector('.case-drop-items');
		
		const resultItemId = populateDropContainer(caseData, boostedItemId);
		const resultItem = itemsDatabase.find(i => i.id === resultItemId);
		
		const itemWidth = 80 + 10; // width + gap
		const targetPosition = 40 * itemWidth; // 40-й предмет должен оказаться по центру
		
		dropItems.style.transition = 'none';
		dropItems.style.transform = 'translateX(0)';
		
		setTimeout(() => {
			dropItems.style.transition = 'transform 3.5s cubic-bezier(0.1, 0.8, 0.2, 1)';
			dropItems.style.transform = `translateX(-${targetPosition}px)`;
			
			setTimeout(() => {
				// Передаем false, чтобы использовать стандартную логику (осмотр если возможно)
				showCaseResultViewer(index, resultItem, false);
			}, 3500);
		}, 100);
	}

	function openCaseWithoutAnimation(index, caseData, boostedItemId = null) {
		if (isCaseOpening) return; // Защита от повторного вызова
		isCaseOpening = true;
		
		const resultItemId = populateDropContainer(caseData, boostedItemId);
		const resultItem = itemsDatabase.find(i => i.id === resultItemId);
		
		setTimeout(() => {
			// Передаем false, чтобы использовать стандартную логику
			showCaseResultViewer(index, resultItem, true);
		}, 100);
	}
	
	function showCaseResultViewer(index, item, skipViewer = false) {
		const isRental = item.isRental || false;
		const rentalDuration = 3 * 60 * 1000; // 3 минуты в миллисекундах
		
		const resultItem = {
			id: item.id,
			name: item.name,
			rarity: item.rarity,
			image: item.image
		};
		
		if (isRental) {
			resultItem.isRental = true;
			resultItem.rentalExpires = Date.now() + rentalDuration;
			resultItem.originalItemId = item.originalItemId || item.id;
		}
		inventory[index] = resultItem;
		
		// Проверяем, можно ли открыть 3D-осмотр, только если не установлен флаг пропуска
		let canShow3D = false;
		if (!skipViewer) {
			canShow3D = fxCan3D(item);
		}
		
		if (canShow3D) {
			// Открываем 3D-осмотр
			const tempContainer = document.createElement('div');
			document.body.appendChild(tempContainer);
			setup3DViewer(tempContainer, resultItem, item);
			tempContainer.click();
			document.body.removeChild(tempContainer);
			
			// Закрываем модалку кейса
			if (caseModal) {
				caseModal.style.display = 'none';
			}
			
			// Сбрасываем флаг сразу, т.к. новая вкладка открылась
			isCaseOpening = false;
		} else {
			// Показываем старое модальное окно
			const rarityInfo = (typeof rarities !== 'undefined' && rarities[item.rarity]) 
				? rarities[item.rarity] 
				: { color: 'gray', name: item.rarity };
			
			caseModal.innerHTML = `
				<div class="case-result" style="background-color: rgb(30 30 30 / 85%); padding: 30px; border-radius: 8px; text-align: center; max-width: 500px;">
					<h2>Вы получили:</h2>
					<div style="margin: 20px 0;">
						<img src="${item.image}" alt="${item.name}" width="150">
						<div style="font-size: 20px; margin: 10px 0;">${item.name}</div>
						<div class="case-item-rarity ${rarityInfo.color}" style="padding: 5px 10px; border-radius: 4px; display: inline-block; font-weight: bold;">
							${rarityInfo.name}
						</div>
						${isRental ? `
							<div style="margin-top: 10px; color: #ffa500; font-size: 14px;">
								🕒 Арендованный предмет (3 минуты)
							</div>
						` : ''}
					</div>
					<button class="close-case-result-btn" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
						Закрыть
					</button>
				</div>
			`;
			
			caseModal.style.display = 'flex';
			
			// Сбрасываем флаг ТОЛЬКО после закрытия результата
			caseModal.querySelector('.close-case-result-btn').addEventListener('click', function() {
				caseModal.style.display = 'none';
				isCaseOpening = false; // Разрешаем открывать следующий кейс
			});
		}
		
		addExp(3000);
		saveGameState();
		updateInventory();
	}

	function showCaseResult(items) {
		const itemsArray = Array.isArray(items) ? items : [items];
		const grouped = new Map();
		itemsArray.forEach(item => {
			const key = item.id;
			if (!grouped.has(key)) {
				grouped.set(key, { item: item, count: 0, isRental: item.isRental || false });
			}
			grouped.get(key).count++;
		});
		const rarityOrder = ['covert', 'classified', 'restricted', 'milspec', 'industrial', 'consumer', 'none', 'none-rarity'];
		const groupedArray = Array.from(grouped.values()).sort((a, b) => {
			const rA = rarityOrder.indexOf(a.item.rarity);
			const rB = rarityOrder.indexOf(b.item.rarity);
			const orderA = rA === -1 ? 999 : rA;
			const orderB = rB === -1 ? 999 : rB;
			return orderA - orderB;
		});
		let itemsHtml = '';
		groupedArray.forEach(entry => {
			const item = entry.item;
			const count = entry.count;
			const rarityInfo = (typeof rarities !== 'undefined' && rarities[item.rarity]) 
				? rarities[item.rarity] 
				: { color: 'gray', name: item.rarity };
			
			const countBadge = count > 1 
				? `<span style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.75); color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: bold;">x${count}</span>`
				: '';
			
			const rentalBadge = entry.isRental 
				? `<div style="margin-top: 5px; color: #ffa500; font-size: 11px;">🕒 Аренда (3 мин)</div>`
				: '';
			
			itemsHtml += `
				<div style="
					position: relative;
					background: rgba(50, 50, 50, 0.9);
					border: 1px solid ${rarityInfo.color || '#555'};
					border-radius: 8px;
					padding: 10px;
					display: flex;
					flex-direction: column;
					align-items: center;
					min-width: 120px;
					max-width: 140px;
					box-shadow: 0 2px 6px rgba(0,0,0,0.4);
				">
					${countBadge}
					<img src="${item.image}" alt="${item.name}" style="width: 90px; height: 90px; object-fit: contain; margin-bottom: 8px;">
					<div style="
						font-size: 12px;
						color: ${rarityInfo.color || '#ccc'};
						font-weight: bold;
						text-align: center;
						margin-bottom: 4px;
						word-break: break-word;
						line-height: 1.2;
						min-height: 30px;
						display: flex;
						align-items: center;
					">${item.name}</div>
					<div style="
						font-size: 10px;
						padding: 2px 6px;
						border-radius: 3px;
						background: ${rarityInfo.color || '#555'};
						color: white;
						font-weight: bold;
					">${rarityInfo.name || item.rarity}</div>
					${rentalBadge}
				</div>
			`;
		});
	
		const resultModal = document.createElement('div');
		resultModal.id = 'case-result-modal';
		resultModal.style.cssText = `
			position: fixed; top: 0; left: 0; width: 100%; height: 100%;
			background: rgba(0,0,0,0.85); z-index: 36000;
			display: flex; justify-content: center; align-items: center;
			font-family: sans-serif; color: white;
		`;
		
		resultModal.innerHTML = `
			<div style="
				background-color: rgb(30 30 30 / 95%);
				padding: 25px;
				border-radius: 10px;
				text-align: center;
				max-width: 90%;
				max-height: 85vh;
				width: 900px;
				display: flex;
				flex-direction: column;
				box-shadow: 0 8px 30px rgba(0,0,0,0.6);
			">
				<h2 style="margin: 0 0 15px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
					Вы получили ${itemsArray.length} ${itemsArray.length === 1 ? 'предмет' : (itemsArray.length < 5 ? 'предмета' : 'предметов')}:
				</h2>
				<div style="
					overflow-y: auto;
					flex: 1;
					padding: 10px;
					background: rgba(0,0,0,0.3);
					border-radius: 6px;
					margin-bottom: 15px;
				">
					<div style="
						display: grid;
						grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
						gap: 10px;
						justify-items: center;
					">
						${itemsHtml}
					</div>
				</div>
				<button id="close-case-result-btn" style="
					padding: 10px 30px;
					background-color: #4CAF50;
					color: white;
					border: none;
					border-radius: 4px;
					cursor: pointer;
					font-size: 16px;
					font-weight: bold;
					transition: background-color 0.2s;
				">Закрыть</button>
			</div>
		`;
		
		document.body.appendChild(resultModal);
		const closeBtn = resultModal.querySelector('#close-case-result-btn');
		closeBtn.onmouseenter = function() { this.style.backgroundColor = '#45a049'; };
		closeBtn.onmouseleave = function() { this.style.backgroundColor = '#4CAF50'; };
		
		closeBtn.addEventListener('click', function() {
			resultModal.style.display = 'none';
			if (resultModal.parentNode) {
				resultModal.parentNode.removeChild(resultModal);
			}
		});
		resultModal.addEventListener('click', function(e) {
			if (e.target === resultModal) {
				closeBtn.click();
			}
		});
	}

	function showCraftResult(item) {
		const canShow3D = fxCan3D(item);

		if (canShow3D) {
			const tempContainer = document.createElement('div');
			document.body.appendChild(tempContainer);
			setup3DViewer(tempContainer, item, item);
			tempContainer.click();
			document.body.removeChild(tempContainer);
			updateInventory();
			saveGameState();
			
		} else {
			const craftModal = document.createElement('div');
			craftModal.className = 'craft-modal';
			craftModal.style.display = 'flex';
			craftModal.style.position = 'fixed';
			craftModal.style.top = '0';
			craftModal.style.left = '0';
			craftModal.style.width = '100%';
			craftModal.style.height = '100%';
			craftModal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
			craftModal.style.zIndex = '20000';
			craftModal.style.justifyContent = 'center';
			craftModal.style.alignItems = 'center';
			craftModal.style.flexDirection = 'column';
			
			const rarityInfo = (typeof rarities !== 'undefined' && rarities[item.rarity]) 
				? rarities[item.rarity] 
				: { color: 'gray', name: item.rarity };

			const collectionName = (typeof collectionsDatabase !== 'undefined' && collectionsDatabase[item.collection]) 
				? collectionsDatabase[item.collection].name 
				: (item.collection || '');

			craftModal.innerHTML = `
				<div class="craft-result" style="background-color: rgb(30 30 30 / 85%); padding: 30px; border-radius: 8px; text-align: center; max-width: 500px;">
					<h2>Вы получили:</h2>
					<div style="margin: 20px 0;">
						<img src="${item.image}" alt="${item.name}" width="150">
						<div style="font-size: 20px; margin: 10px 0;">${item.name}</div>
						<div class="craft-item-rarity ${rarityInfo.color}" style="padding: 5px 10px; border-radius: 4px; display: inline-block; font-weight: bold;">
							${rarityInfo.name}
						</div>
						<div class="craft-item-collection" style="margin-top: 10px; color: #aaa;">
							${collectionName}
						</div>
					</div>
					<button class="close-craft-result-btn" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
						Закрыть
					</button>
				</div>
			`;
			
			document.body.appendChild(craftModal);
			craftModal.querySelector('.close-craft-result-btn').addEventListener('click', function() {
				craftModal.remove();
				updateInventory();
				saveGameState();
			});
		}
	}
	
	const typeFilterButton = document.createElement('button');
	typeFilterButton.textContent = 'Фильтр типов';
	typeFilterButton.style.cssText = `
		padding: 8px 12px;
		background-color: #414141;
		color: #b1b1b1;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		margin-bottom: 15px;
		font-size: 14px;
	`;

	const typeFilterModal = document.createElement('div');
	typeFilterModal.id = 'type-filter-modal';
	typeFilterModal.style.cssText = `
		display: none;
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.6);
		z-index: 1000;
		justify-content: center;
		align-items: flex-start;
		padding-top: 60px;
	`;

	const modalContent = document.createElement('div');
	modalContent.style.cssText = `
		transform: translatey(200px);
		background: #222;
		color: #b1b1b1;
		padding: 20px;
		border-radius: 8px;
		max-width: 320px;
		width: 90%;
		max-height: 70vh;
		overflow-y: auto;
		box-shadow: 0 4px 12px rgba(0,0,0,0.5);
		font-size: 14px;
	`;

	modalContent.innerHTML = `
		<style>
			.type-checkbox {
				appearance: none;
				width: 18px;
				height: 18px;
				border: 2px solid #555;
				border-radius: 4px;
				background: #2a2a2a;
				position: relative;
				cursor: pointer;
				transition: all 0.2s;
			}
			.type-checkbox:checked {
				background: #4CAF50;
				border-color: #4CAF50;
			}
			.type-checkbox:checked::after {
				content: " ";
				color: #4CAF50;
				font-size: 14px;
				position: absolute;
				top: -1px;
				left: 3px;
				font-weight: bold;
			}
		</style>
		<h3 style="margin-top: 0; margin-bottom: 14px; font-size: 18px;">Тип предмета</h3>
		<label style="display: flex; align-items: center; margin: 8px 0; gap: 10px;">
			<input type="checkbox" class="type-checkbox" data-type="all" checked /> Все
		</label>
		<label style="display: flex; align-items: center; margin: 8px 0; gap: 10px;">
			<input type="checkbox" class="type-checkbox" data-type="weapons" checked /> Weapons (со слотами)
		</label>
		<label style="display: flex; align-items: center; margin: 8px 0; gap: 10px;">
			<input type="checkbox" class="type-checkbox" data-type="st_weapons" checked /> StatTrack Weapons
		</label>
		<label style="display: flex; align-items: center; margin: 8px 0; gap: 10px;">
			<input type="checkbox" class="type-checkbox" data-type="items" checked /> Items (без слотов)
		</label>
		<label style="display: flex; align-items: center; margin: 8px 0; gap: 10px;">
			<input type="checkbox" class="type-checkbox" data-type="stickers" checked /> Stickers (наклейки)
		</label>
		<label style="display: flex; align-items: center; margin: 8px 0; gap: 10px;">
			<input type="checkbox" class="type-checkbox" data-type="charms" checked /> Charms (брелки)
		</label>
		<label style="display: flex; align-items: center; margin: 8px 0; gap: 10px;">
			<input type="checkbox" class="type-checkbox" data-type="medals" checked /> Medals (медали)
		</label>
		<label style="display: flex; align-items: center; margin: 8px 0; gap: 10px;">
			<input type="checkbox" class="type-checkbox" data-type="graffiti" checked /> Graffiti (граффити)
		</label>
		<label style="display: flex; align-items: center; margin: 8px 0; gap: 10px;">
			<input type="checkbox" class="type-checkbox" data-type="fragments" checked /> Fragments (Фрагменты)
		</label>
		<label style="display: flex; align-items: center; margin: 8px 0; gap: 10px;">
			<input type="checkbox" class="type-checkbox" data-type="agents" checked /> Agents (Агенты)
		</label>
		<label style="display: flex; align-items: center; margin: 8px 0; gap: 10px;">
			<input type="checkbox" class="type-checkbox" data-type="cases" checked /> Cases (кейсы и боксы)
		</label>
	`;

	typeFilterModal.appendChild(modalContent);
	document.body.appendChild(typeFilterModal);
	document.querySelector('.sort-container').insertAdjacentElement('afterend', typeFilterButton);

	typeFilterButton.addEventListener('click', (e) => {
		e.stopPropagation();
		typeFilterModal.style.display = 'flex';
	});

	typeFilterModal.addEventListener('click', (e) => {
		if (e.target === typeFilterModal) {
			typeFilterModal.style.display = 'none';
		}
	});

	function getItemType(item) {
		if (item.isCase) return 'cases';
		if (item.isSticker) return 'stickers';
		if (item.isCharm) return 'charms';
		if (item.name.startsWith('Medal')) return 'medals';
		if (item.name.startsWith('Graffiti')) return 'graffiti';
		if (item.name.endsWith('StatTrack') || item.name.endsWith('StatTrack (TimeLimited)')) return 'st_weapons';
		if (item.name.endsWith('Fragment')) return 'fragments';
		if (item.name.startsWith('Agent')) return 'agents';
		if (item.isItemWithoutSlot) return 'items';
		return 'weapons';
	}

	function applyTypeFilters() {
		const activeRarityBtn = document.querySelector('.filter-btn.active');
		const selectedRarity = activeRarityBtn ? activeRarityBtn.getAttribute('data-rarity') : 'all';
		const collectionFilter = document.getElementById('collection-filter').value;

		const otherCheckboxes = modalContent.querySelectorAll('input[data-type]:not([data-type="all"])');
		const selectedTypes = Array.from(otherCheckboxes)
			.filter(cb => cb.checked)
			.map(cb => cb.dataset.type);

		const allTypesSelected = selectedTypes.length === otherCheckboxes.length;

		document.querySelectorAll('.item-card').forEach(card => {
			const itemId = card.id;
			const item = itemsDatabase.find(i => i.id === itemId);
			const cardRarity = card.getAttribute('data-rarity');

			if (!item) {
				card.style.display = 'none';
				return;
			}

			const itemType = getItemType(item);
			const itemCollection = item.collection || '';

			const typeMatch = allTypesSelected || selectedTypes.includes(itemType);
			const rarityMatch = selectedRarity === 'all' || cardRarity === selectedRarity;
			const collectionMatch = collectionFilter === 'all' || itemCollection === collectionFilter;

			card.style.display = (typeMatch && rarityMatch && collectionMatch) ? 'block' : 'none';
		});
	}

	modalContent.querySelectorAll('input[type="checkbox"]').forEach(cb => {
		cb.addEventListener('change', function () {
			const allCheckbox = modalContent.querySelector('input[data-type="all"]');
			const otherCheckboxes = modalContent.querySelectorAll('input[data-type]:not([data-type="all"])');

			if (this.dataset.type === 'all') {
				const isChecked = this.checked;
				otherCheckboxes.forEach(cb => {
					cb.checked = isChecked;
				});
				allCheckbox.indeterminate = false;
			} else {
				const checkedCount = Array.from(otherCheckboxes).filter(cb => cb.checked).length;
				const totalCount = otherCheckboxes.length;

				if (checkedCount === 0) {
					allCheckbox.checked = false;
					allCheckbox.indeterminate = false;
				} else if (checkedCount === totalCount) {
					allCheckbox.checked = true;
					allCheckbox.indeterminate = false;
				} else {
					allCheckbox.checked = false;
					allCheckbox.indeterminate = true;
				}
			}

			applyTypeFilters();
		});
	});

	function initShop() {
		itemsContainer.textContent = '';
		
		// Если выбрана вкладка "Мои запросы", отображаем их вместо предметов магазина
		if (currentMarket === 'normal' && currentPlatformTab === 'my-requests') {
			renderMyRequests();
			return;
		}
		
		const activeBtn = document.querySelector('.filter-btn.active');
		const selectedRarity = activeBtn ? activeBtn.dataset.rarity : 'all';
	
		const collectionFilter = document.getElementById('collection-filter');
		const selectedCollection = collectionFilter ? collectionFilter.value : 'all';

		const typeCheckboxes = document.querySelectorAll('#type-checkboxes input[type="checkbox"][data-type]:not([data-type="all"])');
		const selectedTypes = [];
		for (let i = 0; i < typeCheckboxes.length; i++) {
			if (typeCheckboxes[i].checked) {
				selectedTypes.push(typeCheckboxes[i].dataset.type);
			}
		}

		const allTypesSelected = selectedTypes.length === typeCheckboxes.length;

		// Оптимизация: один проход фильтрации вместо нескольких filter()
		const itemsToShow = [];
		const isRentalMarket = currentMarket === 'rental';
		for (let i = 0; i < itemsDatabase.length; i++) {
			const item = itemsDatabase[i];
			
			// Фильтр по рынку
			if (isRentalMarket ? !item.isRental : item.isRental) continue;
			
			// Фильтр по наличию в магазине
			if (!item.itemInStore) continue;

			// Фильтр по редкости
			if (selectedRarity !== 'all' && item.rarity !== selectedRarity) continue;
			
			// Фильтр по коллекции
			const itemCollection = item.collection || '';
			if (selectedCollection !== 'all' && itemCollection !== selectedCollection) continue;
			
			// Фильтр по типу
			if (!allTypesSelected) {
				const itemType = getItemType(item);
				if (!selectedTypes.includes(itemType)) continue;
			}
			
			itemsToShow.push(item);
		}
		
		const cardObserver = new IntersectionObserver((entries) => {
			for (let i = 0; i < entries.length; i++) {
				const entry = entries[i];
				if (entry.isIntersecting) {
					const img = entry.target.querySelector('.item-img img');
					if (img && img.hasAttribute('data-src')) {
						img.src = img.dataset.src;
						img.removeAttribute('data-src');
					}
					cardObserver.unobserve(entry.target);
				}
			}
		}, { threshold: 0.1 });
		
		for (let i = 0; i < itemsToShow.length; i++) {
			const card = addItemToShop(itemsToShow[i]);
			if (card) cardObserver.observe(card);
		}
		
		applyTypeFilters();
		sortItemsByPrice();
	}
	
	// Рендеринг вкладки "Мои запросы"
	function renderMyRequests() {
		itemsContainer.textContent = '';
		
		if (myRequests.length === 0) {
			itemsContainer.innerHTML = '<div style="color:#888;text-align:center;padding:40px;font-size:18px;">У вас пока нет активных запросов</div>';
			return;
		}
		
		myRequests.forEach(request => {
			const item = itemsDatabase.find(i => i.id === request.itemId);
			if (!item) return;
			
			const rarityInfo = rarities[item.rarity] || { color: 'none', ColorHex: '#adadad' };
			const collectionInfo = collectionsDatabase[item.collection] || { name: item.collection, image: '' };
			
			const requestCard = document.createElement('div');
			requestCard.className = 'item-card';
			requestCard.style.borderColor = request.type === 'sell' ? '#4CAF50' : '#2196F3';
			
			requestCard.innerHTML = `
				<div class="item-img"><img src='${item.image}' alt="" class="logo lazy" width=150></div>
				<div class="item-rarity ${rarityInfo.color}"><div class="item-name">${item.name}</div></div>
				<div class="item-collection" data-collection="${item.collection}">
					${collectionInfo.image ? `<img src="${collectionInfo.image}" class="collection-icon" alt="${collectionInfo.name}" style="width: 30px; height: auto;">` : ''}
					${collectionInfo.name || item.collection}
				</div>
				<div class="item-stock-info">
					<div>Тип запроса: <span style="color:${request.type === 'sell' ? '#4CAF50' : '#2196F3'}">${request.type === 'sell' ? 'Продажа' : 'Покупка'}</span></div>
					<div>Цена: <span style="color:${currencyColor}">${request.price.toFixed(2)} ₽</span></div>
				</div>
				<div class="item-buttons">
					<button class="cancel-request-btn" data-request-id="${request.id}" style="padding:10px 20px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;">Отменить запрос</button>
				</div>
			`;
			
			itemsContainer.appendChild(requestCard);
			
			// Обработчик отмены запроса
			requestCard.querySelector('.cancel-request-btn').addEventListener('click', function() {
				const requestId = parseInt(this.dataset.requestId);
				cancelRequest(requestId);
			});
		});
	}
	
	// Отмена запроса
	function cancelRequest(requestId) {
		const requestIndex = myRequests.findIndex(r => r.id === requestId);
		if (requestIndex === -1) {
			showToast('Запрос не найден!', true);
			return;
		}
		
		const request = myRequests[requestIndex];
		
		// Если это запрос на продажу, удаляем соответствующий лот с рынка
		if (request.type === 'sell') {
			const listingIndex = marketListings.findIndex(l => l.id === requestId);
			if (listingIndex !== -1) {
				marketListings.splice(listingIndex, 1);
			}
		}
		
		// Удаляем запрос
		myRequests.splice(requestIndex, 1);
		
		showToast('Запрос отменен');
		
		if (typeof saveGameState === 'function') saveGameState();
		
		// Перерисовываем
		renderMyRequests();
	}

	document.querySelectorAll('.filter-btn').forEach(btn => {
		btn.addEventListener('click', function () {
			document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
			this.classList.add('active');
			initShop();
		});
	});

	document.getElementById('collection-filter').addEventListener('change', function() {
		initShop(); // Перезагружаем магазин с учетом всех фильтров
	});
	
	function setupLazyLoading() {
	  const lazyImages = document.querySelectorAll('.item-card .item-img img');
	  
	  const imageObserver = new IntersectionObserver((entries, observer) => {
		entries.forEach(entry => {
		  if (entry.isIntersecting) {
			const img = entry.target;
			const src = img.getAttribute('data-src');
			if (src) {
			  img.src = src;
			  img.removeAttribute('data-src');
			}
			observer.unobserve(img);
		  }
		});
	  }, {
		rootMargin: '200px 0px' // Начинаем загружать заранее (за 200px до появления в viewport)
	  });

	  lazyImages.forEach(img => {
		if (img.hasAttribute('data-src')) {
		  imageObserver.observe(img);
		}
	  });
	}
	
	function calculateInventoryTotal() {
	  let total = 0;
	  // Оптимизация: используем for loop вместо forEach и кэшируем поиск в Map
	  const invLength = inventory.length;
	  for (let i = 0; i < invLength; i++) {
		const item = inventory[i];
		if (item.isRental) continue;
		
		const originalItem = itemsDbMap.get(item.id);
		
		if (!originalItem || originalItem.itemInStore === false) continue;
		
		if (originalItem.isCase) continue;
		
		total += Math.round((originalItem.price * 0.8) * 100) / 100;
		
		if (item.stickers && item.stickers.length > 0) {
		  for (let j = 0; j < item.stickers.length; j++) {
			const sticker = item.stickers[j];
			const stickerItem = itemsDbMap.get(sticker.id);
			if (stickerItem && stickerItem.itemInStore !== false) {
			  total += Math.round((stickerItem.price * 0.1) * 100) / 100;
			}
		  }
		}
		
		if (item.charm) {
		  const charmItem = itemsDbMap.get(item.charm.id);
		  if (charmItem && charmItem.itemInStore !== false) {
			total += Math.round((charmItem.price * 0.8) * 100) / 100;
		  }
		}
	  }
	  
	  return total.toLocaleString('ru-RU', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	  });
	}
	
	function addItemToShop(item) {
	  if (currentMarket === 'normal' && item.isRental) return;
	  
	  if (currentMarket === 'rental' && !item.isRental) return;

	  if (currentMarket === 'rental' && (item.isCase || item.isSticker || item.isCharm || item.name.startsWith('Graffiti'))) return;

	  const itemCard = document.createElement('div');
	  itemCard.className = 'item-card';
	  itemCard.id = item.id;
	  itemCard.dataset.rarity = item.rarity;
	  
	  const rarityInfo = rarities[item.rarity];
	  const collectionInfo = collectionsDatabase[item.collection] || { name: item.collection, image: '' };
const price = currentMarket === 'rental' ? Math.round(item.price * 100) / 100 : item.price;

          // Получаем информацию о лотах для предмета
          const marketLotsCount = marketListings.filter(l => l.itemId === item.id).length;
          const myLotsCount = myRequests.filter(r => r.itemId === item.id && r.type === 'sell').length;
          const inventoryCount = inventory.filter(i => i.id === item.id).length;
          
          itemCard.innerHTML = `
                <div class="item-img"><img data-src='${item.image}' alt="" class="logo lazy" width=150></div>
                <div class="item-rarity ${rarityInfo.color}"><div class="item-name">${item.name}</div></div>
                <div class="item-collection" data-collection="${item.collection}">
                  ${collectionInfo.image ? `<img src="${collectionInfo.image}" class="collection-icon" alt="${collectionInfo.name}" style="width: 30px; height: auto;">` : ''}
                  ${collectionInfo.name || item.collection}
                </div>
                ${currentMarket === 'rental' ?
                  '<div class="item-stock">Аренда на 3 минуты</div>' :
                  `<div class="item-stock-info">
                    <div>Лотов на рынке: <span class="market-lots">${marketLotsCount}</span></div>
                    <div>Моих лотов: <span class="my-lots">${myLotsCount}</span></div>
                    <div>Количество в инвентаре: <span class="inventory-count">${inventoryCount}</span></div>
                  </div>`
                }
                <div class="item-price" style="color: ${currencyColor}">${price.toFixed(2)} ₽</div>
                <div class="item-buttons">
                  <button class="find-on-platform-btn" data-id='${item.id}' data-name='${item.name}' data-price='${price}'
                        data-max='${item.stock}' data-rarity='${item.rarity}'
                        ${currentMarket === 'rental' ? 'data-rental="true"' : ''}>
                        ${currentMarket === 'rental' ? 'Арендовать' : 'Найти на платформе'}
                  </button>
                </div>
                ${currentMarket === 'rental' ? '' : '<div class="stock-warning">Нет доступных лотов</div>'}
          `;
	  
	  // Кнопки корзины удалены, теперь используется только кнопка "Найти на платформе"
	  // const warning = itemCard.querySelector('.stock-warning');
	  // const addBtn = itemCard.querySelector('.find-on-platform-btn') || itemElement.querySelector('.rent-item-btn');
	  // const buyAllBtn = itemCard.querySelector('.buy-all-btn');
	  // if (warning) {
	  //   warning.style.display = item.stock <= 0 ? 'block' : 'none';
	  //   addBtn.disabled = item.stock <= 0;
	  //   buyAllBtn.disabled = item.stock <= 0;
	  // }

	  const canShow3D = fxCan3D(item);

	  if (canShow3D) {
		  const imgContainer = itemCard.querySelector('.item-img');
		  setup3DViewer(imgContainer, item, item); // item — и есть originalItem для магазина
	  }

          // Обработчик кнопки "Найти на платформе" или "Арендовать"
          const actionBtn = itemCard.querySelector('.find-on-platform-btn');
          if (actionBtn) {
            actionBtn.addEventListener('click', function(e) {
              e.stopPropagation(); 
              
              const id = this.getAttribute('data-id');
              const name = this.getAttribute('data-name');
              const price = parseFloat(this.getAttribute('data-price'));
              const max = parseInt(this.getAttribute('data-max'));
              const isRental = this.hasAttribute('data-rental');

              if (currentMarket === 'rental') {
                if (balance < price) {
                  showToast('Недостаточно средств для аренды!', true);
                  return;
                }

                const rentalItem = {
                  id: id,
                  name: name,
                  image: item.image,
                  rarity: item.rarity,
                  isRental: true,
                  rentalExpires: Date.now() + 3 * 60 * 1000
                };

                balance -= price;
                balance = Math.round(balance * 100) / 100;
                if(balanceAmount) balanceAmount.textContent = balance.toLocaleString('ru-RU');
                if(typeof updateDuelRang === 'function') updateDuelRang(Math.round(price));
                if(typeof UpdateStatrackFrame === 'function') UpdateStatrackFrame(balance);
                if(typeof addExp === 'function') addExp(Math.round(price));

                inventory.push(rentalItem);
                showToast(`Предмет "${name}" арендован на 3 минуты!`);
                if(typeof updateInventory === 'function') updateInventory();
                if(typeof saveGameState === 'function') saveGameState();
              } else {
                // Открываем модальное окно платформы для предмета
                openPlatformModal(item);
              }
            });
          }

	  itemsContainer.appendChild(itemCard);

	  const img = itemCard.querySelector('.item-img img');
	  if (img) {
		const lazyObserver = new IntersectionObserver((entries, observer) => {
		  entries.forEach(entry => {
			if (entry.isIntersecting) {
			  const lazyImage = entry.target;
			  lazyImage.onerror = () => {
				lazyImage.src = 'images/none_item.png';
				lazyImage.onerror = null;
			  };
			  lazyImage.src = lazyImage.dataset.src;
			  observer.unobserve(lazyImage);
			}
		  });
		});
		lazyObserver.observe(img);
	  }
	}
	
	// Функция открытия модального окна платформы для предмета
	function openPlatformModal(item) {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000;display:flex;justify-content:center;align-items:center;';
		
		const rarityInfo = rarities[item.rarity] || { color: 'none', ColorHex: '#adadad' };
		const collectionInfo = collectionsDatabase[item.collection] || { name: item.collection, image: '' };
		
		// Получаем информацию о лотах
		const marketLotsCount = marketListings.filter(l => l.itemId === item.id).length;
		const myLotsCount = myRequests.filter(r => r.itemId === item.id && r.type === 'sell').length;
		const inventoryCount = inventory.filter(i => i.id === item.id).length;
		
		// Расчет цены наклеек
		let stickersPrice = 0;
		if (item.stickers && item.stickers.length > 0) {
			item.stickers.forEach(sticker => {
				const stickerItem = itemsDatabase.find(s => s.id === sticker.id);
				if (stickerItem && stickerItem.itemInStore !== false) {
					stickersPrice += Math.round((stickerItem.price * 0.1) * 100) / 100;
				}
			});
		}
		
		// Рекомендуемая цена продажи
		const recommendedPrice = item.price + stickersPrice * 0.4;
		
		modal.innerHTML = `
			<div class="platform-modal-content" style="background:#1a1a1a;padding:30px;border-radius:10px;max-width:900px;width:90%;display:flex;gap:30px;position:relative;">
				<button class="close-platform-modal" style="position:absolute;top:10px;right:15px;background:none;border:none;color:#fff;font-size:28px;cursor:pointer;">&times;</button>
				
				<!-- Левая панель: карточка товара и кнопки -->
				<div style="flex:1;min-width:250px;">
					<!-- Уменьшенная карточка товара -->
					<div style="background:#2a2a2a;padding:15px;border-radius:8px;text-align:center;margin-bottom:15px;">
						<img src="${item.image}" alt="${item.name}" style="width:150px;height:auto;margin-bottom:10px;cursor:pointer;" title="Нажмите для осмотра">
						<div class="item-rarity ${rarityInfo.color}" style="margin-bottom:5px;">
							<div class="item-name" style="font-size:14px;">${item.name}</div>
						</div>
						<div class="item-collection" style="font-size:12px;color:#aaa;display:flex;align-items:center;justify-content:center;gap:5px;">
							${collectionInfo.image ? `<img src="${collectionInfo.image}" class="collection-icon" alt="${collectionInfo.name}" style="width:20px;height:auto;">` : ''}
							<span style="margin-left:5px;">${collectionInfo.name || item.collection}</span>
						</div>
						<div style="font-size:16px;color:${currencyColor};margin-top:10px;">${item.price.toFixed(2)} ₽</div>
						<div style="font-size:12px;color:#888;margin-top:5px;">
							<div>Лотов на рынке: ${marketLotsCount}</div>
							<div>Моих лотов: ${myLotsCount}</div>
							<div>В инвентаре: ${inventoryCount}</div>
						</div>
					</div>
					
					<!-- Кнопка Продать -->
					<button id="sell-btn" style="width:100%;padding:12px;background:#4CAF50;color:white;border:none;border-radius:5px;cursor:pointer;font-size:14px;">Продать</button>
				</div>
				
				<!-- Правая панель: список лотов на платформе и форма создания запроса -->
				<div style="flex:2;min-width:400px;">
					<h3 style="color:#fff;margin-bottom:15px;">Лоты на платформе</h3>
					<div id="platform-listings" style="max-height:300px;overflow-y:auto;background:#2a2a2a;padding:15px;border-radius:8px;margin-bottom:15px;">
						${renderPlatformListings(item.id)}
					</div>
					
					<h4 style="color:#fff;margin-bottom:10px;">Создать запрос на покупку</h4>
					<div style="background:#2a2a2a;padding:15px;border-radius:8px;">
						<div style="margin-bottom:10px;">
							<label style="color:#aaa;font-size:12px;">Количество:</label>
							<input type="number" id="request-quantity" min="1" max="100" value="1" style="width:100%;padding:8px;background:#333;border:1px solid #444;color:#fff;border-radius:4px;">
						</div>
						<div style="margin-bottom:10px;">
							<label style="color:#aaa;font-size:12px;">Цена за штуку (₽):</label>
							<input type="number" id="request-price" min="0.01" step="0.01" value="${item.price.toFixed(2)}" style="width:100%;padding:8px;background:#333;border:1px solid #444;color:#fff;border-radius:4px;">
						</div>
						<button id="create-request-btn" style="width:100%;padding:10px;background:#2196F3;color:white;border:none;border-radius:4px;cursor:pointer;">Создать запрос</button>
					</div>
				</div>
			</div>
		`;
		
		document.body.appendChild(modal);
		addEscapeClose(modal);
		
		// Закрытие по кнопке - НЕ закрываем модальное окно
		modal.querySelector('.close-platform-modal').addEventListener('click', () => {
			// Не закрываем, просто ничего не делаем или можно добавить подтверждение
			showToast('Чтобы закрыть окно, нажмите ESC или кликните вне окна', false);
		});
		
		// Осмотр по клику на изображение
		modal.querySelector('.item-img img').addEventListener('click', () => {
			openItemViewer(item, modal);
		});
		
		// Кнопка Продать - открывает меню продажи
		modal.querySelector('#sell-btn').addEventListener('click', () => {
			openSellMenu(item, modal, stickersPrice, recommendedPrice);
		});
		
		// Создание запроса на покупку
		modal.querySelector('#create-request-btn').addEventListener('click', () => {
			const quantity = parseInt(modal.querySelector('#request-quantity').value);
			const price = parseFloat(modal.querySelector('#request-price').value);
			
			if (isNaN(quantity) || quantity < 1 || quantity > 100) {
				showToast('Введите корректное количество (1-100)', true);
				return;
			}
			
			if (isNaN(price) || price < 0.01) {
				showToast('Введите корректную цену (от 0.01)', true);
				return;
			}
			
			const totalCost = quantity * price;
			if (balance < totalCost) {
				showToast(`Недостаточно средств! Нужно ${totalCost.toFixed(2)} ₽`, true);
				return;
			}
			
			// Блокируем средства
			balance -= totalCost;
			balance = Math.round(balance * 100) / 100;
			if (balanceAmount) balanceAmount.textContent = balance.toLocaleString('ru-RU');
			
			// Создаем запрос
			const newRequest = {
				id: Date.now(),
				itemId: item.id,
				type: 'buy',
				quantity: quantity,
				price: price,
				totalCost: totalCost,
				createdAt: Date.now()
			};
			
			myRequests.push(newRequest);
			
			showToast(`Запрос создан: ${quantity} шт. по ${price.toFixed(2)} ₽`);
			
			// Проверяем, есть ли подходящие лоты
			checkBuyRequestAgainstListings(newRequest, item, modal);
			
			if (typeof saveGameState === 'function') saveGameState();
		});
	}
	
	// Рендеринг списка лотов на платформе
	function renderPlatformListings(itemId) {
		const listings = marketListings.filter(l => l.itemId === itemId);
		
		if (listings.length === 0) {
			return '<div style="color:#888;text-align:center;padding:20px;">Нет лотов на платформе</div>';
		}
		
		return listings.map(listing => {
			const sellerName = listing.sellerBot ? `Бот ${listing.sellerName}` : (listing.sellerName || 'Игрок');
			const hasStickers = listing.stickers && listing.stickers.length > 0;
			let stickersHtml = '';
			if (hasStickers) {
				stickersHtml = `<div style="font-size:11px;color:#aaa;margin-top:5px;">Наклеек: ${listing.stickers.length}</div>`;
			}
			
			return `
				<div class="platform-listing" style="background:#333;padding:12px;margin-bottom:10px;border-radius:5px;display:flex;justify-content:space-between;align-items:center;">
					<div>
						<div style="color:#fff;font-weight:bold;">${listing.price.toFixed(2)} ₽</div>
						<div style="font-size:12px;color:#888;">Продавец: ${sellerName}</div>
						${stickersHtml}
					</div>
					<button class="buy-listing-btn" data-listing-id="${listing.id}" style="padding:8px 15px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;">Купить</button>
				</div>
			`;
		}).join('');
	}
	
	// Открытие viewer для осмотра предмета
	function openItemViewer(item, parentModal) {
		// Используем существующую функцию setup3DViewer если предмет поддерживает 3D
		const canShow3D = fxCan3D(item);
		
		if (!canShow3D) {
			showToast('Осмотр недоступен для этого предмета', true);
			return;
		}
		
		// Создаем модальное окно viewer
		const viewerModal = document.createElement('div');
		viewerModal.className = 'modal';
		viewerModal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:10001;display:flex;justify-content:center;align-items:center;';
		
		viewerModal.innerHTML = `
			<div style="background:#1a1a1a;padding:20px;border-radius:10px;max-width:800px;width:90%;text-align:center;position:relative;">
				<button class="close-viewer-btn" style="position:absolute;top:10px;right:15px;background:none;border:none;color:#fff;font-size:28px;cursor:pointer;">&times;</button>
				<h3 style="color:#fff;margin-bottom:15px;">${item.name}</h3>
				<div id="viewer-container" style="width:100%;height:400px;background:#2a2a2a;border-radius:8px;display:flex;justify-content:center;align-items:center;">
					<img src="${item.image}" alt="${item.name}" style="max-width:100%;max-height:100%;">
				</div>
				<div style="margin-top:15px;">
					<button id="rotate-left-btn" style="padding:10px 20px;background:#555;color:white;border:none;border-radius:4px;cursor:pointer;margin-right:10px;">↺ Влево</button>
					<button id="rotate-right-btn" style="padding:10px 20px;background:#555;color:white;border:none;border-radius:4px;cursor:pointer;">Вправо ↻</button>
				</div>
			</div>
		`;
		
		document.body.appendChild(viewerModal);
		addEscapeClose(viewerModal);
		
		viewerModal.querySelector('.close-viewer-btn').addEventListener('click', () => viewerModal.remove());
		
		// Инициализация 3D viewer если возможно
		const imgContainer = viewerModal.querySelector('#viewer-container');
		setup3DViewer(imgContainer, item, item);
	}
	
	// Открытие меню продажи предмета
	function openSellMenu(item, parentModal, stickersPrice, recommendedPrice) {
		// Находим предметы в инвентаре с таким же ID
		const inventoryItems = inventory.filter((invItem, index) => 
			invItem.id === item.id && !invItem.isRental
		).map((invItem, index) => ({
			...invItem,
			inventoryIndex: inventory.indexOf(invItem)
		}));
		
		if (inventoryItems.length === 0) {
			showToast('У вас нет этого предмета в инвентаре!', true);
			return;
		}
		
		const sellModal = document.createElement('div');
		sellModal.className = 'modal';
		sellModal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10002;display:flex;justify-content:center;align-items:center;';
		
		sellModal.innerHTML = `
			<div style="background:#1a1a1a;padding:30px;border-radius:10px;max-width:600px;width:90%;position:relative;">
				<button class="close-sell-btn" style="position:absolute;top:10px;right:15px;background:none;border:none;color:#fff;font-size:28px;cursor:pointer;">&times;</button>
				<h3 style="color:#fff;margin-bottom:20px;">Выберите предмет для продажи</h3>
				
				<div id="sell-items-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:15px;margin-bottom:20px;max-height:300px;overflow-y:auto;">
					${inventoryItems.map((invItem, idx) => {
						const hasStickers = invItem.stickers && invItem.stickers.length > 0;
						const hasCharm = invItem.charm;
						let previewHtml = '';
						if (hasStickers || hasCharm) {
							previewHtml = `<div style="font-size:11px;color:#aaa;margin-top:5px;">`;
							if (hasStickers) previewHtml += `<span>🏷️ ${invItem.stickers.length}</span>`;
							if (hasCharm) previewHtml += `<span> 🎯 Брелок</span>`;
							previewHtml += `</div>`;
						}
						return `
							<div class="sell-item-card" data-inventory-index="${invItem.inventoryIndex}" style="background:#2a2a2a;padding:15px;border-radius:8px;text-align:center;cursor:pointer;border:2px solid transparent;transition:border 0.2s;">
								<img src="${invItem.image}" alt="${invItem.name}" style="width:100px;height:auto;">
								<div style="color:#fff;font-size:13px;margin-top:8px;">${invItem.name}</div>
								${previewHtml}
							</div>
						`;
					}).join('')}
				</div>
				
				<div id="sell-price-section" style="display:none;">
					<h4 style="color:#fff;margin-bottom:15px;">Установите цену продажи</h4>
					<div style="color:#aaa;font-size:13px;margin-bottom:15px;">
						Рекомендуемая цена: <strong style="color:${currencyColor};">${recommendedPrice.toFixed(2)} ₽</strong><br>
						<small>(1 лот + цена наклеек × 0.4)</small><br>
						<small style="color:#888;">При цене ≤ рекомендованной - покупка моментальная<br>Выше - потребуется подождать</small>
					</div>
					
					<input type="number" id="sell-price-input" min="0" max="1000000" step="0.01" value="${recommendedPrice.toFixed(2)}" 
						style="width:100%;padding:12px;background:#2a2a2a;border:1px solid #444;color:#fff;border-radius:5px;font-size:16px;">
					
					<div style="margin-top:20px;display:flex;gap:10px;">
						<button id="confirm-sell-btn" style="flex:1;padding:12px;background:#4CAF50;color:white;border:none;border-radius:5px;cursor:pointer;font-size:14px;">Выставить на продажу</button>
						<button id="cancel-sell-select-btn" style="flex:1;padding:12px;background:#555;color:white;border:none;border-radius:5px;cursor:pointer;font-size:14px;">Отмена</button>
					</div>
				</div>
			</div>
		`;
		
		document.body.appendChild(sellModal);
		addEscapeClose(sellModal);
		
		sellModal.querySelector('.close-sell-btn').addEventListener('click', () => sellModal.remove());
		
		let selectedInventoryIndex = null;
		
		// Выбор предмета для продажи
		sellModal.querySelectorAll('.sell-item-card').forEach(card => {
			card.addEventListener('click', function() {
				sellModal.querySelectorAll('.sell-item-card').forEach(c => c.style.borderColor = 'transparent');
				this.style.borderColor = currencyColor;
				selectedInventoryIndex = parseInt(this.dataset.inventoryIndex);
				
				// Показываем секцию установки цены
				sellModal.querySelector('#sell-price-section').style.display = 'block';
				
				// Снимаем брелок если есть
				const selectedItem = inventory[selectedInventoryIndex];
				if (selectedItem && selectedItem.charm) {
					const charmItem = itemsDatabase.find(c => c.id === selectedItem.charm.id);
					if (charmItem) {
						inventory.push({
							id: charmItem.id,
							name: charmItem.name,
							rarity: charmItem.rarity,
							image: charmItem.image
						});
						showToast(`Брелок "${charmItem.name}" снят и возвращен в инвентарь`);
						delete selectedItem.charm;
					}
				}
			});
		});
		
		// Отмена выбора
		sellModal.querySelector('#cancel-sell-select-btn').addEventListener('click', () => {
			sellModal.querySelector('#sell-price-section').style.display = 'none';
			sellModal.querySelectorAll('.sell-item-card').forEach(c => c.style.borderColor = 'transparent');
			selectedInventoryIndex = null;
		});
		
		// Подтверждение продажи
		sellModal.querySelector('#confirm-sell-btn').addEventListener('click', () => {
			if (selectedInventoryIndex === null) {
				showToast('Выберите предмет для продажи!', true);
				return;
			}
			
			const price = parseFloat(sellModal.querySelector('#sell-price-input').value);
			
			if (isNaN(price) || price < 0 || price > 1000000) {
				showToast('Введите корректную цену от 0 до 1000000!', true);
				return;
			}
			
			const selectedItem = inventory[selectedInventoryIndex];
			
			// Удаляем предмет из инвентаря
			inventory.splice(selectedInventoryIndex, 1);
			
			// Создаем лот на рынке
			const newListing = {
				id: Date.now(),
				itemId: item.id,
				sellerName: 'Вы',
				sellerBot: false,
				price: price,
				stickers: selectedItem.stickers || [],
				createdAt: Date.now()
			};
			
			marketListings.push(newListing);
			
			// Добавляем в мои запросы
			myRequests.push({
				id: newListing.id,
				itemId: item.id,
				type: 'sell',
				price: price,
				createdAt: Date.now()
			});
			
			showToast(`Предмет выставлен на продажу за ${price.toFixed(2)} ₽`);
			
			// Обновляем отображение
			if (typeof updateInventory === 'function') updateInventory();
			if (typeof saveGameState === 'function') saveGameState();
			
			// Закрываем только модальное окно продажи, но не родительское
			sellModal.remove();
			
			// Перерисовываем платформу без закрытия родительского модала
			initShop();
		});
	}
	
	// Обработка покупки лота с платформы
	function handleBuyListing(listingId, item, parentModal) {
		const listing = marketListings.find(l => l.id === listingId);
		if (!listing) {
			showToast('Лот не найден!', true);
			return;
		}
		
		if (balance < listing.price) {
			showToast('Недостаточно средств!', true);
			return;
		}
		
		// Списываем баланс
		balance -= listing.price;
		balance = Math.round(balance * 100) / 100;
		if (balanceAmount) balanceAmount.textContent = balance.toLocaleString('ru-RU');
		
		// Добавляем предмет в инвентарь
		const newItem = {
			id: item.id,
			name: item.name,
			rarity: item.rarity,
			image: item.image,
			stickers: listing.stickers || []
		};
		
		inventory.push(newItem);
		
		// Удаляем лот с рынка
		const listingIndex = marketListings.findIndex(l => l.id === listingId);
		if (listingIndex !== -1) {
			marketListings.splice(listingIndex, 1);
		}
		
		// Удаляем из моих запросов если это был наш лот
		const requestIndex = myRequests.findIndex(r => r.id === listingId);
		if (requestIndex !== -1) {
			myRequests.splice(requestIndex, 1);
		}
		
		showToast(`Предмет куплен за ${listing.price.toFixed(2)} ₽`);
		
		if (typeof updateInventory === 'function') updateInventory();
		if (typeof saveGameState === 'function') saveGameState();
		
		// Обновляем отображение платформы
		parentModal.querySelector('#platform-listings').innerHTML = renderPlatformListings(item.id);
	}
	
	// Инициализация обработчиков для кнопок покупки лотов
	function initPlatformListeners() {
		document.addEventListener('click', function(e) {
			if (e.target.classList.contains('buy-listing-btn')) {
				const listingId = parseInt(e.target.dataset.listingId);
				const modal = e.target.closest('.modal');
				if (modal) {
					// Находим текущий предмет из контекста модального окна
					// Это упрощенная реализация, в полной версии нужно передавать item
					showToast('Функция покупки в разработке', true);
				}
			}
		});
	}
	
	initPlatformListeners();
	
	const nameFilterInput = document.getElementById('name-filter-input');
	const applyNameFilterBtn = document.getElementById('apply-name-filter');
	const clearNameFilterBtn = document.getElementById('clear-name-filter');
	const collectionFilter = document.getElementById('collection-filter');
	let currentNameFilter = '';
	let autoSelectedCollectionId = null; // Запоминаем ID коллекции, найденный автоселектом

	applyNameFilterBtn.addEventListener('click', applyNameFilter);
	clearNameFilterBtn.addEventListener('click', clearNameFilter);

	nameFilterInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			applyNameFilter();
		}
	});

	function applyNameFilter() {
		currentNameFilter = nameFilterInput.value.trim().toLowerCase();
		autoSelectedCollectionId = null;

		if (currentNameFilter) {
			autoSelectedCollectionId = autoSelectCollectionByName(currentNameFilter);
			if (autoSelectedCollectionId && collectionFilter) {
				collectionFilter.value = autoSelectedCollectionId;
			}
		}
		
		filterItems();
	}

	function clearNameFilter() {
		const wasTextEntered = currentNameFilter !== ''; // Проверяем, был ли текст до сброса
		nameFilterInput.value = '';
		currentNameFilter = '';
		autoSelectedCollectionId = null;
		if (!wasTextEntered && collectionFilter) {
			collectionFilter.value = 'all';
		}
		filterItems();
		initShop();
	}

	function autoSelectCollectionByName(searchText) {
		if (!collectionFilter || typeof collectionsDatabase === 'undefined') return null;
		
		const matchedCollection = Object.values(collectionsDatabase).find(collection => 
			collection.name.toLowerCase().includes(searchText)
		);
		
		return matchedCollection ? matchedCollection.id : null;
	}

	function filterItems() {
		const activeRarityBtn = document.querySelector('.filter-btn.active');
		const selectedRarity = activeRarityBtn ? activeRarityBtn.getAttribute('data-rarity') : 'all';
		const manualSelectedCollection = collectionFilter ? collectionFilter.value : 'all';
		const collectionNameMap = new Map();
		if (typeof collectionsDatabase !== 'undefined') {
			Object.values(collectionsDatabase).forEach(collection => {
				collectionNameMap.set(collection.id, collection.name.toLowerCase());
			});
		}
		const isTextFilterMatchingCollection = (autoSelectedCollectionId !== null);

		document.querySelectorAll('.item-card').forEach(card => {
			const cardRarity = card.getAttribute('data-rarity');
			
			const collectionElement = card.querySelector('.item-collection');
			const cardCollectionId = collectionElement ? collectionElement.dataset.collection : '';
			
			const nameElement = card.querySelector('.item-name');
			const cardName = nameElement ? nameElement.textContent.toLowerCase() : '';

			const cardCollectionName = collectionNameMap.has(cardCollectionId) 
				? collectionNameMap.get(cardCollectionId) 
				: '';

			const rarityMatch = selectedRarity === 'all' || cardRarity === selectedRarity;
			let collectionMatch = (manualSelectedCollection === 'all' || cardCollectionId === manualSelectedCollection);
			if (isTextFilterMatchingCollection && manualSelectedCollection === autoSelectedCollectionId) {
				collectionMatch = true; 
			}
			
			const textFilterMatch = currentNameFilter === '' || 
									cardName.includes(currentNameFilter) || 
									cardCollectionName.includes(currentNameFilter);
			let finalCollectionLogic;
			
			if (isTextFilterMatchingCollection && manualSelectedCollection === autoSelectedCollectionId) {
				finalCollectionLogic = true; 
			} else {
				finalCollectionLogic = collectionMatch;
			}

			const shouldDisplay = rarityMatch && finalCollectionLogic && textFilterMatch;

			card.style.display = shouldDisplay ? 'block' : 'none';
		});
	}
	
	function addNewItem(itemInStore = true, id, name, collection, stock, price, rarity, imageSrc, isCase = false, contains = [], dropChances = {}, isCharm = false, isSticker = false, isItemWithoutSlot = false, priceMultiply = 'null') {
	  
	  if (priceMultiply === 'null') {
		  priceMultiply = Math.round(price * 100 / 10) / 100;
	  }
	  const newItem = {
		itemInStore,
		id,
		name,
		collection,
		stock,
		price,
		initialPrice: price,
		rarity,
		image: imageSrc,
		isRental: false,
		isCase,
		isCharm,
		isSticker,
		isItemWithoutSlot,
		priceMultiply
	  };
	  
	  if (isCase) {
		newItem.contains = contains;
		newItem.dropChances = dropChances;
	  }
	  
	  itemsDatabase.push(newItem);
	  
	  if (itemInStore) {
		addItemToShop(newItem);
	  }
	  
	  if (itemInStore && !isCase && !isCharm && !isSticker) {
		itemsDatabase.push(createRentalItemObj({id, name, collection, stock, price, rarity, imageSrc, isItemWithoutSlot}));
	  }
	}
	
	function addNewRarity(id, name, color, order, nextRarity = null, craftsFrom = null) {
		if (rarities[id]) {
			showToast('Редкость с таким ID уже существует!', true);
			return false;
		}

		rarities[id] = {
			name: name,
			color: id,
			order: order,
			next: nextRarity,
			colorHex: color, // Сохраняем hex-цвет
			craftsFrom: craftsFrom // Добавляем информацию о том, из чего крафтится
		};

		if (craftsFrom && rarities[craftsFrom]) {
			rarities[craftsFrom].next = id;
		}

		const filtersContainer = document.querySelector('.filters');
		const newFilterBtn = document.createElement('button');
		newFilterBtn.className = 'filter-btn';
		newFilterBtn.setAttribute('data-rarity', id);
		newFilterBtn.style.backgroundColor = color;
		newFilterBtn.style.color = getContrastColor(color);
		newFilterBtn.textContent = name;
		filtersContainer.appendChild(newFilterBtn);

		const buttons = Array.from(filtersContainer.querySelectorAll('.filter-btn'));
		buttons.sort((a, b) => {
			const rarityA = a.getAttribute('data-rarity');
			const rarityB = b.getAttribute('data-rarity');
			if (rarityA === 'all') return -1;
			if (rarityB === 'all') return 1;
			return (rarities[rarityB]?.order || 0) - (rarities[rarityA]?.order || 0);
		});
		
		filtersContainer.innerHTML = '';
		buttons.forEach(btn => filtersContainer.appendChild(btn));

		const raritySelect = document.getElementById('new-item-rarity');
		const newOption = document.createElement('option');
		newOption.value = id;
		newOption.textContent = name;
		raritySelect.appendChild(newOption);

		const craftsFromSelect = document.getElementById('new-rarity-crafts-from');
		const craftsToSelect = document.getElementById('new-rarity-crafts-to');
		
		craftsFromSelect.innerHTML += `<option value="${id}">${name}</option>`;
		craftsToSelect.innerHTML += `<option value="${id}">${name}</option>`;

		newFilterBtn.addEventListener('click', function() {
			const rarity = this.getAttribute('data-rarity');
			
			filterButtons.forEach(b => b.classList.remove('active'));
			this.classList.add('active');
			
			document.querySelectorAll('.item-card').forEach(card => {
				if (rarity === 'all' || card.getAttribute('data-rarity') === rarity) {
					card.style.display = 'block';
				} else {
					card.style.display = 'none';
				}
			});
			initShop();
		});

		filterButtons = document.querySelectorAll('.filter-btn');
		return true;
	}
	
	// Функции корзины удалены, так как корзина больше не используется
	// checkoutBtn.addEventListener('click', checkout);
	// clearCartBtn.addEventListener('click', clearCart);
	
	function addToCart(id, name, price) {
		const existingItem = cart.find(item => item.id === id);
		const shopItem = itemsDatabase.find(item => item.id === id);
		
		if (shopItem && shopItem.stock <= 0) {
			showToast('Товара нет в наличии!', true);
			return;
		}
		
		if (existingItem) {
			existingItem.quantity += 1;
		} else {
			cart.push({ id, name, price, quantity: 1 });
		}
		
		const itemElement = document.getElementById(id);
		if (itemElement) {
			const currentStock = parseInt(itemElement.querySelector('.market-lots').textContent);
			
			if (shopItem.priceMultiply > 0) {
				shopItem.price += shopItem.priceMultiply;
				if (shopItem.price > 1000000) {
					shopItem.price = 1000000;
				}
				updateItemPriceInUI(shopItem);
			}
			
			updateStock(itemElement, currentStock - 1, null);
		}
		
		// updateCart() больше не вызывается, так как корзина удалена
	}

	function removeFromCart(index, isShiftPressed = false) {
		const item = cart[index];
		if (!item) return;

		const shopItem = itemsDatabase.find(dbItem => dbItem.id === item.id);
		if (!shopItem) return;

		const itemElement = document.getElementById(item.id);

		let quantityToRemove = 1;
		if (isShiftPressed) {
			quantityToRemove = Math.min(10, item.quantity);
		}

		for (let i = 0; i < quantityToRemove; i++) {
			if (item.quantity > 1) {
				item.quantity -= 1;
			} else {
				cart.splice(index, 1);
				break; // больше нечего удалять
			}
		}

		const stockDelta = quantityToRemove;
		if (itemElement) {
			const currentStock = parseInt(itemElement.querySelector('.market-lots').textContent);
			updateStock(itemElement, currentStock + stockDelta, null);
		} else {
			shopItem.stock += stockDelta;
		}

		if (shopItem.priceMultiply > 0) {
			shopItem.price = Math.max(0, shopItem.price - shopItem.priceMultiply * stockDelta);
			if (shopItem.price > 1000000) {
				shopItem.price = 1000000;
			}
			updateItemPriceInUI(shopItem);
		}

		// updateCart() больше не вызывается, так как корзина удалена
	}

	function updateStock(element, newStock, max) {
		// Функция обновляет только отображение количества лотов, кнопки корзины удалены
		const stockElement = element.querySelector('.market-lots');
		
		if (stockElement) {
			stockElement.textContent = newStock;
		}
		
		const serchItem = itemsDatabase.find(item => item.id === element.id);
		if (serchItem) {
			serchItem.stock = newStock;
		}
	}
	
	function updateCart() {
		cartItemsElement.innerHTML = '';
		let total = 0;
		
		cart.forEach((item, index) => {
			total += item.price * item.quantity;
			
			const itemElement = document.createElement('div');
			itemElement.className = 'cart-item';
			itemElement.innerHTML = `
				<span>${item.name} ×${item.quantity}</span>
				<span style="color: ${currencyColor}">${(item.price * item.quantity).toFixed(2)} ₽ <span class="remove-item" data-index="${index}">×</span></span>
			`;
			
			cartItemsElement.appendChild(itemElement);
		});
		
		document.querySelectorAll('.remove-item').forEach(btn => {
			btn.addEventListener('click', function(e) { // ← добавлен параметр e
				const index = parseInt(this.getAttribute('data-index'));
				removeFromCart(index, e.shiftKey); // ← передаём флаг shiftKey
			});
		});
		
		cartTotalElement.textContent = total.toFixed(2); // Отображаем сумму с двумя знаками после запятой
	}
	
	function checkout() {
		if (cart.length === 0) {
			showToast('Корзина пуста!', true);
			return;
		}
		
		let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
		total = Math.round(total * 100) / 100;
		
		if (balance < total) {
			showToast('Недостаточно средств!', true);
			return;
		}
		
		balance -= Math.round(total * 100) / 100;
		balance = Math.round(balance * 100) / 100;
		updateDuelRang(Math.round(total));
		balanceAmount.textContent = balance.toLocaleString('ru-RU');
		UpdateStatrackFrame(balance);
		addExp(Math.round(total));
		
		showToast(`Заказ оформлен! Сумма: ${total.toLocaleString('ru-RU')} ₽`);
		
		cart.forEach(item => {
			const dbItem = itemsDatabase.find(dbItem => dbItem.id === item.id);
			if (dbItem) {
				for (let i = 0; i < item.quantity; i++) {
					const newItem = {
						id: dbItem.id,
						name: dbItem.name,
						rarity: dbItem.rarity,
						image: dbItem.image
					};
					
					if (!dbItem.isCase && !dbItem.isCharm && !dbItem.isSticker && !dbItem.isItemWithoutSlot) {
						if (Math.random() < 0.03) {
							const allStickers = itemsDatabase.filter(item => item.isSticker);
							const stickerCount = Math.min(4, Math.max(1, Math.floor(Math.random() * 4) + 1));
							
							newItem.stickers = [];
							
							for (let j = 0; j < stickerCount; j++) {
								const randomIndex = Math.floor(Math.random() * allStickers.length);
								const selectedSticker = allStickers[randomIndex];
								if (selectedSticker) {
									newItem.stickers.push({
										id: selectedSticker.id,
										name: selectedSticker.name,
										image: selectedSticker.image
									});
								}
							}
						}
					}
					
					inventory.push(newItem);
				}
			}
		});
		
		cart.length = 0;
		updateCart();
		sortItemsByPrice();
		updateInventory();
		saveGameState();
	}
	
	function clearCart() {
		cart.forEach(item => {
			const shopItem = itemsDatabase.find(dbItem => dbItem.id === item.id);
			const itemElement = document.getElementById(item.id);
			
			if (itemElement && shopItem) {
				const btn = itemElement.querySelector('.find-on-platform-btn') || itemElement.querySelector('.rent-item-btn');
				const max = btn ? parseInt(btn.getAttribute('data-max')) : 0;
				
				if (shopItem.priceMultiply > 0) {
					shopItem.price = Math.max(0, shopItem.price - (shopItem.priceMultiply * item.quantity));
					updateItemPriceInUI(shopItem);
				}
				
				updateStock(itemElement, currentStock + item.quantity, max);
			} else if (shopItem) {
				shopItem.stock = shopItem.stock + item.quantity;
				if (shopItem.priceMultiply > 0) {
					shopItem.price = Math.max(0, shopItem.price - (shopItem.priceMultiply * item.quantity));
					updateItemPriceInUI(shopItem);
				}
			}
		});

		cart.length = 0;
		updateCart();
		showToast('Корзина очищена');
	}
	
	let itemsDbMap = new Map();

	inventoryBtn.addEventListener('click', function() {
		if (itemsDbMap.size === 0) {
			itemsDbMap = new Map(itemsDatabase.map(item => [item.id, item]));
		}
		updateInventory();
		inventoryContainer.style.display = 'block';
		overlay.style.display = 'block';
		document.body.style.overflow = 'hidden';
	});
	
	closeInventory.addEventListener('click', function() {
		inventoryContainer.style.display = 'none';
		overlay.style.display = 'none';
		document.body.style.overflow = 'auto';
		resetSelection();
	});
	
	overlay.addEventListener('click', function() {
		inventoryContainer.style.display = 'none';
		overlay.style.display = 'none';
		document.body.style.overflow = 'auto';
		resetSelection();
	});
	
	function calculateTotal() {
		let total = 0;
		cart.forEach(item => {
			total += item.price * item.quantity;
		});
		return total.toFixed(2); // Округляем до двух знаков после запятой
	}
	
	function sortInventoryByRarity() {
		const typeOrder = { 'case': 0, 'withSlots': 1, 'withoutSlots': 2, 'charm': 3, 'sticker': 4, 'rental': 5 };
		
		inventory.sort((a, b) => {
			const rarityA = rarities[a.rarity]?.order || 0;
			const rarityB = rarities[b.rarity]?.order || 0;
			
			if (rarityB !== rarityA) return rarityB - rarityA;
			
			const originalItemA = itemsDbMap.get(a.id);
			const originalItemB = itemsDbMap.get(b.id);
			
			const getType = (item, orig) => {
				if (!orig) return item.isRental ? 'rental' : 'withSlots';
				if (orig.isCase) return 'case';
				if (orig.isCharm) return 'charm';
				if (orig.isSticker) return 'sticker';
				if (orig.isItemWithoutSlot) return 'withoutSlots';
				if (item.isRental) return 'rental';
				return 'withSlots';
			};
			
			const typeA = getType(a, originalItemA);
			const typeB = getType(b, originalItemB);
			
			if (typeA !== typeB) return typeOrder[typeA] - typeOrder[typeB];
			
			const priceA = calculateItemPriceInInventory(inventory.indexOf(a));
			const priceB = calculateItemPriceInInventory(inventory.indexOf(b));
			if (priceB !== priceA) return priceB - priceA;
			
			return a.name.localeCompare(b.name);
		});
		saveGameState();
	}
	
	function groupFragmentsInInventory() {
	  const fragmentGroups = {};
	  const invLength = inventory.length;
	  
	  // Оптимизация: используем for loop вместо forEach
	  for (let i = 0; i < invLength; i++) {
		const item = inventory[i];
		if (item.name.endsWith('Fragment') && !item.isRental) {
		  if (!fragmentGroups[item.id]) {
			fragmentGroups[item.id] = {
			  item: item,
			  indices: [],
			  count: 0
			};
		  }
		  fragmentGroups[item.id].indices.push(i);
		  fragmentGroups[item.id].count++;
		}
	  }
	  
	  return fragmentGroups;
	}
	
	function upgradeFragment(index, count, isShiftPressed = false) {
		const spendPerUpgrade = 10;
		const upgradesAtOnce = isShiftPressed ? 10 : 1; // 10 улучшений за раз при Shift
		const totalNeeded = spendPerUpgrade * upgradesAtOnce; // 10 или 100

		if (count < totalNeeded) {
			const needed = totalNeeded;
			showToast(`Недостаточно фрагментов для улучшения (нужно ${needed})`, true);
			return;
		}

		const fragmentItem = inventory[index];
		const fragment_rarities = {
			'common': { next: 'uncommon' },
			'uncommon': { next: 'rare' },
			'rare': { next: 'epic' },
			'epic': { next: 'legendary' },
			'legendary': { next: 'arcane' },
			'arcane': { next: 'nameless' },
			'nameless': { next: 'none' },
			'none': { next: null }
		};

		const nextRarity = fragment_rarities[fragmentItem.rarity]?.next;
		if (!nextRarity) {
			showToast('Этот фрагмент нельзя улучшить', true);
			return;
		}

		const nextFragment = itemsDatabase.find(item =>
			item.rarity === nextRarity && item.name.endsWith('Fragment')
		);

		if (!nextFragment) {
			showToast('Фрагмент следующей редкости не найден', true);
			return;
		}

		removeFragments(fragmentItem.id, totalNeeded);

		for (let i = 0; i < upgradesAtOnce; i++) {
			inventory.push({
				id: nextFragment.id,
				name: nextFragment.name,
				rarity: nextFragment.rarity,
				image: nextFragment.image
			});
		}

		const resultCount = upgradesAtOnce;
		const spentCount = totalNeeded;
		showToast(`Улучшено! Потрачено ${spentCount} ${fragmentItem.name}, получено ${resultCount} ${nextFragment.name}`);
		updateInventory();
		saveGameState();
	}
	
	const fragmentCaseModal = document.createElement('div');
	fragmentCaseModal.className = 'case-modal';
	fragmentCaseModal.style.display = 'none';
	fragmentCaseModal.style.position = 'fixed';
	fragmentCaseModal.style.top = '0';
	fragmentCaseModal.style.left = '0';
	fragmentCaseModal.style.width = '100%';
	fragmentCaseModal.style.height = '100%';
	fragmentCaseModal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
	fragmentCaseModal.style.zIndex = '20000';
	fragmentCaseModal.style.justifyContent = 'center';
	fragmentCaseModal.style.alignItems = 'center';
	fragmentCaseModal.style.flexDirection = 'column';
	document.body.appendChild(fragmentCaseModal);
	
	function openFragment(index, count, event) {
	  if (count < 10) {
		showToast('Недостаточно фрагментов для открытия (нужно 10)', true);
		return;
	  }
	  
	  const fragmentItem = inventory[index];
	  const fragmentRarity = fragmentItem.rarity;
	  
	  const isMassOpen = event && event.altKey;
	  
	  let totalAvailableFragments = 0;
	  if (fragmentItem.count) {
		  totalAvailableFragments = fragmentItem.count;
	  } else {
		  totalAvailableFragments = inventory.filter(i => i.id === fragmentItem.id && !i.isRental).length;
	  }

	  const maxOpens = Math.floor(totalAvailableFragments / 10);
	  
	  if (isMassOpen && maxOpens > 1) {
		  showMassOpenConfirmModal(fragmentItem, maxOpens, totalAvailableFragments, index, fragmentRarity);
		  return;
	  }
	  
	  const tempCase = {
		id: `fragment_case_${fragmentRarity}`,
		name: `${fragmentItem.name} Case`,
		rarity: fragmentRarity,
		contains: [],
		dropChances: { [fragmentRarity]: 100 } // 100% шанс на предметы той же редкости
	  };
	  
	  tempCase.contains = itemsDatabase.filter(item => 
		item.rarity === fragmentRarity && 
		!item.name.endsWith('Fragment') &&
		!item.isCase &&
		!item.isRental &&
		!item.name.includes('(TimeLimited)') && // Исключаем предметы с "(TimeLimited)" в названии
		!item.id.endsWith('_rental') && // Исключаем предметы с "_rental" в ID
		!item.isRental // Исключаем предметы помеченные как арендованные
	  ).map(item => item.id);
	  
	  if (tempCase.contains.length === 0) {
		showToast('Нет доступных предметов для открытия', true);
		return;
	  }
	  
	  let lastSelectedItemId = null;
	  
	  fragmentCaseModal.innerHTML = `
		<div class="case-content" style="background-color: rgb(30 30 30 / 85%); padding: 20px; border-radius: 8px; width: 80%; max-width: 800px; text-align: center;">
		  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
			<h2 style="margin: 0;">${tempCase.name}</h2>
			<button class="case-close-btn" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; margin-left: 10px;">×</button>
		  </div>
		  
		  <p style="text-align: center; margin-bottom: 20px;">Для открытия требуется 10 фрагментов</p>
		  
		  <!-- Блок выпадения -->
		  <div class="case-drop-container" style="width: 100%; height: 150px; background-color: #2a2a2a; border-radius: 8px; margin: 20px 0; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
			<div class="case-drop-center-line" style="position: absolute; left: 50%; transform: translateX(-50%); width: 2px; height: 100%; background-color: gold; z-index: 1;"></div>
			<div class="case-drop-items" style="display: flex; gap: 10px; padding: 10px; position: relative;">
			  <!-- Предметы будут добавляться динамически при открытии -->
			</div>
		  </div>
		  
		  <!-- Кнопки открытия -->
		  <div style="display: flex; gap: 10px; justify-content: center; margin: 20px 0;">
			<button class="open-case-start-btn" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">Открыть (10 фрагментов)</button>
			<button class="skip-animation-btn" style="padding: 10px 20px; background-color: #555555; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">➤</button>
		  </div>
		  
		  <!-- Кнопка информации о шансах -->
		  <div style="margin: 10px 0;">
			<button class="case-help-btn" style="background: none; border: none; color: #aaa; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 5px; margin: 0 auto;">
			  <span style="background: #555; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">i</span>
			  Шансы выпадения
			</button>
		  </div>
		  
		  <!-- Блок содержимого кейса -->
		  <div class="case-contents-container" style="width: 100%; max-height: 300px; overflow-y: auto; margin-top: 20px;">
			<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; padding: 10px;">
			  ${getSortedCaseContents(tempCase).map(item => {
				const rarity = rarities[item.rarity];
				return `
				  <div class="case-content-item" data-id="${item.id}" style="background-color: #2a2a2a; padding: 10px; border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.3s; position: relative;">
					<div style="position: relative; display: inline-block;">
						<img src="${item.image}" alt="${item.name}" width="60" style="border-radius: 5px;">
						${item.isRental ? `<img src="images/item_time_limited.png" alt="Арендовано" style="position: absolute; top: 0; left: 0; width: 60px; height: auto; pointer-events: none;">` : ''}
					</div>
					<div class="case-item-rarity ${rarity.color}" style="padding: 2px 5px; border-radius: 4px; margin-top: 5px; font-size: 10px;">
					<div class="case-item-name" style="display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; font-size: 12px; margin-top: 5px; height: auto; text-overflow: ellipsis;">${item.name}</div></div>
					<div class="case-item-selected" style="color: gold; font-size: 10px; margin-top: 3px; display: none;">Бустится</div>
				</div>
				`;
			  }).join('')}
			</div>
		  </div>
		</div>
		
		<!-- Модальное окно с шансами -->
		<div class="case-help-modal" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: rgb(30 30 30 / 95%); padding: 20px; border-radius: 8px; z-index: 20001; width: 300px;">
		  <h3 style="margin-top: 0;">Шансы выпадения</h3>
		  ${Object.entries(tempCase.dropChances).map(([rarity, chance]) => {
			const rarityInfo = rarities[rarity];
			return `
			  <div style="margin-bottom: 10px; display: flex; justify-content: space-between;">
				<span style="color: ${rarityInfo.colorHex};">${rarityInfo.name}</span>
				<span>${chance}%</span>
			  </div>
			`;
		  }).join('')}
		  <button class="close-case-help-btn" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px; width: 100%;">Закрыть</button>
		</div>
	  `;

	  function getSortedCaseContents(caseData) {
		const items = [];
		const addedIds = new Set();
		
		caseData.contains.forEach(itemId => {
		  if (!addedIds.has(itemId)) {
			const item = itemsDatabase.find(i => i.id === itemId);
			if (item) {
			  items.push(item);
			  addedIds.add(itemId);
			}
		  }
		});
		
		return items.sort((a, b) => a.name.localeCompare(b.name));
	  }

	  fragmentCaseModal.querySelectorAll('.case-content-item').forEach(itemElement => {
		itemElement.addEventListener('click', function() {
		  const itemId = this.getAttribute('data-id');
		  
		  if (lastSelectedItemId === itemId) {
			this.style.boxShadow = 'none';
			this.style.border = 'none';
			this.querySelector('.case-item-selected').style.display = 'none';
			lastSelectedItemId = null;
			return;
		  }
		  
		  fragmentCaseModal.querySelectorAll('.case-content-item').forEach(el => {
			el.style.boxShadow = 'none';
			el.style.border = 'none';
			el.querySelector('.case-item-selected').style.display = 'none';
		  });
		  
		  this.style.boxShadow = '0 0 10px gold';
		  this.style.border = '2px solid gold';
		  this.querySelector('.case-item-selected').style.display = 'block';
		  
		  lastSelectedItemId = itemId;
		});
	  });

	  const closeBtn = fragmentCaseModal.querySelector('.case-close-btn');
	  closeBtn.addEventListener('click', function() {
		if (!isCaseOpening) {
		  fragmentCaseModal.style.display = 'none';
		}
	  });
	  
	  fragmentCaseModal.querySelector('.case-help-btn').addEventListener('click', function() {
		fragmentCaseModal.querySelector('.case-help-modal').style.display = 'block';
	  });
	  
	  fragmentCaseModal.querySelector('.close-case-help-btn').addEventListener('click', function() {
		fragmentCaseModal.querySelector('.case-help-modal').style.display = 'none';
	  });
	  
	  fragmentCaseModal.querySelector('.open-case-start-btn').addEventListener('click', function() {
		if (!isCaseOpening) {
		  openFragmentCaseWithAnimation(index, tempCase, lastSelectedItemId);
		}
	  });
	  
	  fragmentCaseModal.querySelector('.skip-animation-btn').addEventListener('click', function() {
		if (!isCaseOpening) {
		  openFragmentCaseWithoutAnimation(index, tempCase, lastSelectedItemId);
		}
	  });
	  
	  fragmentCaseModal.style.display = 'flex';
	}

	function createFragmentWeightedItemsList(caseData, boostedItemId = null) {
	  const weightedItems = [];
	  
	  caseData.contains.forEach(itemId => {
		const item = itemsDatabase.find(i => i.id === itemId);
		if (item) {
		  if (item.name.includes('(TimeLimited)') || item.id.endsWith('_rental') || item.isRental) {
			return; // Пропускаем арендованные предметы
		  }
		  
		  const baseChance = caseData.dropChances[item.rarity] || 0;
		  const boostedChance = itemId === boostedItemId ? baseChance * 95 : baseChance;
		  
		  for (let i = 0; i < boostedChance; i++) {
			weightedItems.push(itemId);
		  }
		}
	  });
	  
	  for (let i = weightedItems.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[weightedItems[i], weightedItems[j]] = [weightedItems[j], weightedItems[i]];
	  }
	  
	  return weightedItems;
	}

	function populateFragmentDropContainer(caseData, boostedItemId = null, resultItemId = null) {
	  const dropContainer = fragmentCaseModal.querySelector('.case-drop-items');
	  const weightedItems = createFragmentWeightedItemsList(caseData, boostedItemId);
	  
	  dropContainer.innerHTML = '';
	  
	  if (!resultItemId) {
		resultItemId = weightedItems[Math.floor(Math.random() * weightedItems.length)];
	  }
	  
	  let resultIndex = weightedItems.indexOf(resultItemId);
	  if (resultIndex === -1) resultIndex = 0;
	  
	  const displayItems = [];
	  const totalItems = weightedItems.length;
	  
	  for (let i = 0; i < 40; i++) {
		const index = (resultIndex - 40 + i + totalItems) % totalItems;
		displayItems.push(weightedItems[index]);
	  }
	  
	  displayItems.push(resultItemId);
	  
	  for (let i = 0; i < 9; i++) {
		const index = (resultIndex + i + 1) % totalItems;
		displayItems.push(weightedItems[index]);
	  }
	  
	  displayItems.forEach((itemId, index) => {
		const item = itemsDatabase.find(i => i.id === itemId);
		if (item) {
		  const rarity = rarities[item.rarity];
		  const isResultItem = index === 40; // 40-й элемент - это результат
		  
		  const itemElement = document.createElement('div');
		  itemElement.className = 'drop-item';
		  itemElement.setAttribute('data-item-id', itemId);
		  itemElement.style.cssText = `
			width: 206px;
			background-color: #2a2a2a;
			padding: 8px;
			border-radius: 6px;
			text-align: center;
			transition: all 0.3s;
			flex-shrink: 0;
		  `;
		  itemElement.innerHTML = `
				<div style="position: relative; display: inline-block;">
					<img src="${item.image}" alt="${item.name}" width="140" style="border-radius: 0px;">
					${item.isRental ? `<img src="images/item_time_limited.png" alt="Арендовано" style="position: absolute; top: 0; left: 0; width: 80px; height: auto; pointer-events: none;">` : ''}
				</div>
				<div class="${rarity.color}" style="width: 200px; padding: 2px 4px; border-radius: 3px; margin-top: 2px; font-size: 12px;">
					<div style="text-align: left; transform: translateX(2px); font-size: 14px; margin-top: 3px; height: 25px; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
				</div>
			`;
		  dropContainer.appendChild(itemElement);
		}
	  });
	  
	  return resultItemId;
	}

	function openFragmentCaseWithAnimation(fragmentIndex, caseData, boostedItemId = null) {
	  isCaseOpening = true;
	  
	  const openBtn = fragmentCaseModal.querySelector('.open-case-start-btn');
	  const skipBtn = fragmentCaseModal.querySelector('.skip-animation-btn');
	  const closeBtn = fragmentCaseModal.querySelector('.case-close-btn');
	  
	  openBtn.disabled = true;
	  skipBtn.disabled = true;
	  closeBtn.disabled = true;
	  openBtn.textContent = 'Открывается...';
	  openBtn.style.backgroundColor = '#666';
	  
	  const dropContainer = fragmentCaseModal.querySelector('.case-drop-container');
	  const dropItems = fragmentCaseModal.querySelector('.case-drop-items');
	  
	  const resultItemId = populateFragmentDropContainer(caseData, boostedItemId);
	  const resultItem = itemsDatabase.find(i => i.id === resultItemId);
	  
	  const itemWidth = 80 + 10; // width + gap
	  const targetPosition = 40 * itemWidth; // 40-й предмет должен оказаться по центру
	  
	  dropItems.style.transition = 'none';
	  dropItems.style.transform = 'translateX(0)';
	  
	  setTimeout(() => {
		dropItems.style.transition = 'transform 3.5s cubic-bezier(0.1, 0.8, 0.2, 1)';
		dropItems.style.transform = `translateX(-${targetPosition}px)`;
		
		setTimeout(() => {
		  showFragmentCaseResult(fragmentIndex, resultItem);
		  isCaseOpening = false;
		}, 3500);
	  }, 100);
	  
	  updateSouzRang(caseData.rarity);
	}

	function openFragmentCaseWithoutAnimation(fragmentIndex, caseData, boostedItemId = null) {
	  const resultItemId = populateFragmentDropContainer(caseData, boostedItemId);
	  const resultItem = itemsDatabase.find(i => i.id === resultItemId);
	  
	  setTimeout(() => {
		showFragmentCaseResult(fragmentIndex, resultItem);
	  }, 100);
	  updateSouzRang(caseData.rarity);
	}

	function showFragmentCaseResult(fragmentIndex, item) {
	  const fragmentItem = inventory[fragmentIndex];
	  
	  fragmentCaseModal.innerHTML = `
		<div class="case-result" style="background-color: rgb(30 30 30 / 85%); padding: 30px; border-radius: 8px; text-align: center; max-width: 500px;">
		  <h2>Вы получили:</h2>
		  <div style="margin: 20px 0;">
			<img src="${item.image}" alt="${item.name}" width="150">
			<div style="font-size: 20px; margin: 10px 0;">${item.name}</div>
			<div class="case-item-rarity ${rarities[item.rarity].color}" style="padding: 5px 10px; border-radius: 4px; display: inline-block; font-weight: bold;">
			  ${rarities[item.rarity].name}
			</div>
		  </div>
		  <button class="close-case-result-btn" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
			Закрыть
		  </button>
		</div>
	  `;
	  
	  removeFragments(fragmentItem.id, 10);
	  
	  inventory.push({
		id: item.id,
		name: item.name,
		rarity: item.rarity,
		image: item.image
	  });
	  
	  fragmentCaseModal.querySelector('.close-case-result-btn').addEventListener('click', function() {
		fragmentCaseModal.style.display = 'none';
		updateInventory();
	  });
	  
	  const stars_rairty = {
		'common': 0,
		'uncommon': 2,
		'rare': 4,
		'epic': 8,
		'legendary': 16,
		'arcane': 32,
		'nameless': 64,
		'none': 128
	  }
	  const starsGain = stars_rairty[item.rarity] || 0;
	  const starsToAdd = starsGain * 125;
	  
	  addExp(starsToAdd);
	  saveGameState();
	}

	function showMassOpenConfirmModal(fragmentItem, maxOpens, totalFrags, index, rarity) {
		const estimatedValue = "??"; // Можно посчитать среднюю цену, если нужно
		
		fragmentCaseModal.innerHTML = `
			<div class="confirm-modal" style="background: rgba(30,30,30,0.95); padding: 30px; border-radius: 12px; text-align: center; max-width: 500px; border: 1px solid #444; box-shadow: 0 0 20px rgba(0,0,0,0.8);">
				<h2 style="color: #fff; margin-top: 0;">Массовое открытие</h2>
				<div style="margin: 20px 0; font-size: 16px; color: #ccc;">
					<p>Вы собираетесь открыть <strong style="color: #4CAF50; font-size: 20px;">${maxOpens}</strong> кейсов.</p>
					<p>Будет использовано: <span style="color: #ff9800;">${totalFrags}</span> фрагментов (${fragmentItem.name}).</p>
					<p style="font-size: 14px; color: #888;">Опыт будет начислен за все ${maxOpens} предметов.</p>
				</div>
				
				<div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
					<button id="confirm-mass-open" style="padding: 12px 25px; background: #4CAF50; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: bold;">
						Открыть всё
					</button>
					<button id="cancel-mass-open" style="padding: 12px 25px; background: #f44336; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: bold;">
						Отмена
					</button>
				</div>
			</div>
		`;

		fragmentCaseModal.style.display = 'flex';

		document.getElementById('cancel-mass-open').addEventListener('click', () => {
			fragmentCaseModal.style.display = 'none';
		});

		document.getElementById('confirm-mass-open').addEventListener('click', () => {
			fragmentCaseModal.style.display = 'none'; // Закрываем подтверждение
			runMassOpenSequence(index, rarity, maxOpens); // Запускаем открытие
		});
	}

	function runMassOpenSequence(index, rarity, totalOpens) {
		isCaseOpening = true;
		
		fragmentCaseModal.innerHTML = `
			<div class="mass-open-progress" style="background: rgba(30,30,30,0.95); padding: 40px; border-radius: 12px; text-align: center; max-width: 500px;">
				<h2 style="color: #fff;">Открытие...</h2>
				<div style="font-size: 24px; color: #4CAF50; margin: 10px 0;"><span id="progress-count">0</span> / ${totalOpens}</div>
				<div style="width: 100%; background: #333; height: 10px; border-radius: 5px; overflow: hidden; margin: 20px 0;">
					<div id="progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); transition: width 0.1s;"></div>
				</div>
				<div id="progress-status" style="color: #aaa;">Генерация предметов...</div>
			</div>
		`;
		fragmentCaseModal.style.display = 'flex';

		const starsMap = {
			'common': 0, 'uncommon': 2, 'rare': 4, 'epic': 8,
			'legendary': 16, 'arcane': 32, 'nameless': 64, 'none': 128
		};

		const pool = itemsDatabase.filter(item => 
			item.rarity === rarity && 
			!item.name.endsWith('Fragment') && !item.isCase && !item.isRental && 
			!item.name.includes('(TimeLimited)')
		);

		if (pool.length === 0) {
			showToast('Ошибка: нет предметов для выпадения', true);
			isCaseOpening = false;
			updateInventory();
			return;
		}

		let itemsWon = [];
		let totalStarsGain = 0; // НАКОПИТЕЛЬНЫЙ ОПЫТ
		let currentOpen = 0;

		const step = () => {
			const batchSize = Math.min(10, totalOpens - currentOpen);
			
			for (let i = 0; i < batchSize; i++) {
				const randomItem = pool[Math.floor(Math.random() * pool.length)];
				itemsWon.push(randomItem);
				
				const stars = starsMap[randomItem.rarity] || 0;
				totalStarsGain += (stars * 125); 
			}
			
			currentOpen += batchSize;
			
			document.getElementById('progress-count').textContent = currentOpen;
			document.getElementById('progress-bar').style.width = `${(currentOpen / totalOpens) * 100}%`;
			
			if (currentOpen < totalOpens) {
				setTimeout(step, 5); // Небольшая задержка
			} else {
				finishMassOpen(totalStarsGain);
			}
		};

		const finishMassOpen = (finalExpAmount) => {
			let toRemove = totalOpens * 10;
			for (let i = inventory.length - 1; i >= 0; i--) {
				if (inventory[i].id === inventory[index].id) {
					const count = inventory[i].count || 1;
					if (count <= toRemove) {
						toRemove -= count;
						inventory.splice(i, 1);
					} else {
						inventory[i].count -= toRemove;
						toRemove = 0;
					}
					if (toRemove <= 0) break;
				}
			}
			
			const souzExp = [rarity, totalOpens];
			inventory.push(...itemsWon);
			addExp(finalExpAmount);
			updateSouzRang(souzExp);
			saveGameState();
			showMassOpenResult(itemsWon);
			isCaseOpening = false;
		};

		step();
	}

	function showMassOpenResult(items) {
		const grouped = {};
		items.forEach(item => {
			if (!grouped[item.id]) grouped[item.id] = { ...item, count: 0 };
			grouped[item.id].count++;
		});

		const sorted = Object.values(grouped).sort((a, b) => {
			const oA = rarities[a.rarity]?.order || 0;
			const oB = rarities[b.rarity]?.order || 0;
			return oB - oA;
		});

		let html = sorted.map(item => {
			const rInfo = rarities[item.rarity];
			const color = rInfo ? rInfo.colorHex : '#fff';
			const rName = rInfo ? rInfo.name : item.rarity;
			return `
				<div style="display:flex; align-items:center; justify-content:space-between; background:#2a2a2a; padding:10px; margin:6px 0; border-radius:6px; border-left: 5px solid ${color};">
					<div style="display:flex; align-items:center; gap:12px;">
						<img src="${item.image}" width="50" style="border-radius:4px; background:#111; object-fit:cover;">
						<div style="text-align:left;">
							<div style="font-weight:bold; color:#fff; font-size:14px; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
							<div style="font-size:12px; color:${color}; font-weight:600;">${rName}</div>
						</div>
					</div>
					<div style="background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:4px; color:#gold; font-weight:bold;">x${item.count}</div>
				</div>
			`;
		}).join('');

		fragmentCaseModal.innerHTML = `
			<div class="mass-result" style="background: rgba(30,30,30,0.98); padding: 30px; border-radius: 12px; text-align: center; max-width: 600px; max-height: 80vh; display: flex; flex-direction: column;">
				<h2 style="color: #4CAF50; margin: 0 0 10px 0;">Открытие завершено!</h2>
				<p style="color: #aaa; margin: 0 0 20px 0;">Получено предметов: <strong style="color:#fff">${items.length}</strong></p>
				
				<div style="flex: 1; overflow-y: auto; padding-right: 5px; text-align: left;">
					${html}
				</div>
				
				<button id="close-mass-result" style="margin-top: 20px; padding: 12px 30px; background: #4CAF50; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: bold; width: 100%;">
					Забрать в инвентарь
				</button>
			</div>
		`;

		fragmentCaseModal.style.display = 'flex';
		
		document.getElementById('close-mass-result').addEventListener('click', () => {
			fragmentCaseModal.style.display = 'none';
			updateInventory(); // Полная перерисовка инвентаря
		});
	}

	function createFragmentWeightedItemsList(caseData, boostedItemId = null) {
	  const weightedItems = [];
	  
	  caseData.contains.forEach(itemId => {
		const item = itemsDatabase.find(i => i.id === itemId);
		if (item) {
		  if (item.name.includes('(TimeLimited)') || item.id.endsWith('_rental') || item.isRental) {
			return; // Пропускаем арендованные предметы
		  }
		  
		  const baseChance = caseData.dropChances[item.rarity] || 0;
		  const boostedChance = itemId === boostedItemId ? baseChance * 95 : baseChance;
		  
		  for (let i = 0; i < boostedChance; i++) {
			weightedItems.push(itemId);
		  }
		}
	  });
	  
	  for (let i = weightedItems.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[weightedItems[i], weightedItems[j]] = [weightedItems[j], weightedItems[i]];
	  }
	  
	  return weightedItems;
	}

	function populateFragmentDropContainer(caseData, boostedItemId = null, resultItemId = null) {
	  const dropContainer = fragmentCaseModal.querySelector('.case-drop-items');
	  const weightedItems = createFragmentWeightedItemsList(caseData, boostedItemId);
	  
	  dropContainer.innerHTML = '';
	  
	  if (!resultItemId) {
		resultItemId = weightedItems[Math.floor(Math.random() * weightedItems.length)];
	  }
	  
	  let resultIndex = weightedItems.indexOf(resultItemId);
	  if (resultIndex === -1) resultIndex = 0;
	  
	  const displayItems = [];
	  const totalItems = weightedItems.length;
	  
	  for (let i = 0; i < 40; i++) {
		const index = (resultIndex - 40 + i + totalItems) % totalItems;
		displayItems.push(weightedItems[index]);
	  }
	  
	  displayItems.push(resultItemId);
	  
	  for (let i = 0; i < 9; i++) {
		const index = (resultIndex + i + 1) % totalItems;
		displayItems.push(weightedItems[index]);
	  }
	  
	  displayItems.forEach((itemId, index) => {
		const item = itemsDatabase.find(i => i.id === itemId);
		if (item) {
		  const rarity = rarities[item.rarity];
		  const isResultItem = index === 40; // 40-й элемент - это результат
		  
		  const itemElement = document.createElement('div');
		  itemElement.className = 'drop-item';
		  itemElement.setAttribute('data-item-id', itemId);
		  itemElement.style.cssText = `
			width: 206px;
			background-color: #2a2a2a;
			padding: 8px;
			border-radius: 6px;
			text-align: center;
			transition: all 0.3s;
			flex-shrink: 0;
		  `;
		  itemElement.innerHTML = `
				<div style="position: relative; display: inline-block;">
					<img src="${item.image}" alt="${item.name}" width="140" style="border-radius: 0px;">
					${item.isRental ? `<img src="images/item_time_limited.png" alt="Арендовано" style="position: absolute; top: 0; left: 0; width: 80px; height: auto; pointer-events: none;">` : ''}
				</div>
				<div class="${rarity.color}" style="width: 200px; padding: 2px 4px; border-radius: 3px; margin-top: 2px; font-size: 12px;">
					<div style="text-align: left; transform: translateX(2px); font-size: 14px; margin-top: 3px; height: 25px; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
				</div>
			`;
		  dropContainer.appendChild(itemElement);
		}
	  });
	  
	  return resultItemId;
	}

	function openFragmentCaseWithAnimation(fragmentIndex, caseData, boostedItemId = null) {
		if (isCaseOpening) return; // Защита от повторного вызова
		isCaseOpening = true;
		
		const openBtn = fragmentCaseModal.querySelector('.open-case-start-btn');
		const skipBtn = fragmentCaseModal.querySelector('.skip-animation-btn');
		const closeBtn = fragmentCaseModal.querySelector('.case-close-btn');
		
		openBtn.disabled = true;
		skipBtn.disabled = true;
		closeBtn.disabled = true;
		openBtn.textContent = 'Открывается...';
		openBtn.style.backgroundColor = '#666';
		
		const dropContainer = fragmentCaseModal.querySelector('.case-drop-container');
		const dropItems = fragmentCaseModal.querySelector('.case-drop-items');
		
		const resultItemId = populateFragmentDropContainer(caseData, boostedItemId);
		const resultItem = itemsDatabase.find(i => i.id === resultItemId);
		
		const itemWidth = 80 + 10; // width + gap
		const targetPosition = 40 * itemWidth; // 40-й предмет должен оказаться по центру
		
		dropItems.style.transition = 'none';
		dropItems.style.transform = 'translateX(0)';
		
		setTimeout(() => {
			dropItems.style.transition = 'transform 3.5s cubic-bezier(0.1, 0.8, 0.2, 1)';
			dropItems.style.transform = `translateX(-${targetPosition}px)`;
			
			setTimeout(() => {
				// Передаем false для стандартной логики
				showFragmentCaseResult(fragmentIndex, resultItem, false);
			}, 3500);
		}, 100);
		
		updateSouzRang(caseData.rarity);
	}

	function openFragmentCaseWithoutAnimation(fragmentIndex, caseData, boostedItemId = null) {
		if (isCaseOpening) return; // Защита от повторного вызова
		isCaseOpening = true;
		
		const resultItemId = populateFragmentDropContainer(caseData, boostedItemId);
		const resultItem = itemsDatabase.find(i => i.id === resultItemId);
		
		setTimeout(() => {
			// Передаем false для стандартной логики
			showFragmentCaseResult(fragmentIndex, resultItem, true);
		}, 100);
		
		updateSouzRang(caseData.rarity);
	}

	// Добавлен третий параметр skipViewer
	function showFragmentCaseResult(fragmentIndex, item, skipViewer = false) {
		const fragmentItem = inventory[fragmentIndex];
		
		// Добавляем предмет в инвентарь
		removeFragments(fragmentItem.id, 10);
		
		inventory.push({
			id: item.id,
			name: item.name,
			rarity: item.rarity,
			image: item.image
		});
		
		// Проверяем, можно ли открыть 3D-осмотр
		let canShow3D = false;
		if (!skipViewer) {
			canShow3D = fxCan3D(item);
		}
		
		if (canShow3D) {
			// Открываем 3D-осмотр
			const tempContainer = document.createElement('div');
			document.body.appendChild(tempContainer);
			setup3DViewer(tempContainer, item, item);
			tempContainer.click();
			document.body.removeChild(tempContainer);
			
			// Закрываем модалку фрагментов
			if (fragmentCaseModal) {
				fragmentCaseModal.style.display = 'none';
			}
			
			// Сбрасываем флаг сразу
			isCaseOpening = false;
			
			// Обновляем инвентарь
			updateInventory();
			saveGameState();
		} else {
			// Показываем стандартное модальное окно
			const rarityInfo = (typeof rarities !== 'undefined' && rarities[item.rarity]) 
				? rarities[item.rarity] 
				: { color: 'gray', name: item.rarity };
			
			fragmentCaseModal.innerHTML = `
				<div class="case-result" style="background-color: rgb(30 30 30 / 85%); padding: 30px; border-radius: 8px; text-align: center; max-width: 500px;">
					<h2>Вы получили:</h2>
					<div style="margin: 20px 0;">
						<img src="${item.image}" alt="${item.name}" width="150">
						<div style="font-size: 20px; margin: 10px 0;">${item.name}</div>
						<div class="case-item-rarity ${rarityInfo.color}" style="padding: 5px 10px; border-radius: 4px; display: inline-block; font-weight: bold;">
							${rarityInfo.name}
						</div>
					</div>
					<button class="close-case-result-btn" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
						Закрыть
					</button>
				</div>
			`;
			
			// Сбрасываем флаг ТОЛЬКО после закрытия результата
			fragmentCaseModal.querySelector('.close-case-result-btn').addEventListener('click', function() {
				fragmentCaseModal.style.display = 'none';
				updateInventory();
				isCaseOpening = false; // Разрешаем открывать следующий кейс
			});
			
			saveGameState();
		}
		
		const stars_rairty = {
			'common': 0,
			'uncommon': 2,
			'rare': 4,
			'epic': 8,
			'legendary': 16,
			'arcane': 32,
			'nameless': 64,
			'none': 128
		}
		const starsGain = stars_rairty[item.rarity] || 0;
		const starsToAdd = starsGain * 125;
		
		addExp(starsToAdd);
	}

	function sellFragment(index, price) {
	  const fragmentItem = inventory[index];
	  const shopItem = itemsDatabase.find(item => item.id === fragmentItem.id);
	  
	  if (shopItem && shopItem.itemInStore === false) {
		showToast('Этот предмет нельзя продать!', true);
		return;
	  }
	  
	  let totalPrice = Math.round(price * 100) / 100;
	  
	  if (fragmentItem.charm) {
		const charmItem = itemsDatabase.find(item => item.id === fragmentItem.charm.id);
		if (charmItem) {
		  inventory.push({
			id: charmItem.id,
			name: charmItem.name,
			rarity: charmItem.rarity,
			image: charmItem.image
		  });
		  showToast(`Брелок "${charmItem.name}" снят и возвращен в инвентарь`);
		}
	  }
	  
	  if (fragmentItem.stickers && fragmentItem.stickers.length > 0) {
		fragmentItem.stickers.forEach(sticker => {
		  const stickerItem = itemsDatabase.find(item => item.id === sticker.id);
		  if (stickerItem) {
			totalPrice += Math.round((stickerItem.price * 0.1) * 100) / 100;
		  }
		});
	  }
	  
	  if (shopItem && shopItem.priceMultiply > 0) {
		const newPrice = Math.max(0, shopItem.price - shopItem.priceMultiply);
		shopItem.price = newPrice;
		updateItemPriceInUI(shopItem);
	  }
	  
	  if (shopItem && shopItem.name.endsWith('Fragment')) {
		const itemElement = document.getElementById(shopItem.id);
		if (itemElement) {
		  const currentStock = parseInt(itemElement.querySelector('.available-stock').textContent);
                  const btn = itemElement.querySelector('.find-on-platform-btn') || itemElement.querySelector('.rent-item-btn');
                  const max = btn ? parseInt(btn.getAttribute('data-max')) : 0;
		  updateStock(itemElement, currentStock + 1, max);
		} else {
			shopItem.stock = shopItem.stock + 1;
		}
	  }
	  
	  inventory.splice(index, 1);
	  
	  balance += Math.round(totalPrice * 100) / 100;
	  balance = Math.round(balance * 100) / 100;
	  
	  addExp(Math.round(totalPrice));
	  balanceAmount.textContent = balance.toLocaleString('ru-RU');
	  UpdateStatrackFrame(balance);
	  updateMMRang(Math.round(totalPrice));
	  
	  updateInventory();
	  sortItemsByPrice();
	  
	  showToast(`Фрагмент продан за ${totalPrice.toFixed(2)} ₽`);
	  saveGameState();
	}

	function removeFragments(fragmentId, count) {
	  let removed = 0;
	  const indicesToRemove = [];
	  
	  inventory.forEach((item, index) => {
		if (item.id === fragmentId && !item.isRental && removed < count) {
		  indicesToRemove.push(index);
		  removed++;
		}
	  });
	  
	  indicesToRemove.sort((a, b) => b - a).forEach(index => {
		inventory.splice(index, 1);
	  });
	  
	  return removed;
	}
	
	function addRemoveStickersButtonToInventory() {
		const inventoryActions = document.querySelector('.inventory-actions');
		if (inventoryActions && !document.getElementById('remove-stickers-btn')) {
			const removeStickersBtn = document.createElement('button');
			removeStickersBtn.id = 'remove-stickers-btn';
			removeStickersBtn.textContent = 'Снять стикеры/брелоки';
			removeStickersBtn.style.padding = '10px 15px';
			removeStickersBtn.style.backgroundColor = '#4caf50';
			removeStickersBtn.style.color = 'white';
			removeStickersBtn.style.border = 'none';
			removeStickersBtn.style.borderRadius = '4px';
			removeStickersBtn.style.cursor = 'pointer';
			removeStickersBtn.style.marginLeft = '10px';
			
			removeStickersBtn.addEventListener('click', openRemoveStickersModal);
			
			const exportBtn = document.getElementById('export-database-btn');
			const resetBtn = document.getElementById('reset-save-btn');
			
			if (resetBtn) {
				resetBtn.parentNode.insertBefore(removeStickersBtn, resetBtn.nextSibling);
			} else if (exportBtn) {
				exportBtn.parentNode.insertBefore(removeStickersBtn, exportBtn.nextSibling);
			} else {
				inventoryActions.appendChild(removeStickersBtn);
			}
		}
	}
	
	function addQuickOpenButtonToInventory() {
		const inventoryActions = document.querySelector('.inventory-actions');
		if (!inventoryActions) return;

		const existingContainer = document.getElementById('fast-actions');
		if (existingContainer) {
			existingContainer.remove();
		}

		const DivFastAct = document.createElement('div');
		DivFastAct.id = 'fast-actions';
		DivFastAct.style.display = 'flex';
		DivFastAct.style.flexDirection = 'column';
		DivFastAct.style.marginLeft = '10px';
		DivFastAct.style.gap = '8px'; // вертикальный отступ между кнопками

		const quickOpenBtn = document.createElement('button');
		quickOpenBtn.id = 'quick-open-cases-btn';
		quickOpenBtn.textContent = 'Быстрое открытие выбранного';
		quickOpenBtn.style.padding = '10px 15px';
		quickOpenBtn.style.backgroundColor = '#4caf50';
		quickOpenBtn.style.color = 'white';
		quickOpenBtn.style.border = 'none';
		quickOpenBtn.style.borderRadius = '4px';
		quickOpenBtn.style.cursor = 'pointer';
		quickOpenBtn.addEventListener('click', openQuickOpenModal);

		const quickCraftBtn = document.createElement('button');
		quickCraftBtn.id = 'quick-craft-btn';
		quickCraftBtn.textContent = 'Быстрый крафт';
		quickCraftBtn.style.padding = '10px 15px';
		quickCraftBtn.style.backgroundColor = '#4caf50';
		quickCraftBtn.style.color = 'white';
		quickCraftBtn.style.border = 'none';
		quickCraftBtn.style.borderRadius = '4px';
		quickCraftBtn.style.cursor = 'pointer';
		quickCraftBtn.addEventListener('click', openQuickCraftModal);

		DivFastAct.appendChild(quickOpenBtn);
		DivFastAct.appendChild(quickCraftBtn);

		const removeStickersBtn = document.getElementById('remove-stickers-btn');
		const exportBtn = document.getElementById('export-database-btn');
		const resetBtn = document.getElementById('reset-save-btn');

		if (removeStickersBtn) {
			removeStickersBtn.parentNode.insertBefore(DivFastAct, removeStickersBtn.nextSibling);
		} else if (resetBtn) {
			resetBtn.parentNode.insertBefore(DivFastAct, resetBtn.nextSibling);
		} else if (exportBtn) {
			exportBtn.parentNode.insertBefore(DivFastAct, exportBtn.nextSibling);
		} else {
			inventoryActions.appendChild(DivFastAct);
		}
	}
	
	let quickCraftSelectedIndices = [];

	function openQuickCraftModal() {
		const existingModal = document.getElementById('quick-craft-modal');
		if (existingModal) existingModal.remove();

		const modal = document.createElement('div');
		modal.id = 'quick-craft-modal';
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100vw';
		modal.style.height = '100vh';
		modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
		modal.style.display = 'flex';
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';
		modal.style.zIndex = '10000';
		modal.style.color = 'white';

		const modalContent = document.createElement('div');
		modalContent.style.backgroundColor = '#1e1e1e';
		modalContent.style.padding = '20px';
		modalContent.style.borderRadius = '8px';
		modalContent.style.maxWidth = '900px';
		modalContent.style.width = '95%';
		modalContent.style.maxHeight = '85vh';
		modalContent.style.overflowY = 'auto';

		const modalHeader = document.createElement('h3');
		modalHeader.textContent = 'Быстрый крафт (только предметы с возможностью улучшения)';
		modalHeader.style.marginTop = '0';
		modalContent.appendChild(modalHeader);

		const itemsContainer = document.createElement('div');
		itemsContainer.style.display = 'flex';
		itemsContainer.style.flexWrap = 'wrap';
		itemsContainer.style.gap = '10px';
		itemsContainer.style.justifyContent = 'flex-start';

		const craftableEntries = inventory
			.map((item, index) => ({ item, index }))
			.filter(({ item, index }) => {
				if (item.isRental) return false;
				if (item.name && item.name.startsWith('Medal')) {
					if (item.slot !== undefined && item.slot !== null) {
						return false;
					}
				}
				const dbItem = itemsDatabase.find(db => db.id === item.id);
				if (!dbItem) return false;
				const rarityConfig = rarities[item.rarity];
				return rarityConfig && rarityConfig.next; // есть next-редкость
			});

		if (craftableEntries.length === 0) {
			modalContent.innerHTML += '<p>Нет предметов, подходящих для улучшения.</p>';
		} else {
			craftableEntries.forEach(({ item, index }) => {
				const itemEl = document.createElement('div');
				itemEl.className = 'quick-craft-inventory-item';
				itemEl.dataset.index = index;
				itemEl.style.width = 'calc(33.333% - 7px)';
				itemEl.style.boxSizing = 'border-box';
				itemEl.style.border = '2px solid transparent';
				itemEl.style.borderRadius = '6px';
				itemEl.style.padding = '8px';
				itemEl.style.cursor = 'pointer';
				itemEl.style.backgroundColor = '#2a2a2a';
				itemEl.style.textAlign = 'center';

				const rarityInfo = rarities[item.rarity] || {};
				
				const imgContainer = document.createElement('div');
				imgContainer.style.position = 'relative';
				imgContainer.style.display = 'inline-block';
				imgContainer.style.marginBottom = '6px';

				const img = document.createElement('img');
				img.src = item.image;
				img.alt = item.name;
				img.width = 60;
				img.style.display = 'block';
				imgContainer.appendChild(img);

				const slotsContainer = document.createElement('div');
				slotsContainer.style.display = 'flex';
				slotsContainer.style.justifyContent = 'center';
				slotsContainer.style.margin = '4px 0';
				slotsContainer.style.gap = '2px';

				const stickers = Array.isArray(item.stickers) ? [...item.stickers].reverse() : [];
				for (let i = 1; i <= 4; i++) {
					const slot = document.createElement('div');
					slot.className = 'slot sticker-slot';
					slot.style = 'transform: translateY(5px) scale(2.3)';

					if (stickers[i - 1]) {
						const stickerImg = document.createElement('img');
						stickerImg.src = stickers[i - 1].image;
						stickerImg.width = 10;
						stickerImg.height = 10;
						stickerImg.style.objectFit = 'cover';
						slot.appendChild(stickerImg);
					}
					slotsContainer.prepend(slot);
				}

				const charmSlot = document.createElement('div');
				charmSlot.className = 'slot charm-slot';
				charmSlot.style = 'transform: translate(-87px, -35px) scale(2.1)';

				if (item.charm) {
					const charmImg = document.createElement('img');
					charmImg.src = item.charm.image;
					charmImg.width = 14;
					charmImg.height = 14;
					charmImg.style.objectFit = 'cover';
					charmSlot.appendChild(charmImg);
				}
				slotsContainer.appendChild(charmSlot);

				const nameEl = document.createElement('div');
				nameEl.textContent = item.name;
				nameEl.style.fontSize = '11px';
				nameEl.style.marginTop = '4px';

				const rarityEl = document.createElement('div');
				rarityEl.textContent = rarityInfo.name || item.rarity;
				rarityEl.className = `inventory-item-rarity ${rarityInfo.color || ''}`;
				rarityEl.style.fontSize = '10px';
				rarityEl.style.marginTop = '2px';

				imgContainer.appendChild(slotsContainer); // или отдельно — как в инвентаре

				itemEl.appendChild(imgContainer);
				itemEl.appendChild(nameEl);
				itemEl.appendChild(rarityEl);

				itemEl.addEventListener('click', () => {
					const isSelected = quickCraftSelectedIndices.includes(index);
					if (isSelected) {
						quickCraftSelectedIndices = quickCraftSelectedIndices.filter(i => i !== index);
						itemEl.style.border = '2px solid transparent';
					} else {
						quickCraftSelectedIndices.push(index);
						itemEl.style.border = '2px solid gold';
					}
				});

				itemsContainer.appendChild(itemEl);
			});
		}

		modalContent.appendChild(itemsContainer);

		const selectAllBtn = document.createElement('button');
		selectAllBtn.textContent = 'Выделить всё';
		selectAllBtn.style.marginTop = '12px';
		selectAllBtn.style.padding = '8px 12px';
		selectAllBtn.style.backgroundColor = '#4CAF50';
		selectAllBtn.style.color = 'white';
		selectAllBtn.style.border = 'none';
		selectAllBtn.style.borderRadius = '4px';
		selectAllBtn.style.cursor = 'pointer';
		selectAllBtn.addEventListener('click', () => {
			quickCraftSelectedIndices = craftableEntries.map(({ index }) => index);
			document.querySelectorAll('.quick-craft-inventory-item').forEach(el => {
				el.style.border = '2px solid gold';
			});
		});
		modalContent.appendChild(selectAllBtn);

		const craftBulkBtn = document.createElement('button');
		craftBulkBtn.textContent = 'Создать с максимальной выгодой';
		craftBulkBtn.style.marginInline = '10px';
		craftBulkBtn.style.marginTop = '10px';
		craftBulkBtn.style.padding = '10px 16px';
		craftBulkBtn.style.backgroundColor = '#2196F3';
		craftBulkBtn.style.color = 'white';
		craftBulkBtn.style.border = 'none';
		craftBulkBtn.style.borderRadius = '4px';
		craftBulkBtn.style.cursor = 'pointer';
		craftBulkBtn.addEventListener('click', () => {
			if (quickCraftSelectedIndices.length === 0) {
				showToast('Ничего не выбрано', true);
				return;
			}
			performOptimalBulkCraft([...quickCraftSelectedIndices]);
			modal.remove();
		});
		modalContent.appendChild(craftBulkBtn);

		const closeBtn = document.createElement('button');
		closeBtn.textContent = 'Закрыть';
		closeBtn.style.marginTop = '10px';
		closeBtn.style.padding = '8px 12px';
		closeBtn.style.backgroundColor = '#f44336';
		closeBtn.style.color = 'white';
		closeBtn.style.border = 'none';
		closeBtn.style.borderRadius = '4px';
		closeBtn.style.cursor = 'pointer';
		closeBtn.addEventListener('click', () => modal.remove());
		modalContent.appendChild(closeBtn);

		modal.appendChild(modalContent);
		document.body.appendChild(modal);

		modal.addEventListener('click', (e) => {
			if (e.target === modal) modal.remove();
		});
	}
	
	function performOptimalBulkCraft(selectedIndices) {
		if (selectedIndices.length < 10) {
			showToast('Нужно минимум 10 предметов', true);
			return;
		}

		const dbMap = new Map(itemsDatabase.map(item => [item.id, item]));
		
		const poolsByRarity = {};
		const validCount = selectedIndices.reduce((count, idx) => {
			const item = inventory[idx];
			if (!item || item.isRental) return count;
			
			const r = item.rarity;
			if (!poolsByRarity[r]) poolsByRarity[r] = [];
			poolsByRarity[r].push({ index: idx, item: item, used: false });
			return count + 1;
		}, 0);

		if (validCount < 10) {
			showToast('Недостаточно подходящих предметов', true);
			return;
		}

		const craftableRarities = Object.keys(rarities).filter(r => rarities[r].next);
		const sortedRarityKeys = craftableRarities.sort((a, b) => 
			(rarities[a]?.order || 0) - (rarities[b]?.order || 0)
		);

		if (sortedRarityKeys.length === 0) {
			showToast('Нет доступных цепочек крафта', true);
			return;
		}

		let totalCraftedCount = 0;
		let itemsToRemoveIndices = new Set();
		let newlyCraftedItems = [];
		
		let freshItemsBuffer = []; 

		for (let i = 0; i < sortedRarityKeys.length; i++) {
			const currentBaseRarity = sortedRarityKeys[i];
			const nextRarity = rarities[currentBaseRarity].next;
			if (!nextRarity) continue;

			if (freshItemsBuffer.length > 0) {
				freshItemsBuffer.forEach(fresh => {
					if (!poolsByRarity[fresh.item.rarity]) poolsByRarity[fresh.item.rarity] = [];
					poolsByRarity[fresh.item.rarity].push(fresh);
				});
				freshItemsBuffer = [];
			}

			const basePool = poolsByRarity[currentBaseRarity] || [];
			
			let hasCandidates = false;
			for(let k=0; k<=i; k++) {
				const rKey = sortedRarityKeys[k];
				if (poolsByRarity[rKey] && poolsByRarity[rKey].some(p => !p.used)) {
					hasCandidates = true; 
					break;
				}
			}
			if (!hasCandidates) continue;

			while (true) {
				let candidates = [];
				
				if (basePool.length) {
					for (let p of basePool) if (!p.used) candidates.push(p);
				}
				
				for (let k = 0; k < i; k++) {
					const rKey = sortedRarityKeys[k];
					const pool = poolsByRarity[rKey];
					if (pool) {
						for (let p of pool) if (!p.used) candidates.push(p);
					}
				}

				if (candidates.length < 10) break;

				candidates.sort((a, b) => {
					const aIsBase = a.item.rarity === currentBaseRarity ? 1 : 0;
					const bIsBase = b.item.rarity === currentBaseRarity ? 1 : 0;
					if (aIsBase !== bIsBase) return bIsBase - aIsBase;
					return (rarities[a.item.rarity]?.order || 0) - (rarities[b.item.rarity]?.order || 0);
				});

				let splitIndex = candidates.findIndex(c => c.item.rarity !== currentBaseRarity);
				if (splitIndex === -1) splitIndex = candidates.length;
				
				const availableBaseItems = candidates.slice(0, splitIndex);
				const availableFillers = candidates.slice(splitIndex);

				if (availableBaseItems.length === 0) break; // Нет базы - нет доминирования

				let bestBatch = null;

				for (let baseCount = Math.min(10, availableBaseItems.length); baseCount >= 1; baseCount--) {
					const fillerCount = 10 - baseCount;
					if (fillerCount > availableFillers.length) continue;

					let isDominant = true;
					const otherCounts = {};
					let maxOther = 0;

					for (let f = 0; f < fillerCount; f++) {
						const r = availableFillers[f].item.rarity;
						otherCounts[r] = (otherCounts[r] || 0) + 1;
						if (otherCounts[r] >= baseCount) {
							isDominant = false;
							break;
						}
					}
					
					if (isDominant) {
						bestBatch = [
							...availableBaseItems.slice(0, baseCount),
							...availableFillers.slice(0, fillerCount)
						];
						break;
					}
				}

				if (!bestBatch) break;

				const typeCounts = { charms: 0, stickers: 0, withoutSlots: 0, others: 0 };
				bestBatch.forEach(p => {
					const db = dbMap.get(p.item.id);
					if (!db) return;
					if (db.isCharm) typeCounts.charms++;
					else if (db.isSticker) typeCounts.stickers++;
					else if (db.isItemWithoutSlot) typeCounts.withoutSlots++;
					else typeCounts.others++;
				});
				
				let craftType = 'other';
				if (typeCounts.charms > 0 && typeCounts.charms >= typeCounts.stickers && typeCounts.charms >= typeCounts.withoutSlots && typeCounts.charms >= typeCounts.others) craftType = 'charm';
				else if (typeCounts.stickers > 0 && typeCounts.stickers >= typeCounts.withoutSlots && typeCounts.stickers >= typeCounts.others) craftType = 'sticker';
				else if (typeCounts.withoutSlots > 0 && typeCounts.withoutSlots >= typeCounts.others) craftType = 'withoutSlot';

				const allStickers = [];
				const charmsToReturn = [];
				const collectionStats = {};

				bestBatch.forEach(p => {
					const item = p.item;
					const dbItem = dbMap.get(item.id);
					if (dbItem?.collection) collectionStats[dbItem.collection] = (collectionStats[dbItem.collection] || 0) + 1;
					if (item?.charm) charmsToReturn.push(item.charm);
					if (item?.stickers) {
						item.stickers.forEach(sticker => {
							const sDb = dbMap.get(sticker.id);
							if (sDb) allStickers.push({ id: sticker.id, name: sticker.name, rarity: sDb.rarity, image: sticker.image, value: sDb.price || 0 });
						});
					}
				});

				let totalStickersValue = allStickers.reduce((sum, s) => sum + s.value, 0) * 1.5;
				const stickersCount = totalStickersValue > 0 ? (totalStickersValue > 2000000 ? 4 : totalStickersValue > 1500000 ? 4 : totalStickersValue > 1000000 ? 3 : totalStickersValue > 500000 ? 2 : 1) : Math.floor(Math.random() * 5);
				const selectedStickers = (typeof selectStickersForCraft === 'function') ? selectStickersForCraft(allStickers, stickersCount, totalStickersValue) : allStickers.slice(0, stickersCount);

				let mostPopularCollection = Object.entries(collectionStats).sort((a,b) => b[1]-a[1])[0]?.[0];
				if (!mostPopularCollection) {
					const allCols = [...new Set(itemsDatabase.map(i => i.collection).filter(Boolean))];
					mostPopularCollection = allCols[0] || '';
				}

				let availableItems = itemsDatabase.filter(item =>
					item.rarity === nextRarity &&
					item.collection === mostPopularCollection &&
					((craftType === 'charm' && item.isCharm) || (craftType === 'sticker' && item.isSticker) || (craftType === 'withoutSlot' && item.isItemWithoutSlot) || (craftType === 'other' && !item.isCharm && !item.isSticker && !item.isItemWithoutSlot))
				);

				if (availableItems.length === 0) availableItems = itemsDatabase.filter(item => item.rarity === nextRarity);
				availableItems = availableItems.filter(item => !item.isRental && !item.id.endsWith('_rental'));

				if (availableItems.length > 0) {
					const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
					
					const craftedItem = {
						id: randomItem.id.replace(/_rental$/, ''),
						name: randomItem.name.replace(/ \(Аренда\)$/, ''),
						rarity: randomItem.rarity,
						image: randomItem.image,
						collection: randomItem.collection
					};
					if (selectedStickers.length > 0) craftedItem.stickers = selectedStickers.map(s => ({ id: s.id, name: s.name, image: s.image }));

					const stars_rarity = { 'common': 0, 'uncommon': 2, 'rare': 4, 'epic': 8, 'legendary': 16, 'arcane': 32, 'nameless': 64, 'none': 128 };
					const expGain = (stars_rarity[randomItem.rarity] || 0) * 125;

					newlyCraftedItems.push({ data: craftedItem, charmsToReturn, expGain });

					bestBatch.forEach(p => {
						p.used = true;
						itemsToRemoveIndices.add(p.index);
					});

					totalCraftedCount++;

					freshItemsBuffer.push({ index: -1, item: craftedItem, used: false });
				} else {
					break;
				}
			}
		}

		if (itemsToRemoveIndices.size > 0) {
			const sortedToRemove = Array.from(itemsToRemoveIndices).sort((a, b) => b - a);
			sortedToRemove.forEach(idx => inventory.splice(idx, 1));

			newlyCraftedItems.forEach(entry => {
				entry.charmsToReturn.forEach(charm => {
					const charmItem = dbMap.get(charm.id);
					if (charmItem) inventory.push({ id: charmItem.id, name: charmItem.name, rarity: charmItem.rarity, image: charmItem.image });
				});
				inventory.push(entry.data);
				addExp(entry.expGain);
			});

			if (newlyCraftedItems.length > 0) {
				const highestRarity = newlyCraftedItems.map(i => i.data.rarity).sort((a,b) => (rarities[b]?.order||0) - (rarities[a]?.order||0))[0];
				if(highestRarity) {
					addBattlePassStarsForCraft(highestRarity);
					updateSouzRang([highestRarity, newlyCraftedItems.length]);
				}
			}

			updateInventory();
			saveGameState();
			showToast(`Быстрый крафт завершен! Создано: ${totalCraftedCount}`);
		} else {
			showToast('Не удалось выполнить крафт', true);
		}
	}
	
	function getNextRarityForCount(targetRarity, count = 10) {
		const rarityChain = Object.keys(rarities).sort((a, b) => (rarities[a]?.order || 0) - (rarities[b]?.order || 0));
		const currentIndex = rarityChain.indexOf(targetRarity);
		if (currentIndex === -1 || currentIndex === rarityChain.length - 1) return null;
		return rarityChain[currentIndex + 1];
	}

	function getOptimalCraftRarity(indices) {
		const items = indices.map(i => inventory[i]).filter(Boolean);
		if (items.length !== 10) return { rarity: null, type: null };

		const typeCounts = { charms: 0, stickers: 0, withoutSlots: 0, others: 0 };
		const rarityCounts = {};

		items.forEach(item => {
			const dbItem = itemsDatabase.find(db => db.id === item.id);
			if (!dbItem) return;

			if (dbItem.isCharm) typeCounts.charms++;
			else if (dbItem.isSticker) typeCounts.stickers++;
			else if (dbItem.isItemWithoutSlot) typeCounts.withoutSlots++;
			else typeCounts.others++;

			rarityCounts[item.rarity] = (rarityCounts[item.rarity] || 0) + 1;
		});

		const allRaritiesInSet = Object.keys(rarityCounts);
		const sortedRarities = allRaritiesInSet.sort((a, b) => {
			return (rarities[b]?.order || 0) - (rarities[a]?.order || 0);
		});

		let bestBaseRarity = null;
		for (const rarity of sortedRarities) {
			const count = rarityCounts[rarity];
			const config = rarities[rarity];

			if (!config || !config.next) continue;

			let isDominant = true;
			for (const other in rarityCounts) {
				if (other === rarity) continue;
				if (rarityCounts[other] >= count) {
					isDominant = false;
					break;
				}
			}

			if (isDominant) {
				bestBaseRarity = rarity;
				break; // самая редкая доминирующая — наш выбор
			}
		}

		if (!bestBaseRarity) {
			return { rarity: null, type: null };
		}

		const resultRarity = rarities[bestBaseRarity].next;

		const maxType = Object.entries(typeCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
		let craftType;
		if (maxType === 'charms') craftType = 'charm';
		else if (maxType === 'stickers') craftType = 'sticker';
		else if (maxType === 'withoutSlots') craftType = 'withoutSlot';
		else craftType = 'other';

		return { rarity: resultRarity, type: craftType };
	}

	function craftItemsManually(indices, targetRarity, craftType) {

		const collectionStats = {};
		const allStickers = [];
		const charmsToReturn = [];

		indices.forEach(index => {
			const item = inventory[index];
			const dbItem = itemsDatabase.find(db => db.id === item?.id);
			if (dbItem?.collection) {
				collectionStats[dbItem.collection] = (collectionStats[dbItem.collection] || 0) + 1;
			}
			if (item?.charm) charmsToReturn.push(item.charm);
			if (item?.stickers) {
				item.stickers.forEach(sticker => {
					const stickerDb = itemsDatabase.find(s => s.id === sticker.id);
					if (stickerDb) {
						allStickers.push({
							id: sticker.id,
							name: sticker.name,
							rarity: stickerDb.rarity,
							image: sticker.image,
							value: stickerDb.price || 0
						});
					}
				});
			}
		});

		let totalStickersValue = allStickers.reduce((sum, s) => sum + s.value, 0) * 1.5;
		const stickersCount = totalStickersValue > 0
			? (totalStickersValue > 2000000 ? 4 : totalStickersValue > 1500000 ? 4 : totalStickersValue > 1000000 ? 3 : totalStickersValue > 500000 ? 2 : 1)
			: Math.floor(Math.random() * 5);

		const selectedStickers = selectStickersForCraft(allStickers, stickersCount, totalStickersValue);

		let mostPopularCollection = null;
		let maxCount = 0;
		Object.entries(collectionStats).forEach(([col, count]) => {
			if (count > maxCount) {
				maxCount = count;
				mostPopularCollection = col;
			}
		});
		if (!mostPopularCollection) {
			const allCollections = [...new Set(itemsDatabase.map(i => i.collection).filter(Boolean))];
			if (allCollections.length) mostPopularCollection = allCollections[0];
		}

		let availableItems = itemsDatabase.filter(item =>
			item.rarity === targetRarity &&
			item.collection === mostPopularCollection &&
			(
				(craftType === 'charm' && item.isCharm) ||
				(craftType === 'sticker' && item.isSticker) ||
				(craftType === 'withoutSlot' && item.isItemWithoutSlot) ||
				(craftType === 'other' && !item.isCharm && !item.isSticker && !item.isItemWithoutSlot)
			)
		);

		if (availableItems.length === 0) {
			availableItems = itemsDatabase.filter(item => item.rarity === targetRarity);
		}

		availableItems = availableItems.filter(item => !item.isRental && !item.id.endsWith('_rental'));

		if (availableItems.length === 0) return; // пропускаем

		const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];

		const sortedIndices = [...indices].sort((a, b) => b - a);
		sortedIndices.forEach(i => inventory.splice(i, 1));

		charmsToReturn.forEach(charm => {
			const charmItem = itemsDatabase.find(i => i.id === charm.id);
			if (charmItem) {
				inventory.push({
					id: charmItem.id,
					name: charmItem.name,
					rarity: charmItem.rarity,
					image: charmItem.image
				});
			}
		});

		const craftedItem = {
			id: randomItem.id.replace(/_rental$/, ''),
			name: randomItem.name.replace(/ \(Аренда\)$/, ''),
			rarity: randomItem.rarity,
			image: randomItem.image,
			collection: randomItem.collection
		};

		if (selectedStickers.length > 0) {
			craftedItem.stickers = selectedStickers.map(s => ({
				id: s.id,
				name: s.name,
				image: s.image
			}));
		}

		inventory.push(craftedItem);
		const stars_rairty = {
			'common': 0,
			'uncommon': 2,
			'rare': 4,
			'epic': 8,
			'legendary': 16,
			'arcane': 32,
			'nameless': 64,
			'none': 128
		}
		const starsGain = stars_rairty[randomItem.rarity] || 0;
		const starsToAdd = starsGain * 125;
		  
		addExp(starsToAdd);

		addBattlePassStarsForCraft(targetRarity);
		updateSouzRang(targetRarity);
	}
	
	let selectedCaseIndices = [];

	let quickOpenState = {
		currentPage: 0,
		itemsPerPage: 100, // Показываем по 100 кейсов за раз для скорости
		filteredCaseItems: [], // Кэшированный список кейсов
		selectedIndices: new Set(), // Используем Set для мгновенного поиска выбранного элемента
		caseItemsMap: {} // Маппинг index -> item для быстрого доступа
	};

	function getItemsDatabaseMap() {
		if (!window._itemsDbMap) {
			window._itemsDbMap = {};
			if (Array.isArray(itemsDatabase)) {
				itemsDatabase.forEach(item => {
					window._itemsDbMap[item.id] = item;
				});
			}
		}
		return window._itemsDbMap;
	}

	function openQuickOpenModal() {
		let quickOpenModal = document.getElementById('quick-open-modal');
		
		if (!quickOpenModal) {
			quickOpenModal = document.createElement('div');
			quickOpenModal.id = 'quick-open-modal';
			quickOpenModal.style.cssText = `
				position: fixed; top: 0; left: 0; width: 100%; height: 100%;
				background: rgba(0,0,0,0.7); z-index: 30000;
				display: none; justify-content: center; align-items: center;
				flex-direction: column; font-family: sans-serif;
			`;
			document.body.appendChild(quickOpenModal);
			
			quickOpenModal.addEventListener('click', (e) => {
				if (e.target === quickOpenModal) {
					quickOpenModal.style.display = 'none';
				}
			});
		}

		const dbMap = getItemsDatabaseMap();
		
		const caseItems = [];
		
		for (let i = 0; i < inventory.length; i++) {
			const item = inventory[i];
			const dbItem = dbMap[item.id];
			
			if (dbItem && dbItem.isCase) {
				caseItems.push({ item, index: i });
			}
		}

		quickOpenState.filteredCaseItems = caseItems;
		quickOpenState.selectedIndices.clear();
		quickOpenState.currentPage = 0;
		
		quickOpenState.caseItemsMap = {};
		caseItems.forEach(ci => {
			quickOpenState.caseItemsMap[ci.index] = ci;
		});

		if (caseItems.length === 0) {
			renderEmptyModal(quickOpenModal);
			quickOpenModal.style.display = 'flex';
			return;
		}

		renderModalContent(quickOpenModal, caseItems.length);
		quickOpenModal.style.display = 'flex';
	}

	function renderEmptyModal(modal) {
		modal.innerHTML = `
			<div style="background: #222; padding: 20px; border-radius: 8px; color: white; max-width: 400px; text-align: center;">
				<h3>Нет кейсов для открытия</h3>
				<button class="qom-close-btn" style="margin-top: 15px; padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Закрыть</button>
			</div>
		`;
		attachCloseListener(modal);
	}

	function renderModalContent(modal, totalCount) {
		const state = quickOpenState;
		const start = state.currentPage * state.itemsPerPage;
		const end = Math.min(start + state.itemsPerPage, totalCount);
		const pageItems = state.filteredCaseItems.slice(start, end);
		const totalPages = Math.ceil(totalCount / state.itemsPerPage);

		const casesHTML = pageItems.map(({ item, index }) => {
			const rarityInfo = rarities[item.rarity] || {};
			const borderColor = state.selectedIndices.has(index) ? '#4CAF50' : 'transparent';
			
			return `
				<div class="quick-open-case-item" data-index="${index}" style="
					display: flex; flex-direction: column; align-items: center;
					padding: 12px 8px; background: #2a2a2a;
					border: 2px solid ${borderColor}; border-radius: 6px;
					cursor: pointer; transition: border-color 0.1s;
					box-sizing: border-box; text-align: center;
				">
					<img src="${item.image}" width="90" style="border-radius: 4px; margin-bottom: 8px; pointer-events: none;">
					<div style="font-size: 13px; font-weight: 500; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${item.name}</div>
				</div>
			`;
		}).join('');

		const isAllSelectedOnPage = pageItems.every(({ index }) => state.selectedIndices.has(index));
		const areAllSelected = state.selectedIndices.size === totalCount;

		modal.innerHTML = `
			<div style="background: #222; padding: 20px; border-radius: 8px; color: white; max-width: 820px; width: 92%; max-height: 85vh; display: flex; flex-direction: column;">
				<h3 style="text-align: center; margin: 0 0 10px 0;">Быстрое открытие (${state.selectedIndices.size} из ${totalCount})</h3>
				
				<div id="quick-open-cases-grid" style="
					display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
					gap: 8px; margin-bottom: 15px; overflow-y: auto; flex: 1;
					padding-right: 5px;
				">
					${casesHTML}
				</div>

				<!-- Пагинация -->
				${totalPages > 1 ? `
				<div style="display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 10px;">
					<button id="qom-prev-page" ${state.currentPage === 0 ? 'disabled style="opacity:0.5"' : ''} style="padding: 5px 10px; cursor: pointer;">&lt;</button>
					<span>Стр. ${state.currentPage + 1} из ${totalPages}</span>
					<button id="qom-next-page" ${state.currentPage >= totalPages - 1 ? 'disabled style="opacity:0.5"' : ''} style="padding: 5px 10px; cursor: pointer;">&gt;</button>
				</div>` : ''}

				<div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
					<button id="qom-select-all" style="padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
						${areAllSelected ? 'Снять всё' : 'Выбрать всё'}
					</button>
				</div>

				<div style="display: flex; gap: 12px; justify-content: center; border-top: 1px solid #444; paddingTop: 15px;">
					<button id="qom-confirm" style="padding: 10px 24px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;">Открыть выбранные</button>
					<button class="qom-close-btn" style="padding: 10px 24px; background: #555; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">Отмена</button>
				</div>
			</div>
		`;

		attachEventListeners(modal, totalCount, areAllSelected);
	}

	function attachCloseListener(modal) {
		const btn = modal.querySelector('.qom-close-btn');
		if (btn) {
			btn.onclick = () => { modal.style.display = 'none'; };
		}
	}

	function attachEventListeners(modal, totalCount, currentAllSelectedState) {
		const grid = document.getElementById('quick-open-cases-grid');
		const selectAllBtn = document.getElementById('qom-select-all');
		const confirmBtn = document.getElementById('qom-confirm');
		const prevBtn = document.getElementById('qom-prev-page');
		const nextBtn = document.getElementById('qom-next-page');
		const state = quickOpenState;

		if (grid) {
			grid.addEventListener('click', (e) => {
				const itemEl = e.target.closest('.quick-open-case-item');
				if (!itemEl) return;

				const index = parseInt(itemEl.dataset.index);
				toggleSelection(index, itemEl);
			});
		}

		if (selectAllBtn) {
			selectAllBtn.addEventListener('click', () => {
				const areAllNowSelected = !currentAllSelectedState;
				
				if (areAllNowSelected) {
					state.filteredCaseItems.forEach(({ index }) => state.selectedIndices.add(index));
				} else {
					state.selectedIndices.clear();
				}
				
				renderModalContent(modal, totalCount);
			});
		}

		if (confirmBtn) {
			confirmBtn.addEventListener('click', () => {
				const state = quickOpenState;
				if (state.selectedIndices.size === 0) {
					if (typeof showToast === 'function') showToast('Выберите хотя бы один кейс', true);
					else alert('Выберите хотя бы один кейс');
					return;
				}
				
				modal.style.display = 'none';
				
				openSelectedCasesWithProgress(Array.from(state.selectedIndices));
			});
		}

		if (prevBtn) {
			prevBtn.addEventListener('click', () => {
				if (state.currentPage > 0) {
					state.currentPage--;
					renderModalContent(modal, totalCount);
				}
			});
		}

		if (nextBtn) {
			nextBtn.addEventListener('click', () => {
				const totalPages = Math.ceil(totalCount / state.itemsPerPage);
				if (state.currentPage < totalPages - 1) {
					state.currentPage++;
					renderModalContent(modal, totalCount);
				}
			});
		}

		attachCloseListener(modal);
	}

	function toggleSelection(index, element) {
		const state = quickOpenState;
		if (state.selectedIndices.has(index)) {
			state.selectedIndices.delete(index);
			element.style.borderColor = 'transparent';
		} else {
			state.selectedIndices.add(index);
			element.style.borderColor = '#4CAF50';
		}
		
	}

	function openSelectedCasesWithProgress(indices) {
		if (indices.length === 0) return;

		const dbMap = getItemsDatabaseMap();
		let openedCount = 0;
		const total = indices.length;
		
		const BATCH_SIZE = 100; 
		const droppedItems = []; // Собираем все выпавшие предметы
		
		const progressOverlay = document.createElement('div');
		progressOverlay.id = 'quick-open-progress-overlay';
		progressOverlay.style.cssText = `
			position: fixed; top: 0; left: 0; width: 100%; height: 100%;
			background: rgba(0,0,0,0.85); z-index: 35000;
			display: flex; flex-direction: column;
			justify-content: center; align-items: center;
			color: white; font-family: sans-serif;
		`;

		progressOverlay.innerHTML = `
			<h2 style="margin-bottom: 20px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">Открытие кейсов...</h2>
			<div style="width: 80%; max-width: 600px; background: #333; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
				<div id="qom-progress-bar" style="
					width: 0%; height: 30px; 
					background: linear-gradient(90deg, #4CAF50, #8BC34A); 
					transition: width 0.2s ease-out;
					display: flex; align-items: center; justify-content: flex-end;
					padding-right: 10px; box-sizing: border-box;
				">
					<span id="qom-progress-text" style="color: white; font-weight: bold; font-size: 14px; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">0%</span>
				</div>
			</div>
			<div id="qom-progress-details" style="margin-top: 15px; font-size: 14px; color: #ccc;">
				Открыто: 0 из ${total}
			</div>
		`;

		document.body.appendChild(progressOverlay);

		const progressBar = document.getElementById('qom-progress-bar');
		const progressText = document.getElementById('qom-progress-text');
		const progressDetails = document.getElementById('qom-progress-details');

		function processBatch() {
			const start = openedCount;
			const end = Math.min(start + BATCH_SIZE, total);
			
			for (let i = start; i < end; i++) {
				const index = indices[i];
				const caseItem = inventory[index];
				if (!caseItem) continue;

				const caseData = dbMap[caseItem.id];
				if (!caseData || !caseData.contains) continue;

				const possibleItems = createWeightedItemsList(caseData);
				if (possibleItems.length === 0) continue;

				const resultItemId = possibleItems[Math.floor(Math.random() * possibleItems.length)];
				const resultItem = dbMap[resultItemId];
				if (!resultItem) continue;

				const isRental = resultItem.isRental || false;
				const newItem = {
					id: resultItem.id,
					name: resultItem.name,
					rarity: resultItem.rarity,
					image: resultItem.image
				};

				if (isRental) {
					newItem.isRental = true;
					newItem.rentalExpires = Date.now() + 3 * 60 * 1000;
				}

				inventory[index] = newItem;
				droppedItems.push(newItem); // Сохраняем выпавший предмет
				
				if (typeof addExp === 'function') addExp(3000); 
			}

			openedCount = end;
			
			const percent = Math.round((openedCount / total) * 100);
			progressBar.style.width = `${percent}%`;
			progressText.textContent = `${percent}%`;
			progressDetails.textContent = `Открыто: ${openedCount} из ${total}`;

			if (openedCount < total) {
				requestAnimationFrame(processBatch);
			} else {
				setTimeout(() => {
					finishOpeningProcess(total, droppedItems);
				}, 500);
			}
		}

		function finishOpeningProcess(count, items) {
			if (progressOverlay.parentNode) {
				progressOverlay.parentNode.removeChild(progressOverlay);
			}

			if (typeof updateInventory === 'function') updateInventory();
			if (typeof saveGameState === 'function') saveGameState();
			
			// Показываем список выпавших предметов
			if (items.length > 0 && typeof showCaseResult === 'function') {
				showCaseResult(items);
			} else if (typeof showToast === 'function') {
				showToast(`Успешно открыто ${count} кейсов!`, false);
			}
		}

		requestAnimationFrame(processBatch);
	}
	
	function showConfirmModal(title, message, onConfirm, onCancel) {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.display = 'flex';
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100%';
		modal.style.height = '100%';
		modal.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
		modal.style.zIndex = '2000'; // Выше обычных окон
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';

		modal.innerHTML = `
			<div class="modal-content" style="background-color: rgb(30 30 30 / 95%); padding: 25px; border-radius: 8px; width: 400px; max-width: 90%; text-align: center; border: 1px solid #444; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
				<h3 style="margin-top: 0; color: #ff9800; font-size: 20px;">${title}</h3>
				
				<div style="margin: 20px 0; color: #ddd; line-height: 1.5;">
					${message}
				</div>
				
				<div style="display: flex; justify-content: center; gap: 15px; margin-top: 25px;">
					<button id="modal-confirm-yes" style="
						padding: 10px 25px; 
						background-color: #4CAF50; 
						color: white; 
						border: none; 
						border-radius: 4px; 
						cursor: pointer;
						font-weight: bold;
						font-size: 14px;
						transition: background 0.2s;
					">Подтвердить</button>
					
					<button id="modal-confirm-no" style="
						padding: 10px 25px; 
						background-color: #f44336; 
						color: white; 
						border: none; 
						border-radius: 4px; 
						cursor: pointer;
						font-size: 14px;
						transition: background 0.2s;
					">Отмена</button>
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		const yesBtn = modal.querySelector('#modal-confirm-yes');
		const noBtn = modal.querySelector('#modal-confirm-no');

		yesBtn.addEventListener('click', () => {
			modal.remove();
			if (onConfirm) onConfirm();
		});

		noBtn.addEventListener('click', () => {
			modal.remove();
			if (onCancel) onCancel();
		});

		modal.addEventListener('click', function(e) {
			if (e.target === modal) {
				modal.remove();
				if (onCancel) onCancel();
			}
		});
	}

	function openRemoveStickersModal() {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.display = 'flex';
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100%';
		modal.style.height = '100%';
		modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
		modal.style.zIndex = '1001';
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';

		let totalStickers = 0;
		let totalCharms = 0;

		inventory.forEach(item => {
			if (item.stickers && item.stickers.length > 0) {
				totalStickers += item.stickers.length;
			}
			if (item.charm) {
				totalCharms++;
			}
		});

		const hasAnyStickers = totalStickers > 0;
		const hasAnyCharms = totalCharms > 0;

		modal.innerHTML = `
			<div class="modal-content" style="background-color: rgb(30 30 30 / 85%); padding: 20px; border-radius: 8px; width: 80%; max-width: 900px; max-height: 80vh; overflow: auto;">
				<h2 style="text-align: center;">Снять стикеры/брелоки с предметов</h2>
				
				<!-- Панель массовых действий -->
				<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 20px; padding: 15px; background: #222; border-radius: 8px; border: 1px solid #444;">
					<span style="width: 100%; text-align: center; color: #aaa; font-size: 13px; margin-bottom: 5px;">Массовые действия:</span>
					
					${hasAnyStickers || hasAnyCharms ? `
						<button id="btn-remove-all-everything" style="padding: 8px 15px; background-color: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
							Снять ВСЁ со всех предметов
						</button>
					` : ''}
					
					${hasAnyStickers ? `
						<button id="btn-remove-all-stickers" style="padding: 8px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
							Снять все стикеры (${totalStickers})
						</button>
					` : ''}
					
					${hasAnyCharms ? `
						<button id="btn-remove-all-charms" style="padding: 8px 15px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
							Снять все брелоки (${totalCharms})
						</button>
					` : ''}
				</div>

				<p style="text-align: center; margin-bottom: 20px; color: #aaa; border-top: 1px solid #444; padding-top: 15px;">
					Или выберите предмет для ручного снятия:
				</p>
				
				<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; margin-top: 20px;" id="stickers-items-container">
					${inventory.map((item, index) => {
						const hasStickers = item.stickers && item.stickers.length > 0;
						const hasCharm = item.charm;
						
						if (!hasStickers && !hasCharm) return '';
						
						return `
							<div class="stickers-item" data-index="${index}" style="
								background-color: #2a2a2a; 
								padding: 15px; 
								border-radius: 8px; 
								text-align: center; 
								cursor: pointer;
								position: relative;
								transition: transform 0.2s;
							">
								<img src="${item.image}" alt="${item.name}" width="80" style="border-radius: 5px;">
								<div style="margin-top: 10px; font-weight: bold; font-size: 14px;">${item.name}</div>
								
								${hasStickers ? `
									<div style="margin-top: 5px; color: #4CAF50; font-size: 12px;">
										Стикеры: ${item.stickers.length}
									</div>
								` : ''}
								
								${hasCharm ? `
									<div style="margin-top: 5px; color: #ffa500; font-size: 12px;">
										Есть брелок
									</div>
								` : ''}
								
								${hasStickers || hasCharm ? `
									<div style="position: absolute; top: 5px; right: 5px; display: flex; gap: 2px;">
										${hasStickers ? `<div style="width: 8px; height: 8px; background-color: #4CAF50; border-radius: 50%;"></div>` : ''}
										${hasCharm ? `<div style="width: 8px; height: 8px; background-color: #ffa500; border-radius: 50%;"></div>` : ''}
									</div>
								` : ''}
							</div>
						`;
					}).join('')}
				</div>
				
				${inventory.some(item => (item.stickers && item.stickers.length > 0) || item.charm) ? '' : `
					<div style="text-align: center; margin-top: 40px; color: #aaa;">
						<p>В инвентаре нет предметов со стикерами или брелками</p>
					</div>
				`}
				
				<div style="text-align: center; margin-top: 20px;">
					<button id="close-stickers-modal" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Закрыть</button>
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		if (hasAnyStickers || hasAnyCharms) {
			modal.querySelector('#btn-remove-all-everything').addEventListener('click', function() {
				showConfirmModal(
					'Снять абсолютно всё?',
					'Вы собираетесь снять все стикеры и брелоки со всех предметов в инвентаре. Это действие нельзя отменить.',
					() => {
						let removedCount = 0;
						inventory.forEach((item) => {
							if (item.stickers) {
								item.stickers.forEach(sticker => {
									const dbItem = itemsDatabase.find(a => a.id === sticker.id);
									if(dbItem) {
										inventory.push({ id: dbItem.id, name: dbItem.name, rarity: dbItem.rarity, image: dbItem.image });
										removedCount++;
									}
								});
								delete item.stickers;
							}
							if (item.charm) {
								const dbItem = itemsDatabase.find(a => a.id === item.charm.id);
								if(dbItem) {
									inventory.push({ id: dbItem.id, name: dbItem.name, rarity: dbItem.rarity, image: dbItem.image });
									removedCount++;
								}
								delete item.charm;
							}
						});
						updateInventory();
						saveGameState();
						modal.remove();
						showToast(`Успешно снято объектов: ${removedCount}`);
					}
				);
			});
		}

		if (hasAnyStickers) {
			modal.querySelector('#btn-remove-all-stickers').addEventListener('click', function() {
				showConfirmModal(
					'Снять все стикеры?',
					`Вы собираетесь снять ${totalStickers} стикеров со всех предметов. Они будут добавлены в ваш инвентарь.`,
					() => {
						let removedCount = 0;
						inventory.forEach(item => {
							if (item.stickers) {
								item.stickers.forEach(sticker => {
									const dbItem = itemsDatabase.find(a => a.id === sticker.id);
									if(dbItem) {
										inventory.push({ id: dbItem.id, name: dbItem.name, rarity: dbItem.rarity, image: dbItem.image });
										removedCount++;
									}
								});
								delete item.stickers;
							}
						});
						updateInventory();
						saveGameState();
						modal.remove();
						showToast(`Снято стикеров: ${removedCount}`);
					}
				);
			});
		}

		if (hasAnyCharms) {
			modal.querySelector('#btn-remove-all-charms').addEventListener('click', function() {
				showConfirmModal(
					'Снять все брелоки?',
					`Вы собираетесь снять ${totalCharms} брелоков со всех предметов.`,
					() => {
						let removedCount = 0;
						inventory.forEach(item => {
							if (item.charm) {
								const dbItem = itemsDatabase.find(a => a.id === item.charm.id);
								if(dbItem) {
									inventory.push({ id: dbItem.id, name: dbItem.name, rarity: dbItem.rarity, image: dbItem.image });
									removedCount++;
								}
								delete item.charm;
							}
						});
						updateInventory();
						saveGameState();
						modal.remove();
						showToast(`Снято брелоков: ${removedCount}`);
					}
				);
			});
		}

		modal.querySelectorAll('.stickers-item').forEach(item => {
			item.addEventListener('click', function() {
				const index = parseInt(this.getAttribute('data-index'));
				modal.querySelectorAll('.stickers-item').forEach(el => {
					el.style.border = 'none';
					el.style.transform = 'none';
				});
				this.style.border = '2px solid gold';
				this.style.transform = 'scale(1.05)';
				openStickerSelectionModal(index);
			});
		});

		modal.querySelector('#close-stickers-modal').addEventListener('click', function() {
			modal.remove();
		});

		modal.addEventListener('click', function(e) {
			if (e.target === modal) {
				modal.remove();
			}
		});
	}

	function openStickerSelectionModal(itemIndex) {
		const inventoryItem = inventory[itemIndex];
		if (!inventoryItem) return;

		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.display = 'flex';
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100%';
		modal.style.height = '100%';
		modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
		modal.style.zIndex = '1002';
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';

		const hasStickers = inventoryItem.stickers && inventoryItem.stickers.length > 0;
		const hasCharm = inventoryItem.charm;

		modal.innerHTML = `
			<div class="modal-content" style="background-color: rgb(30 30 30 / 90%); padding: 20px; border-radius: 8px; width: 80%; max-width: 800px; max-height: 80vh; overflow: auto;">
				<h3 style="text-align: center; margin-top: 0;">"${inventoryItem.name}"</h3>
				
				<div style="text-align: center; margin-bottom: 20px;">
					<img src="${inventoryItem.image}" alt="${inventoryItem.name}" width="100" style="border-radius: 5px;">
				</div>

				<!-- Кнопки быстрого снятия для этого предмета -->
				<div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
					${hasStickers && hasCharm ? `
						<button id="btn-remove-all-from-item" style="padding: 6px 12px; background-color: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
							Снять всё с этого предмета
						</button>
					` : ''}
					${hasStickers ? `
						<button id="btn-remove-stickers-from-item" style="padding: 6px 12px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
							Снять все стикеры
						</button>
					` : ''}
				</div>
				
				<div style="display: flex; flex-direction: column; gap: 15px;">
					${hasStickers ? `
						<div class="sticker-selection-section">
							<h4 style="color: #4CAF50; margin-bottom: 10px;">Стикеры (${inventoryItem.stickers.length})</h4>
							<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px;" id="stickers-container">
								${inventoryItem.stickers.map((sticker, stickerIndex) => `
									<div class="sticker-item" data-type="sticker" data-index="${stickerIndex}" style="
										background-color: #333; 
										padding: 10px; 
										border-radius: 8px; 
										text-align: center; 
										cursor: pointer;
										transition: background 0.2s;
									">
										<img src="${sticker.image}" alt="${sticker.name}" width="50" style="border-radius: 3px;">
										<div style="margin-top: 5px; font-size: 12px;">${sticker.name}</div>
										<div style="margin-top: 3px; font-size: 10px; color: #aaa;">Стикер</div>
									</div>
								`).join('')}
							</div>
						</div>
					` : ''}
					
					${hasCharm ? `
						<div class="charm-selection-section">
							<h4 style="color: #ffa500; margin-bottom: 10px;">Брелок</h4>
							<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px;">
								<div class="charm-item" data-type="charm" style="
									background-color: #333; 
									padding: 10px; 
									border-radius: 8px; 
									text-align: center; 
									cursor: pointer;
									transition: background 0.2s;
								">
									<img src="${inventoryItem.charm.image}" alt="${inventoryItem.charm.name}" width="50" style="border-radius: 3px;">
									<div style="margin-top: 5px; font-size: 12px;">${inventoryItem.charm.name}</div>
									<div style="margin-top: 3px; font-size: 10px; color: #aaa;">Брелок</div>
								</div>
							</div>
						</div>
					` : ''}
				</div>
				
				${!hasStickers && !hasCharm ? `
					<div style="text-align: center; margin-top: 20px; color: #aaa;">
						<p>На этом предмете нет стикеров или брелоков</p>
					</div>
				` : ''}
				
				<div style="text-align: center; margin-top: 20px;">
					<button id="close-selection-modal" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Назад</button>
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		const btnAllFromItem = modal.querySelector('#btn-remove-all-from-item');
		if (btnAllFromItem) {
			btnAllFromItem.addEventListener('click', function() {
				showConfirmModal(
					`Снять всё с "${inventoryItem.name}"?`,
					'Все стикеры и брелок будут сняты и добавлены в инвентарь.',
					() => {
						if (inventoryItem.stickers) {
							inventoryItem.stickers.forEach(sticker => {
								const dbItem = itemsDatabase.find(a => a.id === sticker.id);
								if(dbItem) inventory.push({ id: dbItem.id, name: dbItem.name, rarity: dbItem.rarity, image: dbItem.image });
							});
							delete inventoryItem.stickers;
						}
						if (inventoryItem.charm) {
							const dbItem = itemsDatabase.find(a => a.id === inventoryItem.charm.id);
							if(dbItem) inventory.push({ id: dbItem.id, name: dbItem.name, rarity: dbItem.rarity, image: dbItem.image });
							delete inventoryItem.charm;
						}
						
						updateInventory();
						saveGameState();
						
						modal.remove();
						const prevModal = document.querySelector('.modal[style*="z-index: 1001"]');
						if(prevModal) prevModal.remove(); 
						
						showToast(`Всё снято с "${inventoryItem.name}"`);
					}
				);
			});
		}

		const btnStickersFromItem = modal.querySelector('#btn-remove-stickers-from-item');
		if (btnStickersFromItem) {
			btnStickersFromItem.addEventListener('click', function() {
				showConfirmModal(
					`Снять все стикеры с "${inventoryItem.name}"?`,
					`${inventoryItem.stickers.length} стикеров будут перемещены в инвентарь.`,
					() => {
						if (inventoryItem.stickers) {
							inventoryItem.stickers.forEach(sticker => {
								const dbItem = itemsDatabase.find(a => a.id === sticker.id);
								if(dbItem) inventory.push({ id: dbItem.id, name: dbItem.name, rarity: dbItem.rarity, image: dbItem.image });
							});
							delete inventoryItem.stickers;
						}
						updateInventory();
						saveGameState();
						
						modal.remove();
						const prevModal = document.querySelector('.modal[style*="z-index: 1001"]');
						if(prevModal) prevModal.remove();
						
						showToast(`Все стикеры сняты с "${inventoryItem.name}"`);
					}
				);
			});
		}

		let selectedType = null;
		let selectedIndex = null;

		if (hasStickers) {
			modal.querySelectorAll('.sticker-item').forEach(sticker => {
				sticker.addEventListener('click', function() {
					modal.querySelectorAll('.sticker-item, .charm-item').forEach(el => {
						el.style.border = 'none';
						el.style.backgroundColor = '#333';
					});
					this.style.border = '2px solid #4CAF50';
					this.style.backgroundColor = '#444';
					selectedType = 'sticker';
					selectedIndex = parseInt(this.getAttribute('data-index'));
					openConfirmationModal(itemIndex, selectedType, selectedIndex);
				});
			});
		}

		if (hasCharm) {
			modal.querySelector('.charm-item').addEventListener('click', function() {
				modal.querySelectorAll('.sticker-item, .charm-item').forEach(el => {
					el.style.border = 'none';
					el.style.backgroundColor = '#333';
				});
				this.style.border = '2px solid #ffa500';
				this.style.backgroundColor = '#444';
				selectedType = 'charm';
				selectedIndex = null;
				openConfirmationModal(itemIndex, selectedType, selectedIndex);
			});
		}

		modal.querySelector('#close-selection-modal').addEventListener('click', function() {
			modal.remove();
		});

		modal.addEventListener('click', function(e) {
			if (e.target === modal) {
				modal.remove();
			}
		});
	}

	function openConfirmationModal(itemIndex, type, stickerIndex) {
		const inventoryItem = inventory[itemIndex];
		if (!inventoryItem) return;

		let itemToRemove = null;
		let itemName = '';
		let itemImage = '';

		if (type === 'sticker' && inventoryItem.stickers && inventoryItem.stickers[stickerIndex]) {
			itemToRemove = inventoryItem.stickers[stickerIndex];
			itemName = itemToRemove.name;
			itemImage = itemToRemove.image;
		} else if (type === 'charm' && inventoryItem.charm) {
			itemToRemove = inventoryItem.charm;
			itemName = itemToRemove.name;
			itemImage = itemToRemove.image;
		}

		if (!itemToRemove) return;

		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.display = 'flex';
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100%';
		modal.style.height = '100%';
		modal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
		modal.style.zIndex = '1003';
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';

		modal.innerHTML = `
			<div class="modal-content" style="background-color: rgb(30 30 30 / 95%); padding: 25px; border-radius: 8px; width: 400px; max-width: 90%; text-align: center; border: 1px solid #444;">
				<h3 style="margin-top: 0; color: ${type === 'sticker' ? '#4CAF50' : '#ffa500'};">
					Подтверждение снятия
				</h3>
				
				<div style="margin: 20px 0;">
					<p style="color:#ccc">Вы собираетесь снять с предмета:</p>
					<div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin: 15px 0;">
						<img src="${inventoryItem.image}" alt="${inventoryItem.name}" width="60" style="border-radius: 5px; border: 1px solid #555;">
						<span style="font-size: 18px; color: #777;">→</span>
						<img src="${itemImage}" alt="${itemName}" width="60" style="border-radius: 5px; border: 1px solid #555;">
					</div>
					<p style="color: #ddd;"><strong>${itemName}</strong> будет добавлен в ваш инвентарь</p>
				</div>
				
				<div style="display: flex; justify-content: center; gap: 15px; margin-top: 25px;">
					<button id="confirm-removal" style="
						padding: 10px 20px; 
						background-color: #4CAF50; 
						color: white; 
						border: none; 
						border-radius: 4px; 
						cursor: pointer;
						font-weight: bold;
					">Подтвердить</button>
					
					<button id="cancel-removal" style="
						padding: 10px 20px; 
						background-color: #f44336; 
						color: white; 
						border: none; 
						border-radius: 4px; 
						cursor: pointer;
					">Отмена</button>
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		modal.querySelector('#confirm-removal').addEventListener('click', function() {
			removeStickerOrCharm(itemIndex, type, stickerIndex);
			document.querySelectorAll('.modal').forEach(m => m.remove());
			showToast(`Снят ${type === 'sticker' ? 'стикер' : 'брелок'}: ${itemName}`);
		});

		modal.querySelector('#cancel-removal').addEventListener('click', function() {
			modal.remove();
		});

		modal.addEventListener('click', function(e) {
			if (e.target === modal) {
				modal.remove();
			}
		});
	}

	function removeStickerOrCharm(itemIndex, type, stickerIndex) {
		const inventoryItem = inventory[itemIndex];
		if (!inventoryItem) return;

		let removedItem = null;

		if (type === 'sticker') {
			if (inventoryItem.stickers && inventoryItem.stickers[stickerIndex]) {
				removedItem = inventoryItem.stickers[stickerIndex];
				inventoryItem.stickers.splice(stickerIndex, 1);
				if (inventoryItem.stickers.length === 0) {
					delete inventoryItem.stickers;
				}
			}
		} else if (type === 'charm') {
			if (inventoryItem.charm) {
				removedItem = inventoryItem.charm;
				delete inventoryItem.charm;
			}
		}

		const dbItem = itemsDatabase.find(a => a.id === removedItem.id);
		
		if (dbItem) {
			inventory.push({
				id: dbItem.id,
				name: dbItem.name,
				rarity: dbItem.rarity,
				image: dbItem.image
			});
		}

		updateInventory();
		saveGameState();
	}
	
	function mergeRentalStacks() {
		const rentalGroups = new Map();
		
		inventory.forEach((item, index) => {
			if (!item) return; // Пропускаем null/undefined элементы
			
			if (item.isRental && item.rentalExpires) {
				if (!rentalGroups.has(item.id)) {
					rentalGroups.set(item.id, { indices: [], baseExpires: 0 });
				}
				const group = rentalGroups.get(item.id);
				group.indices.push(index);
				if (item.rentalExpires > group.baseExpires) {
					group.baseExpires = item.rentalExpires;
				}
			}
		});
		
		const itemsToRemove = new Set();
		
		rentalGroups.forEach((group, itemId) => {
			if (group.indices.length > 1) {
				const [keepIndex, ...duplicateIndices] = group.indices;
				const keepItem = inventory[keepIndex];
				
				if (!keepItem) return; // Защита от null
				
				const now = Date.now();
				
				let extraTime = 0;
				duplicateIndices.forEach(idx => {
					const dupItem = inventory[idx];
					if (!dupItem || !dupItem.rentalExpires) return; // Защита
					
					const remaining = Math.max(0, dupItem.rentalExpires - now);
					extraTime += remaining;
					itemsToRemove.add(idx);
				});
				
				keepItem.rentalExpires = Math.max(keepItem.rentalExpires || now, now) + extraTime;
			}
		});
		
		if (itemsToRemove.size > 0) {
			const sortedToRemove = Array.from(itemsToRemove).sort((a, b) => b - a);
			for (const idx of sortedToRemove) {
				inventory.splice(idx, 1);
			}
			return true;
		}
		return false;
	}
	
	function updateInventory() {
		mergeRentalStacks();
		scheduleNextRentalCheck();
		sortInventoryByRarity();
		const fragmentGroups = groupFragmentsInInventory();
		const groupedData = {};
		
		// Оптимизация: кэшируем keys раритетов
		const rarityKeys = Object.keys(rarities);
		for (let i = 0; i < rarityKeys.length; i++) {
			const rarity = rarityKeys[i];
			groupedData[rarity] = {
				withoutSlots: [], charms: [], withSlots: [], stickers: [], cases: [], rentals: [], fragments: []
			};
		}

		// Оптимизация: используем for loop вместо forEach для лучшей производительности
		const invLength = inventory.length;
		for (let idx = 0; idx < invLength; idx++) {
			const item = inventory[idx];
			const originalItem = itemsDbMap.get(item.id);
			const rarity = item.rarity;
			
			if (!groupedData[rarity]) continue;

			if (item.name.endsWith('Fragment') && !item.isRental && fragmentGroups[item.id]) {
				const fg = fragmentGroups[item.id];
				if (idx === fg.indices[0]) {
					groupedData[rarity].fragments.push({ item, index: idx, count: fg.count });
				}
			} 
			else if (item.isRental) {
				groupedData[rarity].rentals.push({ item, index: idx });
			} 
			else if (originalItem || item) {
				if (originalItem?.isCase) groupedData[rarity].cases.push({ item, index: idx });
				else if (originalItem?.isCharm) groupedData[rarity].charms.push({ item, index: idx });
				else if (originalItem?.isSticker) groupedData[rarity].stickers.push({ item, index: idx });
				else if (originalItem?.isItemWithoutSlot) groupedData[rarity].withoutSlots.push({ item, index: idx });
				else groupedData[rarity].withSlots.push({ item, index: idx });
			}
		}

		// Оптимизация: более эффективная сортировка
		for (const rarity in groupedData) {
			const groups = groupedData[rarity];
			for (const key in groups) {
				const list = groups[key];
				if (list.length > 1) {
					list.sort((a, b) => a.item.name.localeCompare(b.item.name));
				}
			}
		}

		const sortedRarities = rarityKeys.sort((a, b) => (rarities[b]?.order || 0) - (rarities[a]?.order || 0));
		
		const fragment = document.createDocumentFragment();
		inventoryItemsElement.textContent = ''; // textContent быстрее чем innerHTML

		if (inventory.length === 0) {
			inventoryItemsElement.innerHTML = '<p>Ваш инвентарь пуст</p>';
			sellAllBtn.disabled = true;
			document.getElementById('inventory-total-value').textContent = 'Общая стоимость: 0.00 ₽';
			return;
		}
		sellAllBtn.disabled = false;
		document.getElementById('inventory-total-value').textContent = `Общая стоимость: ${calculateInventoryTotal()} ₽`;

		const createItemElement = (data, isRental = false, isFragment = false, count = 0) => {
			const { item, index } = data;
			const originalItem = itemsDbMap.get(item.id);
			const rarityInfo = rarities[item.rarity];
			const el = document.createElement('div');
			
			el.className = isFragment ? 'inventory-item fragment-item' : 'inventory-item';
			if (isRental) el.classList.add('rental-item');
			el.dataset.index = index;
			el.dataset.rarity = item.rarity;
			if (isFragment) el.dataset.count = count;

			const isCase = originalItem?.isCase;
			const isCharm = originalItem?.isCharm;
			const isSticker = originalItem?.isSticker;
			const isNoSlot = originalItem?.isItemWithoutSlot;
			const isMedal = item.name.startsWith('Medal'); // Проверка на медаль
			
			const basePrice = originalItem ? (originalItem.price * 0.8) : 0;
			const displayPrice = (!isRental && !isCase && originalItem?.itemInStore !== false) 
				? calculateItemPriceInInventory(index) || basePrice 
				: basePrice;

			const imgSrc = item.image || 'images/none_item.png';
			
			let slotsHTML = '';
			if (!isRental && !isCase && !isFragment) {
				const stickersList = Array.isArray(item.stickers) ? [...item.stickers].reverse() : [];
				slotsHTML = `<div class="item-slots">
					${[4,3,2,1].map(i => {
						const s = stickersList[i-1];
						const sImg = s ? (s.image || 'images/none_item.png') : '';
						return `<div class="slot sticker-slot" data-index="${index}" data-slot-num="${i}" data-slot-type="sticker">${sImg ? `<img src="${sImg}" loading="lazy" width="30">` : ''}</div>`;
					}).join('')}
					<div class="slot charm-slot" data-index="${index}" data-slot-type="charm">
						${item.charm ? `<img src="${item.charm.image || 'images/none_item.png'}" loading="lazy" width="30">` : ''}
					</div>
				</div>`;
			}

			let timeLeft = '';
			if (isRental && item.rentalExpires) {
				const sec = Math.max(0, Math.ceil((item.rentalExpires - Date.now()) / 1000));
				timeLeft = `${Math.floor(sec/60)} м. ${sec%60} с.`;
			}

			let actionsHTML = '';
			if (isFragment) {
				const dispCount = count > 10000 ? '10000+' : count;
				actionsHTML = `
					<div class="item-actions">
						<button class="upgrade-fragment-btn" data-index="${index}" data-count="${count}">Улучшить</button>
						<button class="open-fragment-btn" data-index="${index}" data-count="${count}">Открыть</button>
						${originalItem?.itemInStore !== false ? `<button class="sell-fragment-btn" data-index="${index}" data-price="${basePrice}">Продать (<a style="color: ${currencyColor}">${basePrice.toFixed(2)} ₽</a>)</button>` : `<div class="rental-notice">Нет на рынке</div>`}
					</div>`;
			} else if (isCase) {
				actionsHTML = `<div class="item-actions">
					<button class="open-case-btn" data-index="${index}">Открыть</button>
					${originalItem?.itemInStore !== false ? `<button class="sell-btn" data-index="${index}" data-price="${displayPrice}">Продать (<a style="color: ${currencyColor}">${displayPrice.toFixed(2)} ₽</a>)</button>` : `<div class="rental-notice">Нет на рынке</div>`}
				</div>`;
			} else if (isCharm || isSticker) {
				actionsHTML = `<div class="item-actions">
					<button class="apply-item-btn" data-index="${index}">Применить</button>
					${!isRental && originalItem?.itemInStore !== false ? `<button class="sell-btn" data-index="${index}" data-price="${displayPrice}">Продать (<a style="color: ${currencyColor}">${displayPrice.toFixed(2)} ₽</a>)</button>` : `<div class="rental-notice">Нет на рынке</div>`}
				</div>`;
			} else if (isRental) {
				actionsHTML = `<div class="rental-notice">Арендованный предмет</div>`;
			} else {
				if (originalItem && originalItem.itemInStore !== false) {
					actionsHTML = `<button class="sell-btn" data-index="${index}" data-price="${displayPrice}">Продать (<a style="color: ${currencyColor}">${displayPrice.toFixed(2)} ₽</a>)</button>`;
				} else {
					actionsHTML = `<div class="rental-notice">Нет на рынке</div>`;
				}
			}

			if (isMedal) {
				const medalItemData = inventory[index];
				const isApplied = medalItemData && medalItemData.slot !== undefined && medalItemData.slot !== null;
				const appliedSlot = isApplied ? medalItemData.slot + 1 : null;
				
				const uniqueButtonId = `medal_${index}_${Date.now()}_${Math.random()}`;
				
				actionsHTML = `
				<div class="item-actions" style="margin-top: 5px;">
					${isApplied ? 
						`<button class="unequip-medal-btn" data-slot="${medalItemData.slot}" style="width: 100%; padding: 5px; cursor: pointer; background: #f44336; color: white; border: none; border-radius: 4px; font-size: 12px; margin-top: 5px;">Снять</button>` :
						''
					}
					${!isApplied ? 
						`<button class="equip-medal-btn" data-inventory-index="${index}" data-medal-id="${item.id}" data-unique-id="${uniqueButtonId}" style="width: 100%; padding: 5px; cursor: pointer; background: #4CAF50; color: white; border: none; border-radius: 4px; font-size: 12px">Применить</button>` : 
						`<div style="font-size: 11px; color: gold; text-align: center; margin-bottom: 5px;">Применена в слот ${appliedSlot}</div>`
					}
					${!isRental && originalItem && originalItem.itemInStore !== false ?
						`<button class="sell-btn" data-index="${index}" data-price="${basePrice}" style="width: 100%; padding: 5px; cursor: pointer; background: #555; color: white; border: none; border-radius: 4px; font-size: 12px; margin-top: 5px;">Продать (<a style="color: ${currencyColor}">${basePrice.toFixed(2)} ₽</a>)</button>` :
						`<div class="rental-notice">Нет на рынке</div>`
					}
				</div>`;
			}

			el.innerHTML = `
				<div class="item-image-container">
					<img src='${imgSrc}' loading="lazy" onerror="this.onerror=null;this.src='images/none_item.png'" alt="${item.name}" width=80>
					${isRental ? `<div class="rental-overlay"><div class="rental-time">£ <span class="timer-val">${timeLeft}</span></div></div>` : ''}
					${isFragment ? `<div class="fragment-count" style="position:absolute;top:5px;right:5px;background:rgba(0,0,0,0.7);color:white;border-radius:50%;width:25px;height:25px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;">${count > 10000 ? '10k+' : count}</div>` : ''}
				</div>
				${slotsHTML}
				<div class="inventory-item-rarity ${rarityInfo.color}"><div class="inventory-item-name">${item.name}</div></div>
				${actionsHTML}
			`;

			if (originalItem && !isCharm && !isSticker && !isFragment && !item.name.startsWith('Medal') && !(item.name.startsWith('Graffiti') && !item.name.startsWith('GraffitiPack'))) {
				const imgContainer = el.querySelector('.item-image-container');
				setup3DViewer(imgContainer, item, originalItem);
			}

			if (!isRental && !isFragment) {
				el.addEventListener('click', (e) => {
					if (!e.target.closest('button')) toggleItemSelection(index);
				});
			}

			const bindClick = (selector, handler) => {
				const btn = el.querySelector(selector);
				if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); handler(e); });
			};

			if (isMedal) {
				const equipBtn = el.querySelector('.equip-medal-btn');
				if (equipBtn) {
					const currentIndex = index;
					equipBtn.addEventListener('click', (e) => {
						e.stopPropagation();
						const inventoryIndex = currentIndex;
						const medalItemData = inventory[inventoryIndex];
						
						if (!medalItemData) {
							showToast('Медаль не найдена');
							return;
						}
						if (medalItemData.slot !== undefined && medalItemData.slot !== null) {
							showToast('Эта медаль уже применена в слоте ' + (medalItemData.slot + 1));
							return;
						}
						
						openSlotSelectionModal(inventoryIndex, medalItemData.id, medalItemData);
					});
				}
				const unequipBtn = el.querySelector('.unequip-medal-btn');
				if (unequipBtn) {
					unequipBtn.addEventListener('click', (e) => {
						e.stopPropagation();
						const slot = parseInt(unequipBtn.dataset.slot);
						if (!isNaN(slot)) {
							unequipMedal(slot);
						}
					});
				}
				
				const sellBtn = el.querySelector('.sell-btn');
				if (sellBtn) {
					const currentIndex = index;
					sellBtn.addEventListener('click', (e) => {
						e.stopPropagation();
						const idx = currentIndex;
						const price = parseFloat(sellBtn.dataset.price);
						const medalToSell = inventory[idx];
						if (medalToSell && medalToSell.name.startsWith('Medal')) {
							if (medalToSell.slot !== undefined && medalToSell.slot !== null) {
								showToast('Нельзя продать примененную медаль! Сначала снимите её.');
								return;
							}
						}
						if (typeof sellItem === 'function') {
							sellItem(idx, price);
						}
					});
				}
			} else if (isFragment) {
				bindClick('.upgrade-fragment-btn', (e) => upgradeFragment(index, count, e.shiftKey));
				bindClick('.open-fragment-btn', (e) => openFragment(index, count, e)); 
				bindClick('.sell-fragment-btn', () => sellFragment(index, basePrice));
			} else {
				bindClick('.sell-btn', () => sellItem(index, displayPrice));
				if (isCase) bindClick('.open-case-btn', () => openCase(index));
				if (isCharm || isSticker) bindClick('.apply-item-btn', () => applyItem(index));
			}

			return el;
		};

		sortedRarities.forEach(rarity => {
			const g = groupedData[rarity];
			if (Object.values(g).every(arr => arr.length === 0)) return;

			g.fragments.forEach(d => fragment.appendChild(createItemElement(d, false, true, d.count)));
			g.withoutSlots.forEach(d => fragment.appendChild(createItemElement(d)));
			g.charms.forEach(d => fragment.appendChild(createItemElement(d)));
			g.withSlots.forEach(d => fragment.appendChild(createItemElement(d)));
			g.stickers.forEach(d => fragment.appendChild(createItemElement(d)));
			g.cases.forEach(d => fragment.appendChild(createItemElement(d)));
			g.rentals.forEach(d => fragment.appendChild(createItemElement(d, true)));
		});

		inventoryItemsElement.appendChild(fragment);

		if (!window.rentalTimerInterval) {
			window.rentalTimerInterval = setInterval(() => {
				document.querySelectorAll('.rental-time .timer-val').forEach(el => {
					const parent = el.closest('.inventory-item');
					if (!parent) return;
					const idx = parseInt(parent.dataset.index);
					const item = inventory[idx];
					if (item && item.rentalExpires) {
						const sec = Math.max(0, Math.ceil((item.rentalExpires - Date.now()) / 1000));
						el.textContent = `${Math.floor(sec/60)} м. ${sec%60} с.`;
					}
				});
			}, 1000);
		}
		
		saveGameState();
	}

	function addInventoryFiltersButton() {
		const inventoryActions = document.querySelector('.inventory-actions');
		if (inventoryActions && !document.getElementById('inventory-filters-btn')) {
			const filtersBtn = document.createElement('button');
			filtersBtn.id = 'inventory-filters-btn';
			filtersBtn.textContent = 'Фильтры';
			filtersBtn.style.padding = '10px 15px';
			filtersBtn.style.backgroundColor = '#5555ff';
			filtersBtn.style.color = 'white';
			filtersBtn.style.border = 'none';
			filtersBtn.style.borderRadius = '4px';
			filtersBtn.style.cursor = 'pointer';
			filtersBtn.style.marginLeft = '10px';
			
			filtersBtn.addEventListener('click', openInventoryFilters);
			
			inventoryActions.appendChild(filtersBtn);
		}
	}
	
	addInventoryFiltersButton();

	function openInventoryFilters() {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.display = 'flex';
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100%';
		modal.style.height = '100%';
		modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
		modal.style.zIndex = '1001';
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';

		modal.innerHTML = `
			<div class="modal-content" style="background-color: rgb(30 30 30 / 85%); padding: 20px; border-radius: 8px; width: 80%; max-width: 500px; max-height: 80vh; overflow: auto;">
				<h2 style="text-align: center; margin-top: 0;">Фильтры инвентаря</h2>
				
				<!-- Фильтр по коллекциям -->
				<div style="margin-bottom: 20px;">
					<h3 style="margin-bottom: 10px;">Коллекция</h3>
					<select class="global-ui" id="inventory-collection-filter" style="width: 100%; padding: 10px; background-color: #2a2a2a; border: none; border-radius: 4px; color: white;">
						<option value="all">Все коллекции</option>
						${Object.values(collectionsDatabase).map(collection => 
							`<option value="${collection.id}">${collection.name}</option>`
						).join('')}
					</select>
				</div>
				
				<!-- Фильтр по редкости -->
				<div style="margin-bottom: 20px;">
					<h3 style="margin-bottom: 10px;">Редкость</h3>
					<select id="inventory-rarity-filter" style="width: 100%; padding: 10px; background-color: #2a2a2a; border: none; border-radius: 4px; color: white;">
						<option value="all">Все редкости</option>
						${Object.keys(rarities).map(rarity => 
							`<option value="${rarity}" style="color: ${rarities[rarity].colorHex}">${rarities[rarity].name} (${rarities[rarity].color})</option>`
						).join('')}
					</select>
				</div>
				
				<!-- Фильтр по типу предмета -->
				<div style="margin-bottom: 20px;">
					<h3 style="margin-bottom: 10px;">Тип предмета</h3>
					<select id="inventory-type-filter" style="width: 100%; padding: 10px; background-color: #2a2a2a; border: none; border-radius: 4px; color: white;">
						<option value="all">Все типы</option>
						<option value="case">Кейсы</option>
						<option value="withSlots">Со слотами</option>
						<option value="withoutSlots">Без слотов</option>
						<option value="charm">Брелки</option>
						<option value="sticker">Стикеры</option>
						<option value="rental">Арендованные</option>
					</select>
				</div>
				
				<!-- Кнопки управления -->
				<div style="display: flex; justify-content: space-between; gap: 10px; margin-top: 30px;">
					<button id="reset-filters-btn" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; flex: 1;">Сбросить все</button>
					<button id="apply-filters-btn" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; flex: 1;">Применить</button>
					<button id="close-filters-btn" style="padding: 10px 20px; background-color: #555555; color: white; border: none; border-radius: 4px; cursor: pointer; flex: 1;">Закрыть</button>
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		let currentFilters = {
			collection: 'all',
			rarity: 'all',
			type: 'all'
		};

		const savedFilters = localStorage.getItem('inventoryFilters');
		if (savedFilters) {
			currentFilters = JSON.parse(savedFilters);
			document.getElementById('inventory-collection-filter').value = currentFilters.collection;
			document.getElementById('inventory-rarity-filter').value = currentFilters.rarity;
			document.getElementById('inventory-type-filter').value = currentFilters.type;
		}

		function applyFilters() {
			currentFilters = {
				collection: document.getElementById('inventory-collection-filter').value,
				rarity: document.getElementById('inventory-rarity-filter').value,
				type: document.getElementById('inventory-type-filter').value
			};

			localStorage.setItem('inventoryFilters', JSON.stringify(currentFilters));

			updateInventoryWithFilters();
			
			showToast('Фильтры применены');
			modal.remove();
		}

		function resetFilters() {
			document.getElementById('inventory-collection-filter').value = 'all';
			document.getElementById('inventory-rarity-filter').value = 'all';
			document.getElementById('inventory-type-filter').value = 'all';
			
			currentFilters = {
				collection: 'all',
				rarity: 'all',
				type: 'all'
			};
			
			localStorage.removeItem('inventoryFilters');
			updateInventoryWithFilters();
			
			showToast('Фильтры сброшены');
			modal.remove();
		}

		document.getElementById('apply-filters-btn').addEventListener('click', function() {
			applyFilters();
			// Не закрываем модал при применении фильтров на рынке
			if (typeof currentMarketFilters !== 'undefined') {
				modal.remove();
			}
		});
		document.getElementById('reset-filters-btn').addEventListener('click', resetFilters);
		document.getElementById('close-filters-btn').addEventListener('click', function() {
			modal.remove();
		});

		modal.addEventListener('click', function(e) {
			if (e.target === modal) {
				modal.remove();
			}
		});
	}

	function updateInventoryWithFilters() {
		const savedFilters = localStorage.getItem('inventoryFilters');
		const filters = savedFilters ? JSON.parse(savedFilters) : {
			collection: 'all',
			rarity: 'all',
			type: 'all'
		};

		const inventoryItems = document.querySelectorAll('.inventory-item');
		
		inventoryItems.forEach(item => {
			const index = parseInt(item.dataset.index);
			
			if (isNaN(index) || !inventory[index]) return;

			const inventoryItem = inventory[index];
			const originalItem = itemsDatabase.find(dbItem => dbItem.id === inventoryItem.id);
			
			let showItem = true;

			if (filters.collection !== 'all' && originalItem) {
				if (originalItem.collection !== filters.collection) {
					showItem = false;
				}
			}

			if (filters.rarity !== 'all') {
				if (inventoryItem.rarity !== filters.rarity) {
					showItem = false;
				}
			}

			if (filters.type !== 'all') {
				let itemType = '';
				
				if (inventoryItem.isRental) {
					itemType = 'rental';
				} else if (originalItem) {
					if (originalItem.isCase) {
						itemType = 'case';
					} else if (originalItem.isCharm) {
						itemType = 'charm';
					} else if (originalItem.isSticker) {
						itemType = 'sticker';
					} else if (originalItem.isItemWithoutSlot) {
						itemType = 'withoutSlots';
					} else {
						itemType = 'withSlots';
					}
				}
				
				if (itemType !== filters.type) {
					showItem = false;
				}
			}

			const imgElement = item.querySelector('img');
			
			if (imgElement) {
				if (!imgElement.src || imgElement.src === '' || imgElement.src.toLowerCase().includes('undefined')) {
					imgElement.src = 'images/none_item.png';
				}
			}
			item.style.display = showItem ? 'block' : 'none';
		});
	}

	const originalUpdateInventory = updateInventory;
	updateInventory = function() {
		originalUpdateInventory();
		updateInventoryWithFilters();
	};

	document.addEventListener('DOMContentLoaded', function() {
		setTimeout(addInventoryFiltersButton, 1000);
	});
	
	function addUpgradeButtonToInventory() {
		const inventoryActions = document.querySelector('.inventory-actions');
		if (inventoryActions && !document.getElementById('upgrade-items-btn')) {
			const upgradeBtn = document.createElement('button');
			upgradeBtn.id = 'upgrade-items-btn';
			upgradeBtn.textContent = 'Апгрейд';
			upgradeBtn.style.padding = '10px 15px';
			upgradeBtn.style.backgroundColor = '#4CAF50';
			upgradeBtn.style.color = 'white';
			upgradeBtn.style.border = 'none';
			upgradeBtn.style.borderRadius = '4px';
			upgradeBtn.style.cursor = 'pointer';
			upgradeBtn.style.marginLeft = '10px';
			
			upgradeBtn.addEventListener('click', openUpgradeMenu);
			
			inventoryActions.appendChild(upgradeBtn);
		}
	}

	function openUpgradeMenu() {
		const modal = document.createElement('div');
		modal.className = 'modal';
		Object.assign(modal.style, {
			display: 'flex', position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
			backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: '1001', justifyContent: 'center', alignItems: 'center'
		});

		modal.innerHTML = `
			<div class="modal-content" style="background-color: rgb(30 30 30 / 85%); padding: 20px; border-radius: 8px; width: 90%; max-width: 1200px; max-height: 85vh; overflow: hidden; display: flex; flex-direction: column;">
				<h2 style="text-align: center; margin-top: 0; color: #fff;">Апгрейд предметов</h2>
				
				<div style="display: flex; gap: 20px; flex: 1; overflow: hidden; min-height: 0;">
					<!-- Левая часть -->
					<div style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
						<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
							<h3 style="margin: 0; font-size: 16px;">Инвентарь</h3>
							<span id="selected-count-upgrade" style="color: gold; font-size: 14px; font-weight: bold;">Выбрано: 0</span>
						</div>
						
						<div style="display: flex; gap: 5px; margin-bottom: 10px; flex-wrap: wrap;">
							<button id="btn-select-all" style="padding: 6px 12px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Выбрать всё</button>
							<button id="btn-deselect-all" style="padding: 6px 12px; background: #607D8B; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Снять всё</button>
							<div style="flex: 1;"></div>
							<button id="btn-confirm-selection" style="padding: 6px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; opacity: 0.5; pointer-events: none;" disabled>ПОДТВЕРДИТЬ ВЫБОР</button>
						</div>

						<div style="margin-bottom: 5px;">
							<button id="sort-inventory-price" class="sort-btn active" style="padding: 4px 8px; margin-right: 5px; background: #444; color: white; border: none; cursor: pointer; font-size: 11px;">Цена ↓</button>
							<button id="sort-inventory-name" class="sort-btn" style="padding: 4px 8px; background: #444; color: white; border: none; cursor: pointer; font-size: 11px;">Название</button>
						</div>
						<div id="upgrade-inventory-items" class="global-ui" style="flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; padding: 5px;"></div>
					</div>
					
					<!-- Центральная часть -->
					<div style="flex: 0 0 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 15px; background-color: #2a2a2a; border-radius: 8px; border: 1px solid #444; position: relative;">
						<div id="center-overlay" style="position: absolute; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.6); z-index: 10; display: flex; align-items: center; justify-content: center; text-align: center; padding: 20px; border-radius: 8px;">
							<p style="color: #ccc; font-size: 14px;">Выберите предметы слева<br>и нажмите<br><b>"Подтвердить выбор"</b></p>
						</div>

						<div id="selected-target-info" style="text-align: center; width: 100%; z-index: 1;">
							<p style="color: #aaa;">Ожидание подтверждения...</p>
						</div>
						
						<div id="upgrade-chance-controls" style="margin-top: 20px; width: 100%; display: none; z-index: 1;">
							<label style="display: block; margin-bottom: 5px; color: #ddd; font-size: 13px;">Добавить баланс:</label>
							<input type="range" id="upgrade-balance-slider" min="0" max="0" value="0" style="width: 100%; margin-bottom: 10px; cursor: pointer;">
							<div style="display: flex; justify-content: space-between; font-size: 11px; color: #ccc;">
								<span id="min-balance">0 ₽</span>
								<span id="current-balance" style="color: gold; font-weight: bold;">0 ₽</span>
								<span id="max-balance">0 ₽</span>
							</div>
							<div id="chance-display" style="margin-top: 15px; font-weight: bold; font-size: 20px; text-align: center; color: gold; background: #333; padding: 10px; border-radius: 4px;"></div>
							<div style="margin-top: 8px; font-size: 11px; color: #888; text-align: center;">
								Ср. цена источника: <span id="avg-source-price" style="color: #fff;">0</span> ₽
							</div>
						</div>
					</div>
					
					<!-- Правая часть -->
					<div style="flex: 1; display: flex; flex-direction: column; min-width: 0; opacity: 0.3; pointer-events: none;" id="targets-panel">
						<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
							<h3 style="margin: 0; font-size: 16px;">Цель (Шанс 1-100%)</h3>
							<span id="target-count" style="color: #aaa; font-size: 12px;">Найдено: 0</span>
						</div>
						<div style="margin-bottom: 5px;">
							<button id="sort-target-price" class="sort-btn active" style="padding: 4px 8px; margin-right: 5px; background: #444; color: white; border: none; cursor: pointer; font-size: 11px;">Цена ↓</button>
							<button id="sort-target-name" class="sort-btn" style="padding: 4px 8px; background: #444; color: white; border: none; cursor: pointer; font-size: 11px;">Название</button>
						</div>
						<div id="upgrade-target-items" class="global-ui" style="flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; padding: 5px;"></div>
					</div>
				</div>
				
				<div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #444; flex-shrink: 0;">
					<button id="confirm-upgrade" style="padding: 12px 30px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; font-weight: bold; display: none; font-size: 16px;">АПГРЕЙДНУТЬ</button>
					<button id="cancel-upgrade" style="padding: 12px 30px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 16px;">Отмена</button>
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		let selectedInventoryIndices = new Set();
		let isSelectionConfirmed = false;
		let cachedAvgSourcePrice = 0;
		
		let selectedTargetItemId = null;
		let addedBalance = 0;
		
		let inventorySort = { key: 'price', desc: true };
		let targetSort = { key: 'price', desc: true };

		function getItemTotalValue(itemObj, isInventoryItem = false) {
			if (!itemObj) return 0;
			let price = 0;
			if (isInventoryItem) {
				const dbItem = itemsDatabase.find(db => db.id === itemObj.id);
				if (dbItem) price = calculateCurrentPrice(dbItem.price, dbItem.stock);
			} else {
				price = calculateCurrentPrice(itemObj.price, itemObj.stock);
			}

			if (itemObj.charm) {
				const charmItem = itemsDatabase.find(i => i.id === itemObj.charm.id);
				if (charmItem) price += Math.round((charmItem.price * 0.8) * 100) / 100;
			}
			if (itemObj.stickers && itemObj.stickers.length > 0) {
				itemObj.stickers.forEach(sticker => {
					const stickerItem = itemsDatabase.find(i => i.id === sticker.id);
					if (stickerItem) price += Math.round((stickerItem.price * 0.1) * 100) / 100;
				});
			}
			return price;
		}

		function calculateRawChance(sourceAvgPrice, targetPrice, addBal) {
			if (targetPrice <= 0) return 0;
			let chance = ((sourceAvgPrice + addBal) / targetPrice) * 100;
			if (sourceAvgPrice / targetPrice >= 0.2) chance += 15;
			
			if (alwaysUpgradeSuccess) return 100;
			if (chance >= 100) return 100;
			if (chance < 0) return 0;
			
			return chance;
		}

		function getEffectiveChance(rawChance) {
			if (alwaysUpgradeSuccess) return 100;
			if (rawChance >= 70) return 100; // Правило: 70%+ = гарантия
			return rawChance;
		}

		function lazyLoadVisibleImages() {
			const containers = [
				document.getElementById('upgrade-inventory-items'),
				document.getElementById('upgrade-target-items')
			];
			containers.forEach(container => {
				if (!container) return;
				const images = container.querySelectorAll('img[data-src]');
				const containerRect = container.getBoundingClientRect();
				images.forEach(img => {
					const imgRect = img.getBoundingClientRect();
					if (imgRect.top <= containerRect.bottom + 100 && imgRect.bottom >= containerRect.top - 100) {
						const src = img.getAttribute('data-src');
						if (src) { img.src = src; img.removeAttribute('data-src'); }
					}
				});
			});
		}

		function updateUIState() {
			const count = selectedInventoryIndices.size;
			const confirmBtn = document.getElementById('btn-confirm-selection');
			const countLabel = document.getElementById('selected-count-upgrade');
			const targetsPanel = document.getElementById('targets-panel');
			const centerOverlay = document.getElementById('center-overlay');
			const chanceControls = document.getElementById('upgrade-chance-controls');
			const confirmUpgradeBtn = document.getElementById('confirm-upgrade');

			countLabel.textContent = `Выбрано: ${count}`;

			if (count > 0) {
				confirmBtn.disabled = false;
				confirmBtn.style.opacity = '1';
				confirmBtn.style.pointerEvents = 'auto';
				confirmBtn.textContent = isSelectionConfirmed ? 'ИЗМЕНИТЬ ВЫБОР' : 'ПОДТВЕРДИТЬ ВЫБОР';
				confirmBtn.style.backgroundColor = isSelectionConfirmed ? '#FF9800' : '#4CAF50';
			} else {
				confirmBtn.disabled = true;
				confirmBtn.style.opacity = '0.5';
				confirmBtn.style.pointerEvents = 'none';
				confirmBtn.textContent = 'ПОДТВЕРДИТЬ ВЫБОР';
				isSelectionConfirmed = false;
			}

			if (isSelectionConfirmed) {
				targetsPanel.style.opacity = '1';
				targetsPanel.style.pointerEvents = 'auto';
				centerOverlay.style.display = 'none';
				chanceControls.style.display = 'block';
				if (selectedTargetItemId) confirmUpgradeBtn.style.display = 'block';
			} else {
				targetsPanel.style.opacity = '0.3';
				targetsPanel.style.pointerEvents = 'none';
				centerOverlay.style.display = 'flex';
				chanceControls.style.display = 'none';
				confirmUpgradeBtn.style.display = 'none';
				if (!isSelectionConfirmed && selectedTargetItemId) {
					selectedTargetItemId = null;
					document.getElementById('upgrade-target-items').innerHTML = '';
					document.getElementById('target-count').textContent = 'Найдено: 0';
				}
			}
		}

		function populateInventoryItems() {
			const container = document.getElementById('upgrade-inventory-items');
			if (!container) return;
			container.innerHTML = '';

			const filteredItems = inventory.map((item, index) => {
				const originalItem = itemsDatabase.find(dbItem => dbItem.id === item.id);
				if (!originalItem || originalItem.itemInStore === false || item.isRental) return null;
				if (item.name && item.name.toLowerCase().startsWith('medal')) {
					if (item.slot !== undefined && item.slot !== null) {
						return null;
					}
				}
				const price = getItemTotalValue(item, true);
				return { index, item, price, name: item.name };
			}).filter(i => i !== null);

			filteredItems.sort((a, b) => {
				if (inventorySort.key === 'name') return a.name.localeCompare(b.name);
				return inventorySort.desc ? b.price - a.price : a.price - b.price;
			});

			filteredItems.forEach(({ index, item, price }) => {
				const el = document.createElement('div');
				el.className = 'inventory-item-select';
				el.dataset.index = index;
				const isSelected = selectedInventoryIndices.has(index);
				
				el.style.border = isSelected ? '2px solid gold' : '1px solid transparent';
				el.style.backgroundColor = isSelected ? 'rgba(255, 215, 0, 0.15)' : 'transparent';
				el.style.cursor = 'pointer';
				el.style.padding = '5px';
				el.style.borderRadius = '5px';
				el.style.textAlign = 'center';
				el.style.transition = 'all 0.2s';
				
				el.innerHTML = `
					<img data-src="${item.image}" width="50" style="border-radius: 5px;" alt="${item.name}">
					<div style="font-size: 11px; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; height: 14px;">${item.name}</div>
					<div style="color: gold; font-size: 10px; margin-top: 2px;">${price.toFixed(0)} ₽</div>
				`;

				el.addEventListener('click', (e) => {
					if (isSelectionConfirmed) {
						isSelectionConfirmed = false;
						selectedTargetItemId = null;
					}

					if (selectedInventoryIndices.has(index)) {
						selectedInventoryIndices.delete(index);
					} else {
						selectedInventoryIndices.add(index);
					}
					
					populateInventoryItems();
					updateUIState();
				});

				container.appendChild(el);
			});
			setTimeout(lazyLoadVisibleImages, 0);
		}

		function populateTargetItems() {
			const container = document.getElementById('upgrade-target-items');
			const countLabel = document.getElementById('target-count');
			if (!container) return;
			container.innerHTML = '';

			if (!isSelectionConfirmed || selectedInventoryIndices.size === 0) {
				countLabel.textContent = 'Найдено: 0';
				return;
			}

			const avgSourcePrice = cachedAvgSourcePrice;

			const availableItems = itemsDatabase.filter(targetItem => {
				if (targetItem.itemInStore === false || targetItem.isRental) return false;
				const targetPrice = calculateCurrentPrice(targetItem.price, targetItem.stock);
				if (targetPrice <= avgSourcePrice) return false;

				let baseRawChance = calculateRawChance(avgSourcePrice, targetPrice, 0);
				
				if (baseRawChance >= 101) return false;

				const maxPossibleBalance = Math.floor(avgSourcePrice * 0.5);
				let maxRawChance = calculateRawChance(avgSourcePrice, targetPrice, maxPossibleBalance);
				
				if (maxRawChance < 5) return false;

				return true;
			});

			availableItems.sort((a, b) => {
				const priceA = calculateCurrentPrice(a.price, a.stock);
				const priceB = calculateCurrentPrice(b.price, b.stock);
				if (targetSort.key === 'name') return a.name.localeCompare(b.name);
				return targetSort.desc ? priceB - priceA : priceA - priceB;
			});

			countLabel.textContent = `Найдено: ${availableItems.length}`;

			availableItems.forEach(targetItem => {
				const targetPrice = calculateCurrentPrice(targetItem.price, targetItem.stock);
				const el = document.createElement('div');
				el.className = 'target-item-select';
				el.dataset.id = targetItem.id;
				el.style.border = (selectedTargetItemId === targetItem.id) ? '2px solid gold' : '1px solid transparent';
				el.style.backgroundColor = (selectedTargetItemId === targetItem.id) ? 'rgba(255, 215, 0, 0.15)' : 'transparent';
				el.style.cursor = 'pointer';
				el.style.padding = '5px';
				el.style.borderRadius = '5px';
				el.style.textAlign = 'center';

				el.innerHTML = `
					<img data-src="${targetItem.image}" width="50" style="border-radius: 5px;" alt="${targetItem.name}">
					<div style="font-size: 11px; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; height: 14px;">${targetItem.name}</div>
					<div style="color: gold; font-size: 10px; margin-top: 2px;">${targetPrice.toFixed(0)} ₽</div>
				`;

				el.addEventListener('click', () => {
					selectedTargetItemId = targetItem.id;
					populateTargetItems();
					showSelectedTargetInfo(avgSourcePrice);
					document.getElementById('confirm-upgrade').style.display = 'block';
					setupBalanceSlider(avgSourcePrice, targetPrice);
				});

				container.appendChild(el);
			});
			setTimeout(lazyLoadVisibleImages, 0);
		}

		function setupBalanceSlider(avgSourcePrice, targetPrice) {
			const slider = document.getElementById('upgrade-balance-slider');
			const maxBalance = Math.floor(avgSourcePrice * 0.5);
			slider.max = maxBalance;
			slider.value = 0;
			addedBalance = 0;

			document.getElementById('min-balance').textContent = '0 ₽';
			document.getElementById('max-balance').textContent = maxBalance.toLocaleString('ru-RU') + ' ₽';
			document.getElementById('current-balance').textContent = '0 ₽';
			updateChanceDisplay(avgSourcePrice, targetPrice);
		}

		function showSelectedTargetInfo(avgSourcePrice) {
			const infoContainer = document.getElementById('selected-target-info');
			const targetItem = itemsDatabase.find(item => item.id === selectedTargetItemId);
			if (!targetItem) return;
			const targetPrice = calculateCurrentPrice(targetItem.price, targetItem.stock);
			
			infoContainer.innerHTML = `
				<img src="${targetItem.image}" width="70" style="border-radius: 5px; border: 1px solid #555;" alt="${targetItem.name}">
				<div style="font-weight: bold; margin-top: 8px; color: #fff; font-size: 14px;">${targetItem.name}</div>
				<div style="color: gold; margin-top: 4px; font-size: 14px;">${targetPrice.toFixed(0)} ₽</div>
				<div style="font-size: 11px; color: #aaa; margin-top: 4px;">Заменяет предметов: <b style="color:#fff">${selectedInventoryIndices.size}</b></div>
			`;
		}

		function updateChanceDisplay(avgSourcePrice, targetPrice) {
			const slider = document.getElementById('upgrade-balance-slider');
			if (!slider) return;
			
			let currentBal = parseInt(slider.value);
			addedBalance = currentBal;
			
			if (currentBal > balance) {
				currentBal = Math.min(currentBal, Math.floor(balance));
				slider.value = currentBal; // синхронизируем визуал
			}
			
			const rawChance = calculateRawChance(avgSourcePrice, targetPrice, currentBal);
			const effectiveChance = getEffectiveChance(rawChance);
			
			document.getElementById('current-balance').textContent = currentBal.toLocaleString('ru-RU') + ' ₽';

			const display = document.getElementById('chance-display');
			let color = '#ffaa00';
			let msg = '';
			let displayText = rawChance.toFixed(2) + '%';

			if (effectiveChance >= 100) {
				color = '#4CAF50';
				msg = 'Гарантировано';
			} else if (rawChance >= 50) {
				color = '#8BC34A';
				msg = 'Хороший шанс';
			} else if (rawChance < 30) {
				color = '#f44336';
				msg = 'Низкий шанс';
			}

			display.innerHTML = `
				<div style="font-size: 24px; color: ${color};">${displayText}</div>
				<div style="font-size: 12px; color: #ccc;">${msg}</div>
			`;
		}

		document.getElementById('btn-select-all').addEventListener('click', () => {
			isSelectionConfirmed = false;
			selectedInventoryIndices.clear();
			inventory.forEach((item, index) => {
				const originalItem = itemsDatabase.find(db => db.id === item.id);
				if (item.name && item.name.toLowerCase().startsWith('medal')) {
					if (item.slot !== undefined && item.slot !== null) {
						return;
					} else if (originalItem && originalItem.itemInStore !== false && !item.isRental) {
						selectedInventoryIndices.add(index);
					}
				} else if (originalItem && originalItem.itemInStore !== false && !item.isRental) {
					selectedInventoryIndices.add(index);
				}
			});
			populateInventoryItems();
			updateUIState();
		});

		document.getElementById('btn-deselect-all').addEventListener('click', () => {
			isSelectionConfirmed = false;
			selectedInventoryIndices.clear();
			selectedTargetItemId = null;
			populateInventoryItems();
			updateUIState();
		});

		document.getElementById('btn-confirm-selection').addEventListener('click', () => {
			if (selectedInventoryIndices.size === 0) return;

			if (isSelectionConfirmed) {
				isSelectionConfirmed = false;
				selectedTargetItemId = null;
			} else {
				isSelectionConfirmed = true;
				let total = 0;
				selectedInventoryIndices.forEach(idx => {
					total += getItemTotalValue(inventory[idx], true);
				});
				cachedAvgSourcePrice = total / selectedInventoryIndices.size;
				document.getElementById('avg-source-price').textContent = cachedAvgSourcePrice.toLocaleString('ru-RU', {maximumFractionDigits: 0});
			}
			
			updateUIState();
			if (isSelectionConfirmed) populateTargetItems();
		});

		document.getElementById('sort-inventory-price').addEventListener('click', function() {
			inventorySort.desc = !inventorySort.desc;
			inventorySort.key = 'price';
			this.textContent = inventorySort.desc ? 'Цена ↓' : 'Цена ↑';
			populateInventoryItems();
		});
		document.getElementById('sort-inventory-name').addEventListener('click', function() {
			inventorySort.key = 'name';
			populateInventoryItems();
		});

		document.getElementById('sort-target-price').addEventListener('click', function() {
			targetSort.desc = !targetSort.desc;
			targetSort.key = 'price';
			this.textContent = targetSort.desc ? 'Цена ↓' : 'Цена ↑';
			if(isSelectionConfirmed) populateTargetItems();
		});
		document.getElementById('sort-target-name').addEventListener('click', function() {
			targetSort.key = 'name';
			if(isSelectionConfirmed) populateTargetItems();
		});

		document.getElementById('upgrade-balance-slider').addEventListener('input', function() {
			if (!isSelectionConfirmed || !selectedTargetItemId) return;
			const targetItem = itemsDatabase.find(i => i.id === selectedTargetItemId);
			const targetPrice = calculateCurrentPrice(targetItem.price, targetItem.stock);
			updateChanceDisplay(cachedAvgSourcePrice, targetPrice);
		});

		document.getElementById('cancel-upgrade').addEventListener('click', () => modal.remove());
		document.getElementById('confirm-upgrade').addEventListener('click', performUpgrade);

		document.querySelectorAll('#upgrade-inventory-items, #upgrade-target-items').forEach(c => 
			c.addEventListener('scroll', lazyLoadVisibleImages)
		);
		setTimeout(lazyLoadVisibleImages, 100);

		populateInventoryItems();
		updateUIState();

		function performUpgrade() {
			if (!isSelectionConfirmed || selectedInventoryIndices.size === 0 || !selectedTargetItemId) return;

			const targetItemDb = itemsDatabase.find(i => i.id === selectedTargetItemId);
			const avgSourcePrice = cachedAvgSourcePrice;
			
			balance = Math.round(balance * 100) / 100;
			addedBalance = Math.round(addedBalance * 100) / 100;
			if (balance < addedBalance) {
				showToast('Недостаточно баланса!', true);
				return;
			}

			const targetPrice = calculateCurrentPrice(targetItemDb.price, targetItemDb.stock);
			
			const rawChance = calculateRawChance(avgSourcePrice, targetPrice, addedBalance);
			const effectiveChance = getEffectiveChance(rawChance);

			const isSuccess = alwaysUpgradeSuccess ? true : (Math.random() * 100 <= effectiveChance);

			const itemsToAdd = [];
			
			if (isSuccess) {
				balance -= addedBalance;
				balance = Math.round(balance * 100) / 100;
				balanceAmount.textContent = balance.toLocaleString('ru-RU');
				selectedInventoryIndices.forEach(idx => {
					const oldItem = inventory[idx];
					const newItem = {
						id: targetItemDb.id, name: targetItemDb.name,
						rarity: targetItemDb.rarity, image: targetItemDb.image
					};
					const canHoldItems = !targetItemDb.isCase && !targetItemDb.isSticker && !targetItemDb.isCharm;
					if (canHoldItems) {
						if (oldItem.stickers) newItem.stickers = [...oldItem.stickers];
						if (oldItem.charm) newItem.charm = { ...oldItem.charm };
					} else {
						if (oldItem?.stickers) {
							oldItem.stickers.forEach(st => {
								const stDb = itemsDatabase.find(x => x.id === st.id);
								if(stDb) itemsToAdd.push({ id: stDb.id, name: stDb.name, rarity: stDb.rarity, image: stDb.image });
							});
						}
						if (oldItem.charm) {
							const chDb = itemsDatabase.find(x => x.id === oldItem.charm.id);
							if(chDb) itemsToAdd.push({ id: chDb.id, name: chDb.name, rarity: chDb.rarity, image: chDb.image });
						}
					}
					itemsToAdd.push(newItem);
				});
				showToast(`Успех! Получено ${itemsToAdd.length} шт.`, false);
			} else {
				let totalSourceVal = 0;
				selectedInventoryIndices.forEach(idx => totalSourceVal += getItemTotalValue(inventory[idx], true));
				const refundAmount = totalSourceVal * 0.3;
				balance += refundAmount;
				balance -= addedBalance;
				balance = Math.round(balance * 100) / 100;
				balanceAmount.textContent = balance.toLocaleString('ru-RU');
				showToast(`Неудача. Вернулось ${refundAmount.toFixed(2)} ₽`, true);
			}

			const indicesToDelete = Array.from(selectedInventoryIndices).sort((a, b) => b - a);
			indicesToDelete.forEach(idx => inventory.splice(idx, 1));
			itemsToAdd.forEach(item => inventory.push(item));

			if (typeof updateInventory === 'function') updateInventory();
			if (typeof UpdateStatrackFrame === 'function') UpdateStatrackFrame(balance);
			const balEl = document.querySelector('.balance-amount');
			if(balEl) balEl.textContent = balance.toLocaleString('ru-RU');

			modal.remove();
		}
	}
	
	function openSlotSelectionModal(inventoryIndex, medalId, medalItem) {
		validateAndFixMedalSlots();
		const medalInInventory = inventory[inventoryIndex];
		
		if (medalInInventory.slot !== undefined && medalInInventory.slot !== null) {
			showToast('Эта медаль уже применена в слоте ' + (medalInInventory.slot + 1));
			return;
		}
		
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.8);
			z-index: 100001;
			display: flex;
			justify-content: center;
			align-items: center;
		`;
		
		const freeSlots = [];
		const sameMedalSlots = [];
		
		for (let i = 0; i < currentMedals.length; i++) {
			if (currentMedals[i] === null) {
				freeSlots.push(i);
			} else if (currentMedals[i] === medalId) {
				const appliedCopiesCount = inventory.filter(item => 
					item.id === medalId && item.slot !== undefined && item.slot !== null
				).length;
				sameMedalSlots.push({ slot: i, count: appliedCopiesCount });
			}
		}
		
		modal.innerHTML = `
			<div class="modal-content" style="
				background: rgba(30, 30, 30, 0.95);
				border: 2px solid gold;
				border-radius: 8px;
				width: 90%;
				max-width: 600px;
				padding: 20px;
			">
				<h3 style="color: gold; margin: 0 0 15px;">Выберите слот для медали</h3>
				<p style="margin-bottom: 10px;">Медаль: ${medalItem.name}</p>
				<p style="margin-bottom: 20px; font-size: 12px; color: #aaa;">Это ${getMedalCopyNumber(medalId)}-я копия этой медали в инвентаре</p>
				
				${sameMedalSlots.length > 0 ? `
					<div style="margin-bottom: 15px; padding: 10px; background: rgba(255, 215, 0, 0.1); border-radius: 8px;">
						<div style="color: gold; font-size: 12px; margin-bottom: 5px;">ℹ️ Такая медаль уже применена в слотах:</div>
						<div style="color: white; font-size: 14px;">${sameMedalSlots.map(s => s.slot + 1).join(', ')}</div>
						<div style="color: #aaa; font-size: 11px; margin-top: 5px;">Вы можете применить эту копию в любой свободный слот</div>
					</div>
				` : ''}
				
				<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px;">
					${[0,1,2,3,4].map(i => {
						const isOccupied = currentMedals[i] !== null;
						const isSameMedal = currentMedals[i] === medalId;
						let occupiedText = '';
						let buttonStyle = '';
						
						if (isOccupied) {
							if (isSameMedal) {
								occupiedText = `Занят (другая копия)`;
								buttonStyle = 'background: #ffaa44; cursor: not-allowed;';
							} else {
								const occupiedMedalName = itemsDatabase.find(item => item.id === currentMedals[i])?.name || '?';
								occupiedText = `Занят: ${occupiedMedalName}`;
								buttonStyle = 'background: #ff4444; cursor: not-allowed;';
							}
						} else {
							occupiedText = 'Свободен';
							buttonStyle = 'background: #4CAF50; cursor: pointer;';
						}
						
						return `
							<button class="slot-btn" data-slot="${i}" style="
								padding: 15px;
								${buttonStyle}
								color: white;
								border: none;
								border-radius: 8px;
								opacity: ${isOccupied ? 0.6 : 1};
							" ${isOccupied ? 'disabled' : ''}>
								Слот ${i + 1}<br>
								<span style="font-size: 11px;">${occupiedText}</span>
							</button>
						`;
					}).join('')}
				</div>
				
				<div style="display: flex; gap: 10px; justify-content: center;">
					<button id="cancel-slot-select" style="
						padding: 10px 20px;
						background: #f44336;
						color: white;
						border: none;
						border-radius: 4px;
						cursor: pointer;
					">Отмена</button>
				</div>
			</div>
		`;
		
		document.body.appendChild(modal);
		
		modal.querySelectorAll('.slot-btn:not([disabled])').forEach(btn => {
			btn.addEventListener('click', () => {
				const slot = parseInt(btn.dataset.slot);
				if (equipMedal(inventoryIndex, slot)) {
					modal.remove();
				}
			});
		});
		
		document.getElementById('cancel-slot-select').addEventListener('click', () => modal.remove());
		
		modal.addEventListener('click', (e) => {
			if (e.target === modal) modal.remove();
		});
	}

	function getMedalCopyNumber(medalId) {
		const copies = inventory.filter(item => item.id === medalId);
		const appliedCopies = copies.filter(item => item.slot !== undefined && item.slot !== null).length;
		const availableCopies = copies.filter(item => item.slot === undefined || item.slot === null).length;
		
		return `${appliedCopies + 1} из ${copies.length}`;
	}
	
	function openUnequipSelectionModal() {
		const filledSlots = [];
		for (let i = 0; i < currentMedals.length; i++) {
			if (currentMedals[i] !== null) {
				const medalId = currentMedals[i];
				const medalData = itemsDatabase.find(item => item.id === medalId);
				const medalInInventory = inventory.find(item => 
					item.id === medalId && item.slot === i
				);
				
				if (medalData) {
					filledSlots.push({ 
						slot: i, 
						medalId: medalId, 
						medalData: medalData,
						medalInInventory: medalInInventory
					});
				}
			}
		}
		
		if (filledSlots.length === 0) {
			showToast('Нет примененных медалей');
			return;
		}
		
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.8);
			z-index: 100001;
			display: flex;
			justify-content: center;
			align-items: center;
		`;
		
		modal.innerHTML = `
			<div class="modal-content" style="
				background: rgba(30, 30, 30, 0.95);
				border: 2px solid gold;
				border-radius: 8px;
				width: 90%;
				max-width: 600px;
				padding: 20px;
			">
				<h3 style="color: gold; margin: 0 0 15px;">Снять медаль</h3>
				<div id="unequip-medals-list" style="max-height: 400px; overflow-y: auto;">
					${filledSlots.map(({slot, medalData, medalInInventory}) => `
						<div class="unequip-item" style="
							display: flex;
							align-items: center;
							padding: 10px;
							margin-bottom: 10px;
							background: #2a2a2a;
							border-radius: 8px;
							gap: 15px;
						">
							<img src="${medalData.image}" style="width: 50px; height: 50px; object-fit: contain;">
							<div style="flex: 1;">
								<div style="font-weight: bold;">${medalData.name}</div>
								<div style="font-size: 12px; color: #aaa;">Слот ${slot + 1}</div>
								${medalInInventory ? '<div style="font-size: 10px; color: #4CAF50;">✓ В инвентаре</div>' : '<div style="font-size: 10px; color: #ff4444;">⚠️ Не найдена в инвентаре</div>'}
							</div>
							<button class="unequip-slot-btn" data-slot="${slot}" style="
								padding: 8px 15px;
								background: #f44336;
								color: white;
								border: none;
								border-radius: 4px;
								cursor: pointer;
							">Снять</button>
						</div>
					`).join('')}
				</div>
				<div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
					<button id="cancel-unequip" style="
						padding: 10px 20px;
						background: #555;
						color: white;
						border: none;
						border-radius: 4px;
						cursor: pointer;
					">Отмена</button>
				</div>
			</div>
		`;
		
		document.body.appendChild(modal);
		
		modal.querySelectorAll('.unequip-slot-btn').forEach(btn => {
			btn.addEventListener('click', () => {
				const slot = parseInt(btn.dataset.slot);
				if (unequipMedal(slot)) {
					modal.remove();
				}
			});
		});
		
		document.getElementById('cancel-unequip').addEventListener('click', () => modal.remove());
		
		modal.addEventListener('click', (e) => {
			if (e.target === modal) modal.remove();
		});
	}
	
	function equipMedal(inventoryIndex, slotIndex) {
		
		validateAndFixMedalSlots();
		
		if (inventoryIndex < 0 || inventoryIndex >= inventory.length) {
			showToast('Медаль не найдена в инвентаре');
			return false;
		}
		
		const medalItem = inventory[inventoryIndex];
		
		if (!medalItem.name || !medalItem.name.startsWith('Medal')) {
			showToast('Это не медаль');
			return false;
		}
		
		if (medalItem.slot !== undefined && medalItem.slot !== null) {
			showToast('Эта медаль уже применена в слоте ' + (medalItem.slot + 1));
			return false;
		}
		
		if (slotIndex < 0 || slotIndex >= 5) {
			showToast('Неверный номер слота (1-5)');
			return false;
		}
		
		if (currentMedals[slotIndex] !== null) {
			const existingMedalId = currentMedals[slotIndex];
			const existingMedalInInventory = inventory.find(item => 
				item.id === existingMedalId && item.slot === slotIndex
			);
			
			if (existingMedalInInventory) {
				return false;
			} else {
				currentMedals[slotIndex] = null;
			}
		}
		
		medalItem.slot = slotIndex;
		currentMedals[slotIndex] = medalItem.id;
		
		showToast(`Медаль "${medalItem.name}" применена в слот ${slotIndex + 1}!`);
		updateInventory();
		saveGameState();
		updateProfileMedalDisplay();
		return true;
	}

	function unequipMedal(slotIndex) {
		validateAndFixMedalSlots();
		
		if (slotIndex < 0 || slotIndex >= 5) {
			showToast('Неверный номер слота');
			return false;
		}
		
		const medalId = currentMedals[slotIndex];
		if (!medalId) {
			showToast(`Слот ${slotIndex + 1} пуст`);
			return false;
		}
		
		const medalInInventory = inventory.find(item => 
			item.id === medalId && item.slot === slotIndex
		);
		
		if (!medalInInventory) {
			currentMedals[slotIndex] = null;
			showToast(`Слот ${slotIndex + 1} очищен (медаль не найдена в инвентаре)`);
			saveGameState();
			updateProfileMedalDisplay();
			return true;
		}
		
		delete medalInInventory.slot;
		
		currentMedals[slotIndex] = null;
		showToast(`Медаль снята со слота ${slotIndex + 1}`);
		updateInventory();
		saveGameState();
		updateProfileMedalDisplay();
		return true;
	}
	
	function updateRentalTimers() {
		const now = Date.now();
		const rentalItems = document.querySelectorAll('.rental-item');
		
		rentalItems.forEach(itemElement => {
			const index = parseInt(itemElement.dataset.index);
			const item = inventory[index];
			if (item && item.isRental && item.rentalExpires) {
				const totalSecondsLeft = Math.max(0, Math.ceil((item.rentalExpires - now) / 1000));
				const minutesLeft = Math.floor(totalSecondsLeft / 60);
				const secondsLeft = totalSecondsLeft % 60;
				const timerElement = itemElement.querySelector('.rental-time');
				if (timerElement) {
					timerElement.innerHTML = `<span style="font-weight: normal">£</span> <span style="font-weight: bold">${minutesLeft} м. ${secondsLeft} с.</span>`;
				}
				
				if (totalSecondsLeft <= 0) {
					item.expired = true;
				}
			}
		});
		
		const expiredCount = inventory.filter(item => item.expired).length;
		if (expiredCount > 0) {
			inventory = inventory.filter(item => !item.expired);
			updateInventory(); // Полное обновление только если есть истекшие предметы
		}
	}

	function sellItem(index, price) {
	  const soldItem = inventory[index];
	  const shopItem = itemsDatabase.find(item => item.id === soldItem.id);
	  
	  if (shopItem && shopItem.itemInStore === false) {
		showToast('Этот предмет нельзя продать!', true);
		return;
	  }
	  
	  if (soldItem.name && soldItem.name.startsWith('Medal')) {
		  if (soldItem.slot !== undefined && soldItem.slot !== null) {
			  showToast('Нельзя продать примененную медаль! Сначала снимите её.', true);
			  return false;
		  }
	  }
	  
	  let totalPrice = Math.round(price * 100) / 100;
	  
	  if (soldItem.charm) {
		const charmItem = itemsDatabase.find(item => item.id === soldItem.charm.id);
		if (charmItem) {
		  inventory.push({
			id: charmItem.id,
			name: charmItem.name,
			rarity: charmItem.rarity,
			image: charmItem.image
		  });
		  showToast(`Брелок "${charmItem.name}" снят и возвращен в инвентарь`);
		}
	  }
	  
	  if (soldItem.stickers && soldItem.stickers.length > 0) {
		soldItem.stickers.forEach(sticker => {
		  const stickerItem = itemsDatabase.find(item => item.id === sticker.id);
		  if (stickerItem) {
			totalPrice += Math.round((stickerItem.price * 0.4) * 100) / 100;
		  }
		});
	  }
	  
	  if (shopItem && shopItem.priceMultiply > 0) {
		const newPrice = Math.max(0, shopItem.price - shopItem.priceMultiply);
		shopItem.price = newPrice;
		updateItemPriceInUI(shopItem);
	  }
	  
	  if (shopItem && !shopItem.name.endsWith('Fragment')) {
		const itemElement = document.getElementById(shopItem.id);
		if (itemElement) {
		  const marketLotsEl = itemElement.querySelector('.market-lots');
		  const currentStock = marketLotsEl && marketLotsEl.textContent ? parseInt(marketLotsEl.textContent) : shopItem.stock;
                  const btn = itemElement.querySelector('.find-on-platform-btn') || itemElement.querySelector('.rent-item-btn');
                  const max = btn ? parseInt(btn.getAttribute('data-max')) : 0;
		  if (marketLotsEl) updateStock(itemElement, currentStock + 1, max);
		} else {
			shopItem.stock += 1;
		}
	  }
	  
	  inventory.splice(index, 1);
	  balance += Math.round(totalPrice * 100) / 100;
	  balance = Math.round(balance * 100) / 100;
	  addExp(Math.round(totalPrice));
	  balanceAmount.textContent = balance.toLocaleString('ru-RU');
	  UpdateStatrackFrame(balance);
	  updateMMRang(Math.round(totalPrice));
	  updateInventory();
	  sortItemsByPrice();
	  showToast(`Предмет продан за ${totalPrice.toFixed(2)} ₽`);
	  saveGameState();
	}
	
	function closeAllModals() {
		document.querySelectorAll('.modal').forEach(modal => modal.remove());
	}
	
	function sellAllItems() {
		let itemsToSell = inventory.filter(item => {
			if (item.isRental) return false;
			if (item.name && item.name.startsWith('Medal')) {
				if (item.slot !== undefined && item.slot !== null) {
					return false; // Примененную медаль не продаем
				}
			}
			
			const originalItem = itemsDatabase.find(dbItem => dbItem.id === item.id);
			return originalItem && originalItem.itemInStore !== false;
		});
		
		if (itemsToSell.length === 0) {
			showToast('Нет предметов для продажи!', true);
			return;
		}

		let total = 0;
		const returnedItems = [];
		const itemsToRemove = [];
		
		itemsToSell.forEach(item => {
			const originalItem = itemsDatabase.find(dbItem => dbItem.id === item.id);
			if (originalItem) {
				total += Math.round((originalItem.price) * 100) / 100;
				itemsToRemove.push(item);
				if (originalItem.priceMultiply > 0) {
					originalItem.price = Math.max(0, originalItem.price - originalItem.priceMultiply);
					updateItemPriceInUI(originalItem);
				}
				
				const shopItem = document.getElementById(originalItem.id);
				if (shopItem) {
					const stockEl = shopItem.querySelector('.market-lots');
					const currentStock = stockEl && stockEl.textContent ? parseInt(stockEl.textContent) : originalItem.stock;
                                        const btn = shopItem.querySelector('.find-on-platform-btn') || shopItem.querySelector('.rent-item-btn');
                                        const max = btn ? parseInt(btn.getAttribute('data-max')) : 0;
					if (stockEl) updateStock(shopItem, currentStock + 1, max);
				} else {
					originalItem.stock += 1;
				}
				
				if (item.charm) {
					const charmItem = itemsDatabase.find(dbItem => dbItem.id === item.charm.id);
					if (charmItem) {
						returnedItems.push(charmItem.name);
						inventory.push({
							id: charmItem.id,
							name: charmItem.name,
							rarity: charmItem.rarity,
							image: charmItem.image
						});
					}
				}
				
				if (item.stickers && item.stickers.length > 0) {
					item.stickers.forEach(sticker => {
						const stickerItem = itemsDatabase.find(dbItem => dbItem.id === sticker.id);
						if (stickerItem) {
							total += Math.round((stickerItem.price * 0.4) * 100) / 100;
						}
					});
				}
			}
		});

		inventory = inventory.filter(item => {
			const isInRemoveList = itemsToRemove.some(removeItem => removeItem === item);
			return !isInRemoveList;
		});
		if (total > 0) {
			balance += Math.round(total * 100) / 100;
			balance = Math.round(balance * 100) / 100;
			addExp(Math.round(total));
			updateMMRang(Math.round(total));
			balanceAmount.textContent = balance.toLocaleString('ru-RU');
			UpdateStatrackFrame(balance);
			
			let message = `Продано ${itemsToRemove.length} предметов на сумму ${total.toLocaleString('ru-RU')} ₽`;
			if (returnedItems.length > 0) {
				message += `. Возвращены брелки: ${returnedItems.join(', ')}`;
			}
			
			showToast(message);
			updateInventory();
			saveGameState();
		}
		updateInventory();
	}

	sellAllBtn.addEventListener('click', sellAllItems);

	function toggleItemSelection(index) {
		const item = inventory[index];
		if (item.isRental) {
			showToast('Арендованные предметы нельзя использовать для крафта', true);
			return;
		}
		
		if (item.name && item.name.startsWith('Medal')) {
			if (item.slot !== undefined && item.slot !== null) {
				showToast('Применённые медли нельзя использовать для крафта', true);
				return;
			}
		}
		
		const itemIndex = selectedItems.indexOf(index);
		const itemElement = inventoryItemsElement.querySelector(`.inventory-item[data-index="${index}"]`);
		
		if (itemIndex === -1) {
			if (selectedItems.length < 10) {
				selectedItems.push(index);
				itemElement.style.border = '2px solid gold';
			} else {
				showToast('Можно выбрать только 10 предметов', true);
				return;
			}
		} else {
			selectedItems.splice(itemIndex, 1);
			itemElement.style.border = 'none';
		}
		
		updateSelectionInfo();
	}
	
	function updateSelectionInfo() {
		const count = selectedItems.length;
		selectedCountElement.textContent = `Выбрано: ${count}/10`;
		craftBtn.disabled = count !== 10;
		
		if (count === 10) {
			const craftInfo = getCraftRarity(selectedItems);
			if (craftInfo.rarity) {
				craftBtn.textContent = `Создать ${rarities[craftInfo.rarity].name} предмет`;
				craftBtn.disabled = false;
				craftBtn.dataset.craftType = craftInfo.type;
				craftBtn.dataset.craftRarity = craftInfo.rarity;
				craftBtn.dataset.selectedIndexes = JSON.stringify([...selectedItems]);
			} else {
				craftBtn.textContent = 'Нельзя улучшить дальше';
				craftBtn.disabled = true;
			}
		}
	}
	
	function resetSelection() {
		selectedItems.forEach(index => {
			const itemElement = inventoryItemsElement.querySelector(`.inventory-item[data-index="${index}"]`);
			if (itemElement) {
				itemElement.style.border = 'none';
			}
		});
		
		selectedItems = [];
		updateSelectionInfo();
		saveGameState();
	}
	
	function getCraftRarity(selectedItems) {
		const hasRentalItems = selectedItems.some(index => inventory[index]?.isRental) || false;
		if (hasRentalItems) {
			return { rarity: null, type: null };
		}
		const rarityCounts = {};
		const typeCounts = {
			charms: 0,
			stickers: 0,
			withoutSlots: 0,
			others: 0
		};
		
		selectedItems.forEach(index => {
			const item = inventory[index];
			const dbItem = itemsDatabase.find(db => db.id === item?.id);
			
			if (!rarityCounts[item?.rarity]) {
				rarityCounts[item?.rarity] = 0;
			}
			rarityCounts[item?.rarity]++;
			
			if (dbItem) {
				if (dbItem.isCharm) {
					typeCounts.charms++;
				} else if (dbItem.isSticker) {
					typeCounts.stickers++;
				} else if (dbItem.isItemWithoutSlot) {
					typeCounts.withoutSlots++;
				} else {
					typeCounts.others++;
				}
			}
		});
		
		let maxRarity = null;
		let maxCount = 0;
		let sameCount = true;
		let prevCount = null;
		
		Object.keys(rarityCounts).forEach(rarity => {
			if (rarityCounts[rarity] > maxCount) {
				maxCount = rarityCounts[rarity];
				maxRarity = rarity;
			}
			
			if (prevCount !== null && prevCount !== rarityCounts[rarity]) {
				sameCount = false;
			}
			prevCount = rarityCounts[rarity];
		});
		
		let craftType = null;
		const maxTypeCount = Math.max(typeCounts.charms, typeCounts.stickers, typeCounts.withoutSlots, typeCounts.others);
		
		if (maxTypeCount === typeCounts.charms) {
			craftType = 'charm';
		} else if (maxTypeCount === typeCounts.stickers) {
			craftType = 'sticker';
		} else if (maxTypeCount === typeCounts.withoutSlots) {
			craftType = 'withoutSlot';
		} else {
			craftType = 'other';
		}
		
		return {
			rarity: rarities[maxRarity]?.next,
			type: craftType
		};
	}

	craftBtn.addEventListener('click', function() {
		if (selectedItems.length !== 10) return;
		
		const originalIndexes = JSON.parse(this.dataset.selectedIndexes || '[]');
		const itemsChanged = !originalIndexes.every(index => {
			return index < inventory.length && selectedItems.includes(index);
		});
		
		const craftRarity = this.dataset.craftRarity;
		const craftType = this.dataset.craftType;
		
		if (!craftRarity) {
			showToast('Невозможно создать предмет более высокой редкости', true);
			return;
		}
		
		const collectionStats = {};
		const validIndexes = [];
		const allStickers = [];
		
		originalIndexes.forEach(index => {
			if (index < inventory.length) {
				const item = inventory[index];
				const dbItem = itemsDatabase.find(db => db.id === item?.id);
				
				if (dbItem && dbItem.collection) {
					if (!collectionStats[dbItem.collection]) {
						collectionStats[dbItem.collection] = 0;
					}
					collectionStats[dbItem.collection]++;
					validIndexes.push(index);
				}
				
				if (item.stickers && item.stickers.length > 0) {
					item.stickers.forEach(sticker => {
						const stickerItem = itemsDatabase.find(db => db.id === sticker.id);
						if (stickerItem) {
							allStickers.push({
								id: sticker.id,
								name: sticker.name,
								rarity: stickerItem.rarity,
								image: sticker.image,
								value: stickerItem.price || 0
							});
						}
					});
				}
			}
		});

		let totalStickersValue = allStickers.reduce((sum, sticker) => sum + sticker.value, 0);
		totalStickersValue *= 1.5;
		
		let stickersCount;
		if (totalStickersValue > 0) {
			if (totalStickersValue > 1500000) {
				stickersCount = 4; // Очень большая стоимость - 4 стикера
			} else if (totalStickersValue > 1000000) {
				stickersCount = 3; // Большая стоимость - 3 стикера  
			} else if (totalStickersValue > 500000) {
				stickersCount = 2; // Средняя стоимость - 2 стикера
			} else {
				stickersCount = 1; // Малая стоимость - 1 стикер
			}
			
			if (totalStickersValue > 2000000 && stickersCount < 4) {
				stickersCount = 4;
			}
		} else {
			stickersCount = Math.floor(Math.random() * 5); // от 0 до 4
		}
		
		const selectedStickers = selectStickersForCraft(allStickers, stickersCount, totalStickersValue);
				
		if (Object.keys(collectionStats).length === 0) {
			const allCollections = [...new Set(itemsDatabase.map(item => item.collection).filter(Boolean))];
			if (allCollections.length > 0) {
				const randomCollection = allCollections[Math.floor(Math.random() * allCollections.length)];
				collectionStats[randomCollection] = 10;
			}
		}
		
		let mostPopularCollection = null;
		let maxCount = 0;
		
		Object.entries(collectionStats).forEach(([collection, count]) => {
			if (count > maxCount) {
				maxCount = count;
				mostPopularCollection = collection;
			}
		});
		
		let availableItems = itemsDatabase.filter(item => 
			item.rarity === craftRarity && 
			item.collection === mostPopularCollection &&
			(
				(craftType === 'charm' && item.isCharm) ||
				(craftType === 'sticker' && item.isSticker) ||
				(craftType === 'withoutSlot' && item.isItemWithoutSlot) ||
				(craftType === 'other' && !item.isCharm && !item.isSticker && !item.isItemWithoutSlot)
			)
		);
		
		if (availableItems.length === 0) {
			availableItems = itemsDatabase.filter(item => 
				item.rarity === craftRarity &&
				item.collection === mostPopularCollection
			);
		}
		
		if (availableItems.length === 0) {
			availableItems = itemsDatabase.filter(item => 
				item.rarity === craftRarity &&
				(
					(craftType === 'charm' && item.isCharm) ||
					(craftType === 'sticker' && item.isSticker) ||
					(craftType === 'withoutSlot' && item.isItemWithoutSlot) ||
					(craftType === 'other' && !item.isCharm && !item.isSticker && !item.isItemWithoutSlot)
				)
			);
		}
		
		if (availableItems.length === 0) {
			availableItems = itemsDatabase.filter(item => item.rarity === craftRarity);
		}
		
		if (availableItems.length != 0) {
			availableItems = availableItems.filter(item => item.isRental === false && !item.id.endsWith('_rental') && !item.name.endsWith('(TimeLimited)'));
		}
		
		if (availableItems.length === 0) {
			showToast('Нет доступных предметов этой редкости', true);
			return;
		}
		
		const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
		
		if (!itemsChanged && validIndexes.length > 0) {
			const charmsToReturn = [];
			
			validIndexes.forEach(index => {
				const item = inventory[index];
				if (item.charm) {
					charmsToReturn.push(item.charm);
				}
			});
			
			const indexesToRemove = [...validIndexes].sort((a, b) => b - a);
			indexesToRemove.forEach(index => {
				inventory.splice(index, 1);
			});
			
			charmsToReturn.forEach(charm => {
				const charmItem = itemsDatabase.find(item => item.id === charm.id);
				if (charmItem) {
					inventory.push({
						id: charmItem.id,
						name: charmItem.name,
						rarity: charmItem.rarity,
						image: charmItem.image
					});
				}
			});
			
			if (charmsToReturn.length > 0) {
				showToast(`При крафте возвращены брелки (${charmsToReturn.length} шт.)`);
			}
		} else if (itemsChanged) {
			showToast('Состав выбранных предметов изменился. Предметы не были использованы для крафта.');
		}
		
		const craftedItem = {
			id: randomItem.id.replace(/_rental$/, ''),
			name: randomItem.name.replace(/ \(Аренда\)$/, ''),
			rarity: randomItem.rarity,
			image: randomItem.image,
			collection: randomItem.collection
		};
		
		if (selectedStickers.length > 0) {
			craftedItem.stickers = selectedStickers.map(sticker => ({
				id: sticker.id,
				name: sticker.name,
				image: sticker.image
			}));
		}
		
		if (craftRarity) {
			addBattlePassStarsForCraft(craftRarity);
			updateSouzRang(craftRarity);
		}
		
		inventory.push(craftedItem);
		const stars_rairty = {
			'common': 0,
			'uncommon': 2,
			'rare': 4,
			'epic': 8,
			'legendary': 16,
			'arcane': 32,
			'nameless': 64,
			'none': 128
		}
		const starsGain = stars_rairty[randomItem.rarity] || 0;
		const starsToAdd = starsGain * 125;
		addExp(starsToAdd);
		
		showCraftResult(craftedItem, selectedStickers, totalStickersValue);
		
		updateInventory();
		resetSelection();
		
		saveGameState();
	});

	function selectStickersForCraft(allStickers, maxCount, totalValue) {
		if (allStickers.length === 0 || maxCount === 0) return [];
		
		const allAvailableStickers = itemsDatabase
			.filter(item => item.isSticker && item.itemInStore !== false)
			.map(sticker => ({
				id: sticker.id,
				name: sticker.name,
				rarity: sticker.rarity,
				image: sticker.image,
				value: sticker.price || 0
			}))
			.sort((a, b) => b.value - a.value);

		const maxAllowedValue = totalValue;

		const mostExpensiveSticker = allAvailableStickers[0];

		const selectedStickers = [];
		let currentTotal = 0;
		
		if (maxCount === 1) {
			let bestSticker = null;
			let bestDiff = Infinity;
			
			for (const sticker of allAvailableStickers) {
				if (sticker.value > maxAllowedValue) continue;
				
				const diff = Math.abs(sticker.value - totalValue);
				if (diff < bestDiff) {
					bestDiff = diff;
					bestSticker = sticker;
				}
			}
			
			if (bestSticker) {
				selectedStickers.push(bestSticker);
				currentTotal = bestSticker.value;
			}
		} else {
			const availableStickers = [...allAvailableStickers];
			
			for (let slot = 0; slot < maxCount; slot++) {
				const remainingSlots = maxCount - slot;
				const remainingBudget = maxAllowedValue - currentTotal;
				const targetForThisSlot = remainingBudget / remainingSlots;
				
				let bestSticker = null;
				let bestDiff = Infinity;
				
				for (const sticker of availableStickers) {
					if (currentTotal + sticker.value > maxAllowedValue) continue;
					
					const diff = Math.abs(sticker.value - targetForThisSlot);
					if (diff < bestDiff) {
						bestDiff = diff;
						bestSticker = sticker;
					}
				}
				
				if (bestSticker) {
					selectedStickers.push(bestSticker);
					currentTotal += bestSticker.value;
				} else {
					break;
				}
			}
			
			if (currentTotal < totalValue * 0.8 && selectedStickers.length > 0) {
				
				const sortedSelected = [...selectedStickers].sort((a, b) => a.value - b.value);
				
				for (const cheapSticker of sortedSelected) {
					const budgetWithoutCheap = currentTotal - cheapSticker.value;
					const neededImprovement = totalValue - budgetWithoutCheap;
					
					if (neededImprovement <= 0) continue;
					
					let replacement = null;
					for (const sticker of availableStickers) {
						if (sticker.value > cheapSticker.value && 
							budgetWithoutCheap + sticker.value <= maxAllowedValue &&
							sticker.value >= neededImprovement * 0.7) {
							replacement = sticker;
							break;
						}
					}
					
					if (replacement) {
						const cheapIndex = selectedStickers.findIndex(s => s === cheapSticker);
						if (cheapIndex !== -1) {
							selectedStickers[cheapIndex] = replacement;
							currentTotal = budgetWithoutCheap + replacement.value;
							break;
						}
					}
				}
			}
			
			if (selectedStickers.length < maxCount && currentTotal < totalValue * 0.9) {
				const remainingSlots = maxCount - selectedStickers.length;
				
				for (let i = 0; i < remainingSlots; i++) {
					let additionalSticker = null;
					for (const sticker of availableStickers) {
						if (currentTotal + sticker.value <= maxAllowedValue) {
							additionalSticker = sticker;
							break;
						}
					}
					
					if (additionalSticker) {
						selectedStickers.push(additionalSticker);
						currentTotal += additionalSticker.value;
					} else {
						break;
					}
				}
			}
			
			if (currentTotal < totalValue * 0.7 && mostExpensiveSticker) {
				
				selectedStickers.length = 0;
				currentTotal = 0;
				
				for (let i = 0; i < maxCount; i++) {
					if (currentTotal + mostExpensiveSticker.value <= maxAllowedValue) {
						selectedStickers.push(mostExpensiveSticker);
						currentTotal += mostExpensiveSticker.value;
					} else {
						break;
					}
				}
				
			}
		}

		const percentageDiff = ((currentTotal - totalValue) / totalValue * 100).toFixed(1);

		return selectedStickers;
	}

	function openBattlePassMenu() {
		const modal = document.createElement('div');
		modal.className = 'battle-pass-modal';
		modal.style.display = 'flex';
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100%';
		modal.style.height = '100%';
		modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
		modal.style.zIndex = '2001';
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';
		modal.style.flexDirection = 'column';

		const passState = userBattlePasses[selectedBattlePassId] || {
			level: 1,
			stars: 0,
			goldPass: false,
			locked: false,
			cooldown: 0
		};

		const isLocked = passState.locked;
		const isCooldown = passState.cooldown > Date.now();

		modal.innerHTML = `
			<div class="battle-pass-content" style="background-color: rgb(30 30 30 / 85%); padding: 20px; border-radius: 8px; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto; position: relative;">
				<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
					<h2 style="margin: 0;">Battle Pass</h2>
					<button class="close-battle-pass-btn" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
				</div>
				
				${isCooldown ? `
					<div class="cooldown-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; flex-direction: column; z-index: 10;">
						<div style="font-size: 24px; margin-bottom: 20px;">Батл пасс завершён</div>
						<button class="cancel-cooldown-btn" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Хорошо</button>
					</div>
				` : ''}
				
				<div class="pass-selector" style="display: flex; justify-content: center; align-items: center; margin-bottom: 20px;">
					<button class="prev-pass-btn" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; margin-right: 15px;">←</button>
					
					<div class="current-pass-name" style="font-size: 18px; font-weight: bold;">${currentBattlePass.name}</div>
					
					<button class="next-pass-btn" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; margin-left: 15px;">→</button>
				</div>
				
				<div class="pass-info">
					<div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
						<div>Уровень: ${passState.level}</div>
						<div>${passState.stars}/${currentBattlePass.stars_for_up} очков</div>
					</div>
					
					<div class="progress-bar" style="height: 20px; background-color: #333; border-radius: 10px; margin-bottom: 15px; overflow: hidden;">
						<div class="progress-fill" style="height: 100%; background-color: #4CAF50; width: ${Math.min(100, (passState.stars / currentBattlePass.stars_for_up) * 100)}%;"></div>
					</div>
					
					<div style="margin-bottom: 20px;">
						<div style="font-weight: bold; margin-bottom: 10px;"><img src="images/pass/free.png" width="50"></div>
						<div class="free-pass-levels" style="display: flex; overflow-x: auto; padding-bottom: 10px; margin-bottom: 20px;"></div>
						
						<div style="font-weight: bold; margin-bottom: 10px; display: flex; align-items: center;">
							<span><img src="images/pass/gold.png" width="50"></span>
							${passState.goldPass ? '<span style="margin-left: 10px; color: gold;">(Активен)</span>' : ''}
						</div>
						<div class="gold-pass-levels" style="display: flex; overflow-x: auto; padding-bottom: 10px;"></div>
					</div>
				</div>
				
				<div class="pass-actions" style="display: flex; justify-content: space-between;">
					<button class="buy-bp-btn" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; ${passState.goldPass || isLocked ? 'display: none;' : ''}">Купить БП</button>
					<button class="buy-levels-btn" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; ${isLocked ? 'display: none;' : ''}">Купить уровни</button>
					
					<button class="complete-pass-btn" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; ${isLocked ? 'display: none;' : ''}">Завершить</button>
				</div>
			</div>
		`;

		// <button class="confirm-pass-btn" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; ${selectedBattlePassId === passState.id || isLocked ? 'display: none;' : ''}">Подтвердить</button>
		
		document.body.appendChild(modal);
		
		fillPassLevels(modal, currentBattlePass, passState);

		modal.querySelector('.close-battle-pass-btn').addEventListener('click', () => {
			modal.remove();
		});

		modal.querySelector('.prev-pass-btn').addEventListener('click', () => {
			const passIds = Object.keys(battlePassesDatabase);
			const currentIndex = passIds.indexOf(selectedBattlePassId);
			const prevIndex = (currentIndex - 1 + passIds.length) % passIds.length;
			selectedBattlePassId = passIds[prevIndex];
			currentBattlePass = battlePassesDatabase[selectedBattlePassId];
			modal.remove();
			openBattlePassMenu();
		});

		modal.querySelector('.next-pass-btn').addEventListener('click', () => {
			const passIds = Object.keys(battlePassesDatabase);
			const currentIndex = passIds.indexOf(selectedBattlePassId);
			const nextIndex = (currentIndex + 1) % passIds.length;
			selectedBattlePassId = passIds[nextIndex];
			currentBattlePass = battlePassesDatabase[selectedBattlePassId];
			modal.remove();
			openBattlePassMenu();
		});

		modal.querySelector('.confirm-pass-btn')?.addEventListener('click', () => {
			if (!userBattlePasses[selectedBattlePassId].locked) {
				currentBattlePass = battlePassesDatabase[selectedBattlePassId];
				saveBattlePasses();
				showToast(`Батл пасс "${currentBattlePass.name}" выбран`);
				modal.remove();
			}
		});

		modal.querySelector('.complete-pass-btn')?.addEventListener('click', () => {
			const passState = userBattlePasses[selectedBattlePassId];
			passState.locked = true;
			passState.cooldown = Date.now() + 5 * 60 * 1000; // 5 минут
			
			passState.level = 1;
			passState.goldPass = false;
			
			saveBattlePasses();
			showToast(`Батл пасс "${currentBattlePass.name}" завершен.`);
			
			if (battlePassCooldown) clearInterval(battlePassCooldown);
			battlePassCooldown = setInterval(() => {
				const remaining = passState.cooldown - Date.now();
				if (remaining <= 0) {
					passState.locked = false;
					passState.cooldown = 0;
					saveBattlePasses();
					clearInterval(battlePassCooldown);
					modal.remove();
				}
			}, 1000);
			
			modal.remove();
			while (passState.stars >= currentBattlePass.stars_for_up && passState.level < currentBattlePass.gold_pass.length) {
				passState.stars -= currentBattlePass.stars_for_up;
				passState.level++;
				
				const freeReward = currentBattlePass.free_pass[passState.level - 1];
				giveReward(freeReward);
				
				if (passState.goldPass) {
					const goldReward = currentBattlePass.gold_pass[passState.level - 1];
					giveReward(goldReward);
				}
			}
			openBattlePassMenu();
		});

		modal.querySelector('.cancel-cooldown-btn')?.addEventListener('click', () => {
			const passState = userBattlePasses[selectedBattlePassId];
			passState.locked = false;
			passState.cooldown = 0;
			saveBattlePasses();
			modal.remove();
			openBattlePassMenu();
		});

		modal.querySelector('.buy-bp-btn')?.addEventListener('click', () => {
			openBuyBattlePassModal(currentBattlePass, modal);
		});

		modal.querySelector('.buy-levels-btn')?.addEventListener('click', () => {
			openBuyLevelsModal(currentBattlePass, modal);
		});
	}

	function fillPassLevels(modal, battlePass, passState) {
		const freePassContainer = modal.querySelector('.free-pass-levels');
		const goldPassContainer = modal.querySelector('.gold-pass-levels');
		
		freePassContainer.innerHTML = '';
		goldPassContainer.innerHTML = '';
		
		const maxLevel = battlePass.gold_pass.length;
		
		for (let level = 1; level <= maxLevel; level++) {
			const freeLevel = document.createElement('div');
			freeLevel.className = 'pass-level';
			freeLevel.style.minWidth = '80px';
			freeLevel.style.marginRight = '10px';
			freeLevel.style.padding = '10px';
			freeLevel.style.border = '1px solid #555';
			freeLevel.style.borderRadius = '4px';
			freeLevel.style.textAlign = 'center';
			freeLevel.style.position = 'relative';
			
			if (level <= passState.level) {
				freeLevel.style.backgroundColor = '#6f6f6f';
			}
			
			freeLevel.innerHTML = `
				<div style="font-weight: bold; margin-bottom: 5px;">${level}</div>
				${renderReward(battlePass.free_pass[level - 1])}
			`;
			
			freePassContainer.appendChild(freeLevel);
			
			const goldLevel = document.createElement('div');
			goldLevel.className = 'pass-level';
			goldLevel.style.minWidth = '80px';
			goldLevel.style.marginRight = '10px';
			goldLevel.style.padding = '10px';
			goldLevel.style.border = passState.goldPass ? '1px solid gold' : '1px solid #555';
			goldLevel.style.borderRadius = '4px';
			goldLevel.style.textAlign = 'center';
			goldLevel.style.position = 'relative';
			
			if (level <= passState.level && passState.goldPass) {
				goldLevel.style.backgroundColor = '#816d02';
			} else if (!passState.goldPass) {
				goldLevel.style.opacity = '0.5';
			}
			
			goldLevel.innerHTML = `
				<div style="font-weight: bold; margin-bottom: 5px;">${level}</div>
				${renderReward(battlePass.gold_pass[level - 1])}
			`;
			
			goldPassContainer.appendChild(goldLevel);
		}
	}

	function renderReward(reward) {
		if (reward === false) {
			return '<div style="color: #ffffff;">Нет награды</div>';
		} else if (typeof reward === 'number') {
			return `<div style="color: gold;">+${reward} ₽</div>`;
		} else if (typeof reward === 'string') {
			const item = itemsDatabase.find(i => i.id === reward);
			if (item) {
				return `
					<div style="margin-bottom: 5px;">
						<img src="${item.image}" width="40">
					</div>
					<div style="font-size: 12px;">${item.name}</div>
				`;
			}
		}
		return '<div style="color: #ffffff;">Неизвестно</div>';
	}

	function openBuyBattlePassModal(battlePass, parentModal) {
		const modal = document.createElement('div');
		modal.className = 'buy-bp-modal';
		modal.style.display = 'flex';
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100%';
		modal.style.height = '100%';
		modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
		modal.style.zIndex = '2002';
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';
		
		const passState = userBattlePasses[battlePass.id];
		
		modal.innerHTML = `
			<div class="buy-bp-content" style="background-color: rgb(30 30 30 / 85%); padding: 20px; border-radius: 8px; width: 400px; max-width: 90%;">
				<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
					<h3 style="margin: 0;">Купить Gold Pass</h3>
					<button class="close-buy-bp-btn" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
				</div>
				
				<div style="margin-bottom: 20px;">
					<div style="font-size: 18px; margin-bottom: 10px;">${battlePass.name}</div>
					<div style="font-size: 24px; color: gold; margin-bottom: 20px;">${battlePass.cost_gold_pass?.toFixed(2)} ₽</div>
					
					<div style="margin-bottom: 15px;">
						<div style="font-weight: bold; margin-bottom: 5px;">Включает:</div>
						<ul style="margin: 0; padding-left: 20px;">
							<li>Доступ ко всем наградам Gold Pass</li>
							<li>Все уже заработанные награды будут выданы</li>
						</ul>
					</div>
				</div>
				
				<button class="confirm-buy-bp-btn" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">Купить</button>
			</div>
		`;
		
		document.body.appendChild(modal);
		
		modal.querySelector('.close-buy-bp-btn').addEventListener('click', () => {
			modal.remove();
		});
		
		modal.querySelector('.confirm-buy-bp-btn').addEventListener('click', () => {
			if (balance >= battlePass.cost_gold_pass & battlePass.cost_gold_pass != null) {
				balance = Math.round((balance - battlePass.cost_gold_pass) * 100) / 100;
				addExp(Math.round(battlePass.cost_gold_pass));
				balanceAmount.textContent = balance.toLocaleString('ru-RU');
				UpdateStatrackFrame(balance);
				updateDuelRang(Math.round(battlePass.cost_gold_pass));
				
				passState.goldPass = true;
				
				for (let level = 1; level <= passState.level; level++) {
					const reward = battlePass.gold_pass[level - 1];
					giveReward(reward);
				}
				
				saveBattlePasses();
				saveGameState();
				showToast(`Gold Pass для "${battlePass.name}" куплен!`);
				
				modal.remove();
				parentModal.remove();
				openBattlePassMenu();
			} else {
				if (battlePass.cost_gold_pass == null) {
					showToast('Этот пропуск невозможно купить!', true);
				} else {
					showToast('Недостаточно средств!', true);
				}
			}
		});
	}

	function openBuyLevelsModal(battlePass, parentModal) {
		const modal = document.createElement('div');
		modal.className = 'buy-levels-modal';
		modal.style.display = 'flex';
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100%';
		modal.style.height = '100%';
		modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
		modal.style.zIndex = '2002';
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';
		
		const passState = userBattlePasses[battlePass.id];
		const maxLevel = battlePass.gold_pass.length;
		
		function getLevelsText(levels) {
			if (levels % 10 === 1 && levels % 100 !== 11) {
				return levels + ' уровень';
			} else if ([2, 3, 4].includes(levels % 10) && ![12, 13, 14].includes(levels % 100)) {
				return levels + ' уровня';
			} else {
				return levels + ' уровней';
			}
		}
		
		modal.innerHTML = `
			<div class="buy-levels-content" style="background-color: rgb(30 30 30 / 85%); padding: 20px; border-radius: 8px; width: 400px; max-width: 90%;">
				<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
					<h3 style="margin: 0;">Купить уровни</h3>
					<button class="close-buy-levels-btn" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
				</div>
				
				<div style="margin-bottom: 20px;">
					<div style="font-size: 18px; margin-bottom: 10px;">${battlePass.name}</div>
					<div style="margin-bottom: 15px;">Текущий уровень: ${passState.level}/${maxLevel}</div>
					
					<div class="level-options" style="margin-bottom: 20px;">
						${Object.entries(battlePass.levels_costs).map(([levels, cost]) => `
							<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 10px; background-color: #2a2a2a; border-radius: 4px;">
								<div>+${getLevelsText(parseInt(levels))}</div>
								<div style="color: gold;">${cost.toFixed(2)} ₽</div>
								<button class="buy-levels-option-btn" data-levels="${levels}" style="padding: 5px 10px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Купить</button>
							</div>
						`).join('')}
					</div>
				</div>
			</div>
		`;
		
		document.body.appendChild(modal);
		
		modal.querySelector('.close-buy-levels-btn').addEventListener('click', () => {
			modal.remove();
		});
		
		modal.querySelectorAll('.buy-levels-option-btn').forEach(btn => {
			btn.addEventListener('click', function() {
				const levels = parseInt(this.getAttribute('data-levels'));
				const cost = battlePass.levels_costs[levels];

				if (balance >= cost) {
					balance = Math.round((balance - cost) * 100) / 100;
					addExp(Math.round(cost));
					balanceAmount.textContent = balance.toLocaleString('ru-RU');
					UpdateStatrackFrame(balance);
					updateDuelRang(Math.round(cost));

					const maxLevel = battlePass.gold_pass.length;
					const newLevel = Math.min(passState.level + levels, maxLevel);
					const levelsGained = newLevel - passState.level;

					if (passState.level + levels > maxLevel) {
						const extraLevels = (passState.level + levels) - maxLevel;
						passState.stars += extraLevels * battlePass.stars_for_up;
					}

					if (passState.goldPass) {
						for (let level = passState.level + 1; level <= newLevel; level++) {
							const reward = battlePass.gold_pass[level - 1];
							giveReward(reward);
						}
					}

					for (let level = passState.level + 1; level <= newLevel; level++) {
						const reward = battlePass.free_pass[level - 1];
						giveReward(reward);
					}

					passState.level = newLevel;

					saveBattlePasses();
					saveGameState();
					showToast(`Куплено ${getLevelsText(levelsGained)}!`);

					modal.remove();
					parentModal.remove();
					openBattlePassMenu();
				} else {
					showToast('Недостаточно средств!', true);
				}
			});
		});
	}

	function giveReward(reward) {
		if (reward === false) return;
		
		if (typeof reward === 'number') {
			balance = Math.round((balance + reward) * 100) / 100;
			addExp(Math.round(reward));
			balanceAmount.textContent = balance.toLocaleString('ru-RU');
			UpdateStatrackFrame(balance);
			showToast(`Получено ${reward} ₽`);
		} else if (typeof reward === 'string') {
			const item = itemsDatabase.find(i => i.id === reward);
			if (item) {
				inventory.push({
					id: item.id,
					name: item.name,
					rarity: item.rarity,
					image: item.image
				});
				showToast(`Получен предмет: ${item.name}`);
				updateInventory();
			}
		}
	}

	function addNewBattlePass(id, name, stars_for_up, free_pass, gold_pass, cost_gold_pass, levels_costs, stars_for_craft_rarites) {
		if (battlePassesDatabase[id]) {
			showToast('Батл пасс с таким ID уже существует!', true);
			return false;
		}
		
		battlePassesDatabase[id] = {
			id,
			name,
			stars_for_up,
			free_pass,
			gold_pass,
			cost_gold_pass,
			levels_costs,
			stars_for_craft_rarites
		};
		
		if (!userBattlePasses[id]) {
			userBattlePasses[id] = {
				level: 1,
				stars: 0,
				goldPass: false,
				locked: false,
				cooldown: 0
			};
		}
		
		saveBattlePasses();
		return true;
	}

	function addBattlePassStarsForCraft(rarity) {
		if (!currentBattlePass) return;
		
		const passState = userBattlePasses[currentBattlePass.id];
		if (passState.locked) return;
		
		const starsToAdd = currentBattlePass.stars_for_craft_rarites[rarity] || 0;
		if (starsToAdd <= 0) return;
		
		passState.stars += starsToAdd;
		
		while (passState.stars >= currentBattlePass.stars_for_up && passState.level < currentBattlePass.gold_pass.length) {
			passState.stars -= currentBattlePass.stars_for_up;
			passState.level++;
			
			const freeReward = currentBattlePass.free_pass[passState.level - 1];
			giveReward(freeReward);
			
			if (passState.goldPass) {
				const goldReward = currentBattlePass.gold_pass[passState.level - 1];
				giveReward(goldReward);
			}
		}
		
		saveBattlePasses();
		saveGameState();
	}
	
	filterButtons.forEach(btn => {
		btn.addEventListener('click', function() {
			const rarity = this.getAttribute('data-rarity');
			const collectionFilter = document.getElementById('collection-filter');
			const selectedCollection = collectionFilter.value;
			
			filterButtons.forEach(b => b.classList.remove('active'));
			this.classList.add('active');
			
			document.querySelectorAll('.item-card').forEach(card => {
				const cardRarity = card.getAttribute('data-rarity');
				const cardCollection = card.querySelector('.item-collection').dataset.collection;
				
				const rarityMatch = rarity === 'all' || cardRarity === rarity;
				const collectionMatch = selectedCollection === 'all' || cardCollection === selectedCollection;
				
				card.style.display = rarityMatch && collectionMatch ? 'block' : 'none';
			});
			initShop();
		});
	});
	
	function randomn(items) {		
		const randomIndex = Math.floor(Math.random() * items.length);
		return items[randomIndex];
	}
	
	// Инициализация ботов с лотами согласно stock
	function initializeBotsWithLots() {
		const botNames = ['Bot_Alpha', 'Bot_Beta', 'Bot_Gamma', 'Bot_Delta', 'Bot_Epsilon', 'Bot_Zeta', 'Bot_Eta', 'Bot_Theta'];
		let botIndex = 0;
		
		itemsDatabase.forEach(item => {
			if (!item.itemInStore || item.isRental) return;
			
			const stock = item.stock || 0;
			if (stock <= 0) return;
			
			// Создаем бот-лоты для каждого предмета согласно stock
			for (let i = 0; i < stock; i++) {
				const botName = botNames[botIndex % botNames.length];
				botIndex++;
				
				// Базовая цена с небольшим разбросом
				const basePrice = item.price;
				const priceVariation = (Math.random() * 0.2 - 0.1) * basePrice; // ±10%
				const botPrice = Math.round((basePrice + priceVariation) * 100) / 100;
				
				const botListing = {
					id: Date.now() + Math.random(),
					itemId: item.id,
					sellerName: botName,
					sellerBot: true,
					price: botPrice,
					stickers: [],
					createdAt: Date.now()
				};
				
				marketListings.push(botListing);
				
				// Добавляем бота в список если его еще нет
				if (!bots.find(b => b.name === botName)) {
					bots.push({
						name: botName,
						listings: [],
						strategy: 'normal'
					});
				}
			}
		});
	}
	
	loadItemsData().then(() => {
		addAllItems(addNewCollection, addNewItem, addNewPromocode, addNewRarity, itemsDatabase, addNewBattlePass, addNewPromoItem);
		addFrames(addNewFrame);
		addRanks(addNewRang);
		initializeBotsWithLots();
		initShop();
		loadSavedGameState();
	});
	
	const candidates = itemsDatabase.filter(i => i.rarity === 'box-none');
	if (candidates.length > 0) {
	  const randomItem = candidates[Math.floor(Math.random() * candidates.length)];
	  inventory.push({
		id: randomItem.id,
		name: randomItem.name,
		rarity: randomItem.rarity,
		image: randomItem.image
	  });
	}
	
	addNewPromocode('admin', 0, [], true, 0); // 0 В КОНЦЕ - промокод без ограничений
	
	addNewPromocode('STARTER', 300, () => {
		const allItems = itemsDatabase.filter(item => !item.isRental).map(item => item.id);
		const result = [];
		for (let i = 0; i < 3; i++) {
			result.push(allItems[Math.floor(Math.random() * allItems.length)]);
		}
		return result;
	}, false, 1);
	
	addNewPromocode('lucky', 0, null, false, 0, null, null, 'toggle_upgrade');
	
	initShop();
	
	let rentalTimeoutId = null;

	function removeExpiredItem(itemToRemove) {
		const index = inventory.findIndex(i => i === itemToRemove);
		if (index !== -1) {
			inventory.splice(index, 1);
			updateInventory();
			saveGameState();
		}
	}

	function processExpiredRentals() {
		const now = Date.now();
		let needSave = false;
		const initialLength = inventory.length;
		
		inventory = inventory.filter(item => {
			if (item.isRental && item.rentalExpires && item.rentalExpires <= now) {
				needSave = true;
				return false;
			}
			return true;
		});

		if (inventory.length < initialLength) {
			updateInventory();
			if (needSave) saveGameState();
		}
	}

	function scheduleNextRentalCheck() {
		if (rentalTimeoutId) {
			clearTimeout(rentalTimeoutId);
			rentalTimeoutId = null;
		}

		const now = Date.now();
		let nextExpirationTime = Infinity;
		let hasRentalItems = false;

		for (const item of inventory) {
			if (item.isRental && item.rentalExpires) {
				hasRentalItems = true;
				
				if (item.rentalExpires <= now) {
					removeExpiredItem(item);
					continue;
				}

				if (item.rentalExpires < nextExpirationTime) {
					nextExpirationTime = item.rentalExpires;
				}
			}
		}

		if (hasRentalItems && nextExpirationTime !== Infinity) {
			const timeUntilExpiration = nextExpirationTime - now;
			const safeDelay = Math.max(0, timeUntilExpiration);

			rentalTimeoutId = setTimeout(() => {
				mergeRentalStacks();
				processExpiredRentals();
				scheduleNextRentalCheck();
			}, safeDelay);
		}
	}

	function initRentalSystem() {
		scheduleNextRentalCheck();
	}

	function checkRentalItems() {
		const now = Date.now();
		let needUpdate = false;
		
		inventory.forEach(item => {
			if (item.isRental && item.rentalExpires && item.rentalExpires <= now) {
				item.expired = true;
				needUpdate = true;
				if (item.name && item.name.startsWith('Medal')) {
					if (item.slot !== undefined && item.slot !== null) {
						unequipMedal(item.slot);
						item.slot = null;
					}
				}
			}
		});
		
		if (needUpdate) {
			inventory = inventory.filter(item => !item.expired);
			updateInventory();
		}
	}

	checkRentalItems();
	initRentalSystem();
	
	initBattlePasses();
	startClanBalanceGrowth();
	
	localStorage.setItem('background_image', defoltMenuLogo);
	applyBackground(defoltMenuLogo);
    
    setTimeout(addResetButtonToInventory, 1000); // Ждем немного пока загрузится интерфейс
	setTimeout(addUpgradeButtonToInventory, 1000);
	
	let elementEditorActive = false;
	let elementEditor = null;
	let selectedElement = null;

	function createElementEditor() {
		elementEditor = document.createElement('div');
		elementEditor.id = 'element-editor';
		elementEditor.innerHTML = `
			<div class="editor-header">
				<h3>Редактор элементов</h3>
				<button id="close-editor">×</button>
			</div>
			<div class="editor-content">
				<div class="editor-section">
					<label>Выберите элемент:</label>
					<button id="select-element-btn">Выбрать элемент на странице</button>
				</div>
				<div id="element-info" class="editor-section" style="display: none;">
					<div><strong>Тип:</strong> <span id="element-type"></span></div>
					<div><strong>ID:</strong> <span id="element-id"></span></div>
					<div><strong>Классы:</strong> <span id="element-classes"></span></div>
				</div>
				<div id="editor-fields" class="editor-fields" style="display: none;"></div>
			</div>
		`;

		document.body.appendChild(elementEditor);

		makeElementDraggable(elementEditor);

		document.getElementById('select-element-btn').addEventListener('click', startElementSelection);
		document.getElementById('close-editor').addEventListener('click', closeElementEditor);

		elementEditorActive = true;
	}

	function makeElementDraggable(element) {
		let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
		const header = element.querySelector('.editor-header');
		
		header.onmousedown = dragMouseDown;

		function dragMouseDown(e) {
			e.preventDefault();
			pos3 = e.clientX;
			pos4 = e.clientY;
			document.onmouseup = closeDragElement;
			document.onmousemove = elementDrag;
		}

		function elementDrag(e) {
			e.preventDefault();
			pos1 = pos3 - e.clientX;
			pos2 = pos4 - e.clientY;
			pos3 = e.clientX;
			pos4 = e.clientY;
			element.style.top = (element.offsetTop - pos2) + "px";
			element.style.left = (element.offsetLeft - pos1) + "px";
		}

		function closeDragElement() {
			document.onmouseup = null;
			document.onmousemove = null;
		}
	}

	function startElementSelection() {
		document.body.style.cursor = 'crosshair';
		
		const tooltip = document.createElement('div');
		tooltip.style.cssText = `
			position: fixed;
			top: 10px;
			left: 50%;
			transform: translateX(-50%);
			background: rgba(0,0,0,0.9);
			color: gold;
			padding: 10px 20px;
			border-radius: 5px;
			z-index: 100002; /* Выше чем редактор */
			font-family: 'Gold Shreaft', sans-serif;
			border: 2px solid gold;
			font-size: 14px;
			pointer-events: none;
		`;
		tooltip.textContent = 'Выберите элемент на странице (Esc для отмены)';
		tooltip.id = 'selection-tooltip';
		document.body.appendChild(tooltip);

		let currentlyHighlighted = null;

		const highlightElement = (element) => {
			if (element.closest('#element-editor') || element.id === 'selection-tooltip') {
				return;
			}
			
			if (currentlyHighlighted && currentlyHighlighted !== element) {
				unhighlightElement(currentlyHighlighted);
			}
			
			if (!element._originalOutline) {
				element._originalOutline = element.style.outline;
				element._originalBackground = element.style.backgroundColor;
				element._originalZIndex = element.style.zIndex;
				element._originalPosition = element.style.position;
				element._originalCursor = element.style.cursor;
			}
			
			element.style.outline = '3px solid #00ff00';
			element.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
			element.style.zIndex = '99998'; // Высокий z-index для подсвеченных элементов
			element.style.cursor = 'pointer';
			if (getComputedStyle(element).position === 'static') {
				element.style.position = 'relative';
			}
			
			currentlyHighlighted = element;
		};
		
		const unhighlightElement = (element) => {
			if (element._originalOutline !== undefined) {
				element.style.outline = element._originalOutline;
				element.style.backgroundColor = element._originalBackground;
				element.style.zIndex = element._originalZIndex;
				element.style.position = element._originalPosition;
				element.style.cursor = element._originalCursor;
				delete element._originalOutline;
				delete element._originalBackground;
				delete element._originalZIndex;
				delete element._originalPosition;
				delete element._originalCursor;
			}
		};
		
		handleMouseOver = (e) => {
			highlightElement(e.target);
		};
		
		handleClick = (e) => {
			e.preventDefault();
			e.stopPropagation();
			
			if (e.target.closest('#element-editor') || e.target.id === 'selection-tooltip') {
				return;
			}
			
			selectedElement = e.target;
			
			tooltip.remove();
			document.body.style.cursor = '';
			
			if (currentlyHighlighted) {
				unhighlightElement(currentlyHighlighted);
				currentlyHighlighted = null;
			}
			
			showElementInfo(selectedElement);
			
			cleanupSelectionHandlers();
		};
		
		handleCancel = (e) => {
			if (e.key === 'Escape') {
				tooltip.remove();
				document.body.style.cursor = '';
				
				if (currentlyHighlighted) {
					unhighlightElement(currentlyHighlighted);
					currentlyHighlighted = null;
				}
				
				cleanupSelectionHandlers();
			}
		};
		
		document.addEventListener('mouseover', handleMouseOver);
		document.addEventListener('click', handleClick);
		document.addEventListener('keydown', handleCancel);
	}

	function cleanupSelectionHandlers() {
		document.removeEventListener('mouseover', handleMouseOver);
		document.removeEventListener('click', handleClick);
		document.removeEventListener('keydown', handleCancel);
	}

	function showElementInfo(element) {
		const elementType = element.tagName.toLowerCase();
		const elementId = element.id || 'нет';
		const elementClasses = element.className || 'нет';
		
		document.getElementById('element-type').textContent = elementType;
		document.getElementById('element-id').textContent = elementId;
		document.getElementById('element-classes').textContent = elementClasses;
		document.getElementById('element-info').style.display = 'block';
		
		createEditorFields(element);
	}
	
	function openItemSelectionModal(currentItem, inventoryItemIndex, inventoryItemElement) {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.8);
			z-index: 100001;
			display: flex;
			justify-content: center;
			align-items: center;
		`;

		modal.innerHTML = `
			<div class="modal-content" style="
				background: rgba(30, 30, 30, 0.95);
				border: 2px solid gold;
				border-radius: 8px;
				width: 90%;
				max-width: 800px;
				max-height: 80vh;
				overflow: hidden;
				display: flex;
				flex-direction: column;
			">
				<div class="modal-header" style="
					padding: 15px;
					background: rgba(0,0,0,0.5);
					border-bottom: 1px solid #555;
					display: flex;
					justify-content: space-between;
					align-items: center;
				">
					<h3 style="margin: 0; color: gold;">Выберите предмет для замены</h3>
					<button id="close-item-selector" style="
						background: #ff4444;
						color: white;
						border: none;
						border-radius: 4px;
						width: 30px;
						height: 30px;
						cursor: pointer;
						font-size: 18px;
					">×</button>
				</div>
				<div style="padding: 15px; display: flex; gap: 15px; margin-bottom: 15px;">
					<input type="text" id="item-search" placeholder="Поиск предмета..." style="
						flex: 1;
						padding: 10px;
						background: #2a2a2a;
						border: 1px solid #555;
						border-radius: 4px;
						color: white;
					">
					<select id="rarity-filter" style="
						padding: 10px;
						background: #2a2a2a;
						border: 1px solid #555;
						border-radius: 4px;
						color: white;
						min-width: 150px;
					">
						<option value="all">Все редкости</option>
						${Object.keys(rarities)
							.filter(r => !['box-none', 'case-none'].includes(r))
							.map(r => `<option value="${r}">${rarities[r].name}</option>`)
							.join('')}
					</select>
				</div>
				<div id="items-grid" style="
					flex: 1;
					overflow-y: auto;
					padding: 15px;
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
					gap: 10px;
				">
					<!-- Предметы будут загружены здесь -->
				</div>
				<div class="modal-footer" style="
					padding: 15px;
					background: rgba(0,0,0,0.5);
					border-top: 1px solid #555;
					text-align: center;
				">
					<button id="cancel-item-select" style="
						padding: 10px 20px;
						background: #f44336;
						color: white;
						border: none;
						border-radius: 4px;
						cursor: pointer;
						margin-right: 10px;
					">Отмена</button>
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		loadItemsIntoSelector(modal, currentItem, inventoryItemIndex, inventoryItemElement);

		document.getElementById('close-item-selector').addEventListener('click', () => modal.remove());
		document.getElementById('cancel-item-select').addEventListener('click', () => modal.remove());
		
		document.getElementById('item-search').addEventListener('input', (e) => {
			filterItemsInSelector(modal, e.target.value, document.getElementById('rarity-filter').value);
		});
		
		document.getElementById('rarity-filter').addEventListener('change', (e) => {
			filterItemsInSelector(modal, document.getElementById('item-search').value, e.target.value);
		});

		modal.addEventListener('click', (e) => {
			if (e.target === modal) {
				modal.remove();
			}
		});

		const closeOnEscape = (e) => {
			if (e.key === 'Escape') {
				modal.remove();
				document.removeEventListener('keydown', closeOnEscape);
			}
		};
		document.addEventListener('keydown', closeOnEscape);
	}
	
	function getRangProgressText(rangId, stars) {
		const rangData = rangsDatabase[rangId];
		if (!rangData) return `${stars} ММР`;
		
		if (rangData.stars_for_up === 0) {
			if (stars > 999 && stars <= 999000) {
				return `${Math.round(stars/1000*10)/10}K ММР`;
			}
			if (stars > 999000 && stars <= 999000000) {
				return `${Math.round(stars/1000000*10)/10}M ММР`;
			}
			if (stars > 999000000 && stars <= 999000000000) {
				return `${Math.round(stars/1000000000*10)/10}B ММР`;
			}
			if (stars > 999000000000) {
				return `infinity`;
			}
			else {
				return `${stars} ММР`;
			}
		}
		else {
			if (stars > 999 && stars <= 9999) {
				return `${stars} / ${rangData.stars_for_up} ММР`;
			}
			if (stars > 9999 && stars <= 999000) {
				return `${Math.round(stars/1000*10)/10}K / ${rangData.stars_for_up} ММР`;
			}
			if (stars > 999000 && stars <= 999000000) {
				return `${Math.round(stars/1000000*10)/10}M / ${rangData.stars_for_up} ММР`;
			}
			if (stars > 999000000 && stars <= 999000000000) {
				return `${Math.round(stars/1000000000*10)/10}B / ${rangData.stars_for_up} ММР`;
			}
			if (stars > 999000000000) {
				return `infinity / ${rangData.stars_for_up}`;
			}
			else {
				return `${stars} / ${rangData.stars_for_up} ММР`;
			}
		}
	}

	function updateProfileRangDisplay(rangContainer, rangType) {
		const currentRang = userRangs[rangType];
		const rangData = rangsDatabase[currentRang.current];
		
		if (!rangData) return;
		
		const rangImg = rangContainer.querySelector('img');
		if (rangImg) rangImg.src = rangData.rang_img;
		
		const rangName = rangContainer.querySelector('div:nth-child(3)');
		if (rangName) rangName.textContent = rangData.name;
		
		const rangProgress = rangContainer.querySelector('div:nth-child(4)');
		if (rangProgress) {
			rangProgress.textContent = getRangProgressText(currentRang.current, currentRang.stars);
		}
	}

	function addInfoField(container, label, value) {
		const div = document.createElement('div');
		div.className = 'editor-field info-field';
		div.style.cssText = `
			margin-bottom: 10px;
			padding: 8px;
			background: rgba(255,255,255,0.05);
			border-radius: 4px;
			border-left: 3px solid gold;
		`;
		div.innerHTML = `
			<div style="font-size: 11px; color: #aaa; margin-bottom: 3px;">${label}:</div>
			<div style="font-size: 12px; color: white; font-weight: bold;">${value}</div>
		`;
		container.appendChild(div);
	}
	
	function loadItemsIntoSelector(modal, currentItem, inventoryItemIndex, inventoryItemElement) {
		const itemsGrid = modal.querySelector('#items-grid');
		itemsGrid.innerHTML = '';

		const availableItems = itemsDatabase.filter(item => 
			!item.id.endsWith('_rental') && 
			!item.isRental && 
			item.itemInStore !== false
		);

		const sortedItems = availableItems.sort((a, b) => {
			const orderA = rarities[a.rarity]?.order || 0;
			const orderB = rarities[b.rarity]?.order || 0;
			return orderB - orderA;
		});

		sortedItems.forEach(item => {
			const itemElement = document.createElement('div');
			itemElement.className = 'selector-item';
			itemElement.style.cssText = `
				background: #2a2a2a;
				border: 2px solid ${rarities[item.rarity]?.colorHex || '#555'};
				border-radius: 8px;
				padding: 10px;
				text-align: center;
				cursor: pointer;
				transition: all 0.2s;
				min-height: 140px;
				display: flex;
				flex-direction: column;
				justify-content: space-between;
			`;
			
			const displayName = item.name;
			
			itemElement.innerHTML = `
				<div style="flex: 1; display: flex; align-items: center; justify-content: center;">
					<img src="${item.image}" alt="" style="max-width: 60px; max-height: 60px; object-fit: contain; border-radius: 4px;">
				</div>
				<div style="margin-top: 8px;">
					<div class="item-name" style="font-size: 11px; font-weight: bold; height: 32px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.2;">${displayName}</div>
					<div style="font-size: 10px; color: ${rarities[item.rarity]?.colorHex || '#aaa'}; margin-top: 4px;">${rarities[item.rarity]?.name || item.rarity}</div>
					<div style="font-size: 9px; color: gold; margin-top: 2px;">${item.price.toFixed(2)} ₽</div>
				</div>
			`;

			itemElement.addEventListener('click', () => {
				replaceInventoryItem(currentItem, inventoryItemIndex, inventoryItemElement, item);
				modal.remove();
			});

			itemElement.addEventListener('mouseenter', () => {
				itemElement.style.transform = 'scale(1.05)';
				itemElement.style.borderColor = 'gold';
			});

			itemElement.addEventListener('mouseleave', () => {
				itemElement.style.transform = 'scale(1)';
				itemElement.style.borderColor = rarities[item.rarity]?.colorHex || '#555';
			});

			itemsGrid.appendChild(itemElement);
		});
	}

	function filterItemsInSelector(modal, searchTerm, rarityFilter) {
		const itemsGrid = modal.querySelector('#items-grid');
		const items = itemsGrid.querySelectorAll('.selector-item');
		
		items.forEach(item => {
			const itemName = item.querySelector('.item-name').textContent.toLowerCase();
			const itemRarityElement = item.querySelector('div:nth-child(2)');
			const fullText = itemRarityElement ? itemRarityElement.textContent : '';
			const lines = fullText.split('\n').map(line => line.trim()).filter(line => line);
			const itemRarity = lines.length >= 2 ? lines[1].toLowerCase().trim() : '';
			
			const matchesSearch = !searchTerm || itemName.includes(searchTerm.toLowerCase());
			const matchesRarity = rarityFilter === 'all' || 
								itemRarity.toLowerCase() === rarityFilter.toLowerCase() ||
								(rarities[rarityFilter] && itemRarity.toLowerCase() === rarities[rarityFilter].name.toLowerCase());
			
			item.style.display = matchesSearch && matchesRarity ? 'flex' : 'none';
		});
	}

	function replaceInventoryItem(currentItem, inventoryItemIndex, inventoryItemElement, newItemData) {
		const oldStickers = currentItem.stickers ? [...currentItem.stickers] : null;
		const oldCharm = currentItem.charm ? {...currentItem.charm} : null;
		
		currentItem.id = newItemData.id;
		currentItem.name = newItemData.name;
		currentItem.rarity = newItemData.rarity;
		currentItem.image = newItemData.image;
		
		if (!newItemData.isItemWithoutSlot && !newItemData.isCase && 
			!newItemData.isSticker && !newItemData.isCharm) {
			if (oldStickers) currentItem.stickers = oldStickers;
			if (oldCharm) currentItem.charm = oldCharm;
		} else {
			if (oldStickers) {
				oldStickers.forEach(sticker => {
					inventory.push({
						id: sticker.id,
						name: sticker.name,
						rarity: itemsDatabase.find(i => i.id === sticker.id)?.rarity || 'none',
						image: sticker.image
					});
				});
				delete currentItem.stickers;
			}
			if (oldCharm) {
				inventory.push({
					id: oldCharm.id,
					name: oldCharm.name,
					rarity: itemsDatabase.find(i => i.id === oldCharm.id)?.rarity || 'none',
					image: oldCharm.image
				});
				delete currentItem.charm;
			}
		}
		
		updateInventory();
		showToast(`Предмет заменен на: ${newItemData.name}`);
		
		if (elementEditor) {
			const fieldsContainer = document.getElementById('editor-fields');
			if (fieldsContainer) {
				createEditorFields(inventoryItemElement);
			}
		}
	}
	
	function openCharmSelectionModal(currentItem, inventoryItemIndex, inventoryItemElement) {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.8);
			z-index: 100001;
			display: flex;
			justify-content: center;
			align-items: center;
		`;

		modal.innerHTML = `
			<div class="modal-content" style="
				background: rgba(30, 30, 30, 0.95);
				border: 2px solid gold;
				border-radius: 8px;
				width: 90%;
				max-width: 800px;
				max-height: 80vh;
				overflow: hidden;
				display: flex;
				flex-direction: column;
			">
				<div class="modal-header" style="
					padding: 15px;
					background: rgba(0,0,0,0.5);
					border-bottom: 1px solid #555;
					display: flex;
					justify-content: space-between;
					align-items: center;
				">
					<h3 style="margin: 0; color: gold;">Выберите брелок</h3>
					<button id="close-charm-selector" style="
						background: #ff4444;
						color: white;
						border: none;
						border-radius: 4px;
						width: 30px;
						height: 30px;
						cursor: pointer;
						font-size: 18px;
					">×</button>
				</div>
				<div style="padding: 15px; display: flex; gap: 15px; margin-bottom: 15px;">
					<input type="text" id="charm-search" placeholder="Поиск брелка..." style="
						flex: 1;
						padding: 10px;
						background: #2a2a2a;
						border: 1px solid #555;
						border-radius: 4px;
						color: white;
					">
					<select id="charm-rarity-filter" style="
						padding: 10px;
						background: #2a2a2a;
						border: 1px solid #555;
						border-radius: 4px;
						color: white;
						min-width: 150px;
					">
						<option value="all">Все редкости</option>
						${Object.keys(rarities)
							.filter(r => !['box-none', 'case-none'].includes(r))
							.map(r => `<option value="${r}">${rarities[r].name}</option>`)
							.join('')}
					</select>
					<button id="remove-charm-btn" style="
						padding: 10px 15px;
						background: #ff4444;
						color: white;
						border: none;
						border-radius: 4px;
						cursor: pointer;
						white-space: nowrap;
					">Удалить брелок</button>
				</div>
				<div id="charms-grid" style="
					flex: 1;
					overflow-y: auto;
					padding: 15px;
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
					gap: 10px;
				">
					<!-- Брелки будут загружены здесь -->
				</div>
				<div class="modal-footer" style="
					padding: 15px;
					background: rgba(0,0,0,0.5);
					border-top: 1px solid #555;
					text-align: center;
				">
					<button id="cancel-charm-select" style="
						padding: 10px 20px;
						background: #f44336;
						color: white;
						border: none;
						border-radius: 4px;
						cursor: pointer;
						margin-right: 10px;
					">Отмена</button>
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		loadCharmsIntoSelector(modal, currentItem, inventoryItemIndex, inventoryItemElement);

		document.getElementById('close-charm-selector').addEventListener('click', () => modal.remove());
		document.getElementById('cancel-charm-select').addEventListener('click', () => modal.remove());
		document.getElementById('remove-charm-btn').addEventListener('click', () => {
			removeCharmFromItem(currentItem, inventoryItemIndex, inventoryItemElement);
			modal.remove();
		});
		
		document.getElementById('charm-search').addEventListener('input', (e) => {
			filterCharmsInSelector(modal, e.target.value, document.getElementById('charm-rarity-filter').value);
		});
		
		document.getElementById('charm-rarity-filter').addEventListener('change', (e) => {
			filterCharmsInSelector(modal, document.getElementById('charm-search').value, e.target.value);
		});

		modal.addEventListener('click', (e) => {
			if (e.target === modal) {
				modal.remove();
			}
		});

		const closeOnEscape = (e) => {
			if (e.key === 'Escape') {
				modal.remove();
				document.removeEventListener('keydown', closeOnEscape);
			}
		};
		document.addEventListener('keydown', closeOnEscape);
	}

	function loadCharmsIntoSelector(modal, currentItem, inventoryItemIndex, inventoryItemElement) {
		const charmsGrid = modal.querySelector('#charms-grid');
		charmsGrid.innerHTML = '';

		const availableCharms = itemsDatabase.filter(item => 
			item.isCharm && 
			!item.id.endsWith('_rental') && 
			!item.isRental
		);

		const sortedCharms = availableCharms.sort((a, b) => {
			const orderA = rarities[a.rarity]?.order || 0;
			const orderB = rarities[b.rarity]?.order || 0;
			return orderB - orderA;
		});

		sortedCharms.forEach(charm => {
			const charmElement = document.createElement('div');
			charmElement.className = 'selector-item';
			charmElement.style.cssText = `
				background: #2a2a2a;
				border: 2px solid ${rarities[charm.rarity]?.colorHex || '#555'};
				border-radius: 8px;
				padding: 10px;
				text-align: center;
				cursor: pointer;
				transition: all 0.2s;
				position: relative;
				min-height: 140px;
				display: flex;
				flex-direction: column;
				justify-content: space-between;
			`;
			
			const displayName = charm.name.replace(/""/g, '"').replace(/^"|"$/g, '');
			
			if (currentItem.charm && currentItem.charm.id === charm.id) {
				charmElement.style.border = '3px solid gold';
				charmElement.style.background = 'rgba(255, 215, 0, 0.1)';
			}
			
			charmElement.innerHTML = `
				<div style="flex: 1; display: flex; align-items: center; justify-content: center;">
					<img src="${charm.image}" alt="${displayName}" style="max-width: 60px; max-height: 60px; object-fit: contain; border-radius: 4px;">
				</div>
				<div style="margin-top: 8px;">
					<div style="font-size: 11px; font-weight: bold; height: 32px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.2;">${displayName}</div>
					<div style="font-size: 10px; color: ${rarities[charm.rarity]?.colorHex || '#aaa'}; margin-top: 4px;">${rarities[charm.rarity]?.name || charm.rarity}</div>
					<div style="font-size: 9px; color: gold; margin-top: 2px;">${charm.price.toFixed(2)} ₽</div>
				</div>
				${currentItem.charm && currentItem.charm.id === charm.id ? '<div style="position: absolute; top: 5px; right: 5px; background: gold; color: black; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px;">✓</div>' : ''}
			`;

			charmElement.addEventListener('click', () => {
				setCharmForItem(currentItem, inventoryItemIndex, inventoryItemElement, charm);
				modal.remove();
			});

			charmElement.addEventListener('mouseenter', () => {
				charmElement.style.transform = 'scale(1.05)';
				charmElement.style.borderColor = 'gold';
			});

			charmElement.addEventListener('mouseleave', () => {
				charmElement.style.transform = 'scale(1)';
				if (currentItem.charm && currentItem.charm.id === charm.id) {
					charmElement.style.borderColor = 'gold';
				} else {
					charmElement.style.borderColor = rarities[charm.rarity]?.colorHex || '#555';
				}
			});

			charmsGrid.appendChild(charmElement);
		});
	}

	function filterCharmsInSelector(modal, searchTerm, rarityFilter) {
		const charmsGrid = modal.querySelector('#charms-grid');
		const charms = charmsGrid.querySelectorAll('.selector-item');
		
		charms.forEach(charm => {
			const charmName = charm.querySelector('div').textContent.toLowerCase();
			const charmRarityElement = charm.querySelector('div:nth-child(2)');
			const fullText = charmRarityElement ? charmRarityElement.textContent : '';
			const lines = fullText.split('\n').map(line => line.trim()).filter(line => line);
			const charmRarity = lines.length >= 2 ? lines[1].toLowerCase().trim() : '';
			
			const matchesSearch = !searchTerm || charmName.includes(searchTerm.toLowerCase());
			const matchesRarity = rarityFilter === 'all' || 
								charmRarity === rarityFilter.toLowerCase() ||
								(rarities[rarityFilter] && charmRarity === rarities[rarityFilter].name.toLowerCase());
			
			charm.style.display = matchesSearch && matchesRarity ? 'flex' : 'none';
		});
	}

	function setCharmForItem(currentItem, inventoryItemIndex, inventoryItemElement, charmData) {
		currentItem.charm = {
			id: charmData.id,
			name: charmData.name,
			image: charmData.image
		};
		
		updateInventory();
		showToast(`Брелок "${charmData.name}" установлен`);
		
		if (elementEditor) {
			const fieldsContainer = document.getElementById('editor-fields');
			if (fieldsContainer) {
				createEditorFields(inventoryItemElement);
			}
		}
	}

	function removeCharmFromItem(currentItem, inventoryItemIndex, inventoryItemElement) {
		if (currentItem.charm) {
			const charmName = currentItem.charm.name;
			delete currentItem.charm;
			updateInventory();
			showToast(`Брелок "${charmName}" удален`);
			
			if (elementEditor) {
				const fieldsContainer = document.getElementById('editor-fields');
				if (fieldsContainer) {
					createEditorFields(inventoryItemElement);
				}
			}
		}
	}

	function openStickersSelectionModal(currentItem, inventoryItemIndex, inventoryItemElement) {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.8);
			z-index: 100001;
			display: flex;
			justify-content: center;
			align-items: center;
		`;

		modal.innerHTML = `
			<div class="modal-content" style="
				background: rgba(30, 30, 30, 0.95);
				border: 2px solid gold;
				border-radius: 8px;
				width: 90%;
				max-width: 1000px;
				max-height: 80vh;
				overflow: hidden;
				display: flex;
				flex-direction: column;
			">
				<div class="modal-header" style="
					padding: 15px;
					background: rgba(0,0,0,0.5);
					border-bottom: 1px solid #555;
					display: flex;
					justify-content: space-between;
					align-items: center;
				">
					<h3 style="margin: 0; color: gold;">Выберите стикеры (максимум 4)</h3>
					<button id="close-stickers-selector" style="
						background: #ff4444;
						color: white;
						border: none;
						border-radius: 4px;
						width: 30px;
						height: 30px;
						cursor: pointer;
						font-size: 18px;
					">×</button>
				</div>
				<div style="padding: 15px; display: flex; gap: 15px; margin-bottom: 15px;">
					<input type="text" id="stickers-search" placeholder="Поиск стикера..." style="
						flex: 1;
						padding: 10px;
						background: #2a2a2a;
						border: 1px solid #555;
						border-radius: 4px;
						color: white;
					">
					<select id="sticker-rarity-filter" style="
						padding: 10px;
						background: #2a2a2a;
						border: 1px solid #555;
						border-radius: 4px;
						color: white;
						min-width: 150px;
					">
						<option value="all">Все редкости</option>
						${Object.keys(rarities)
							.filter(r => !['box-none', 'case-none'].includes(r))
							.map(r => `<option value="${r}">${rarities[r].name}</option>`)
							.join('')}
					</select>
					<button id="clear-stickers-btn" style="
						padding: 10px 15px;
						background: #ff4444;
						color: white;
						border: none;
						border-radius: 4px;
						cursor: pointer;
						white-space: nowrap;
					">Очистить все</button>
				</div>
				<div id="selected-stickers" style="
					padding: 0 15px;
					margin-bottom: 15px;
					min-height: 80px;
					display: flex;
					gap: 10px;
					flex-wrap: wrap;
					align-items: center;
				">
					<div style="color: #aaa; font-size: 12px;">Выбранные стикеры:</div>
					<!-- Выбранные стикеры будут здесь -->
				</div>
				<div id="stickers-grid" style="
					flex: 1;
					overflow-y: auto;
					padding: 15px;
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
					gap: 8px;
				">
					<!-- Стикеры будут загружены здесь -->
				</div>
				<div class="modal-footer" style="
					padding: 15px;
					background: rgba(0,0,0,0.5);
					border-top: 1px solid #555;
					text-align: center;
					display: flex;
					justify-content: space-between;
					align-items: center;
				">
					<div style="color: gold; font-size: 14px;">
						Выбрано: <span id="selected-count">0</span>/4
					</div>
					<div>
						<button id="cancel-stickers-select" style="
							padding: 10px 20px;
							background: #f44336;
							color: white;
							border: none;
							border-radius: 4px;
							cursor: pointer;
							margin-right: 10px;
						">Отмена</button>
						<button id="apply-stickers-btn" style="
							padding: 10px 20px;
							background: #4CAF50;
							color: white;
							border: none;
							border-radius: 4px;
							cursor: pointer;
						">Применить</button>
					</div>
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		let selectedStickers = currentItem.stickers ? [...currentItem.stickers] : [];

		loadStickersIntoSelector(modal, selectedStickers);
		updateSelectedStickersDisplay(modal, selectedStickers);

		document.getElementById('close-stickers-selector').addEventListener('click', () => modal.remove());
		document.getElementById('cancel-stickers-select').addEventListener('click', () => modal.remove());
		document.getElementById('clear-stickers-btn').addEventListener('click', () => {
			selectedStickers = [];
			updateSelectedStickersDisplay(modal, selectedStickers);
			loadStickersIntoSelector(modal, selectedStickers);
		});
		
		document.getElementById('apply-stickers-btn').addEventListener('click', () => {
			applyStickersToItem(currentItem, inventoryItemIndex, inventoryItemElement, selectedStickers);
			modal.remove();
		});
		
		document.getElementById('stickers-search').addEventListener('input', (e) => {
			filterStickersInSelector(modal, e.target.value, document.getElementById('sticker-rarity-filter').value);
		});
		
		document.getElementById('sticker-rarity-filter').addEventListener('change', (e) => {
			filterStickersInSelector(modal, document.getElementById('stickers-search').value, e.target.value);
		});

		modal.addEventListener('click', (e) => {
			if (e.target === modal) {
				modal.remove();
			}
		});

		const closeOnEscape = (e) => {
			if (e.key === 'Escape') {
				modal.remove();
				document.removeEventListener('keydown', closeOnEscape);
			}
		};
		document.addEventListener('keydown', closeOnEscape);
	}

	function loadStickersIntoSelector(modal, selectedStickers) {
		const stickersGrid = modal.querySelector('#stickers-grid');
		stickersGrid.innerHTML = '';

		const availableStickers = itemsDatabase.filter(item => 
			item.isSticker && 
			!item.id.endsWith('_rental') && 
			!item.isRental
		);

		const sortedStickers = availableStickers.sort((a, b) => {
			const orderA = rarities[a.rarity]?.order || 0;
			const orderB = rarities[b.rarity]?.order || 0;
			return orderB - orderA;
		});

		sortedStickers.forEach(sticker => {
			const stickerCount = selectedStickers.filter(s => s.id === sticker.id).length;
			const maxReached = stickerCount >= 4;
			
			const displayName = sticker.name.replace(/""/g, '"').replace(/^"|"$/g, '');
			
			const stickerElement = document.createElement('div');
			stickerElement.className = 'selector-item';
			stickerElement.style.cssText = `
				background: #2a2a2a;
				border: 2px solid ${stickerCount > 0 ? 'gold' : (rarities[sticker.rarity]?.colorHex || '#555')};
				border-radius: 8px;
				padding: 8px;
				text-align: center;
				cursor: ${maxReached ? 'not-allowed' : 'pointer'};
				transition: all 0.2s;
				position: relative;
				opacity: ${maxReached ? 0.5 : 1};
				min-height: 120px;
				display: flex;
				flex-direction: column;
				justify-content: space-between;
			`;
			
			stickerElement.innerHTML = `
				<div style="flex: 1; display: flex; align-items: center; justify-content: center;">
					<img src="${sticker.image}" alt="${displayName}" style="max-width: 50px; max-height: 50px; object-fit: contain; border-radius: 4px;">
				</div>
				<div style="margin-top: 6px;">
					<div style="font-size: 10px; font-weight: bold; height: 25px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.2;">${displayName}</div>
					<div style="font-size: 9px; color: ${rarities[sticker.rarity]?.colorHex || '#aaa'}; margin-top: 2px;">${rarities[sticker.rarity]?.name || sticker.rarity}</div>
				</div>
				${stickerCount > 0 ? `
					<div style="position: absolute; top: 3px; right: 3px; background: gold; color: black; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">
						${stickerCount}
					</div>
				` : ''}
				${maxReached ? '<div style="position: absolute; bottom: 3px; left: 3px; background: #ff4444; color: white; border-radius: 3px; padding: 1px 4px; font-size: 8px;">MAX</div>' : ''}
			`;

			if (!maxReached) {
				stickerElement.addEventListener('click', () => {
					toggleStickerSelection(modal, selectedStickers, sticker);
				});

				stickerElement.addEventListener('mouseenter', () => {
					stickerElement.style.transform = 'scale(1.05)';
					stickerElement.style.borderColor = 'gold';
				});

				stickerElement.addEventListener('mouseleave', () => {
					stickerElement.style.transform = 'scale(1)';
					stickerElement.style.borderColor = stickerCount > 0 ? 'gold' : (rarities[sticker.rarity]?.colorHex || '#555');
				});
			} else {
				stickerElement.addEventListener('click', () => {
					showToast('Максимум 4 одинаковых стикера', true);
				});
			}

			stickersGrid.appendChild(stickerElement);
		});
	}

	function toggleStickerSelection(modal, selectedStickers, sticker) {
		if (selectedStickers.length < 4) {
			selectedStickers.push({
				id: sticker.id,
				name: sticker.name,
				image: sticker.image
			});
		} else {
			showToast('Максимум 4 стикера на оружие', true);
			return;
		}
		
		updateSelectedStickersDisplay(modal, selectedStickers);
		loadStickersIntoSelector(modal, selectedStickers); // Перезагружаем для обновления состояния
	}

	function updateSelectedStickersDisplay(modal, selectedStickers) {
		const selectedContainer = modal.querySelector('#selected-stickers');
		const selectedCount = modal.querySelector('#selected-count');
		
		selectedCount.textContent = selectedStickers.length;
		
		while (selectedContainer.children.length > 1) {
			selectedContainer.removeChild(selectedContainer.lastChild);
		}
		
		const stickerGroups = {};
		selectedStickers.forEach(sticker => {
			if (!stickerGroups[sticker.id]) {
				stickerGroups[sticker.id] = {
					sticker: sticker,
					count: 0
				};
			}
			stickerGroups[sticker.id].count++;
		});
		
		Object.values(stickerGroups).forEach((group, groupIndex) => {
			const stickerElement = document.createElement('div');
			stickerElement.style.cssText = `
				position: relative;
				background: #2a2a2a;
				border: 2px solid gold;
				border-radius: 6px;
				padding: 5px;
				text-align: center;
				cursor: pointer;
			`;
			
			stickerElement.innerHTML = `
				<img src="${group.sticker.image}" alt="${group.sticker.name}" style="width: 40px; height: 40px; object-fit: contain; border-radius: 3px;">
				${group.count > 1 ? `
					<div style="position: absolute; top: -8px; right: -8px; background: gold; color: black; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">
						${group.count}
					</div>
				` : ''}
				<div style="position: absolute; top: -5px; left: -5px; background: #ff4444; color: white; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px; cursor: pointer;" class="remove-sticker-group">×</div>
			`;
			
			stickerElement.querySelector('.remove-sticker-group').addEventListener('click', (e) => {
				e.stopPropagation();
				const newSelectedStickers = selectedStickers.filter(s => s.id !== group.sticker.id);
				selectedStickers.length = 0; // Очищаем массив
				selectedStickers.push(...newSelectedStickers); // Заполняем новыми данными
				updateSelectedStickersDisplay(modal, selectedStickers);
				loadStickersIntoSelector(modal, selectedStickers);
			});
			
			stickerElement.addEventListener('click', (e) => {
				if (e.target.classList.contains('remove-sticker-group')) return;
				
				const indexToRemove = selectedStickers.findIndex(s => s.id === group.sticker.id);
				if (indexToRemove !== -1) {
					selectedStickers.splice(indexToRemove, 1);
					updateSelectedStickersDisplay(modal, selectedStickers);
					loadStickersIntoSelector(modal, selectedStickers);
				}
			});
			
			selectedContainer.appendChild(stickerElement);
		});
		
		if (selectedStickers.length > 0) {
			const clearAllBtn = document.createElement('button');
			clearAllBtn.style.cssText = `
				background: #ff4444;
				color: white;
				border: none;
				border-radius: 4px;
				padding: 5px 10px;
				cursor: pointer;
				font-size: 11px;
				margin-left: 10px;
			`;
			clearAllBtn.textContent = 'Удалить все';
			clearAllBtn.addEventListener('click', () => {
				selectedStickers.length = 0;
				updateSelectedStickersDisplay(modal, selectedStickers);
				loadStickersIntoSelector(modal, selectedStickers);
			});
			selectedContainer.appendChild(clearAllBtn);
		}
	}

	function filterStickersInSelector(modal, searchTerm, rarityFilter) {
		const stickersGrid = modal.querySelector('#stickers-grid');
		const stickers = stickersGrid.querySelectorAll('.selector-item');
		
		stickers.forEach(sticker => {
			const stickerName = sticker.querySelector('div').textContent.toLowerCase();
			const stickerRarityElement = sticker.querySelector('div:nth-child(2)');
			const fullText = stickerRarityElement ? stickerRarityElement.textContent : '';
			const lines = fullText.split('\n').map(line => line.trim()).filter(line => line);
			const stickerRarity = lines.length >= 2 ? lines[1].toLowerCase().trim() : '';
			
			const matchesSearch = !searchTerm || stickerName.includes(searchTerm.toLowerCase());
			const matchesRarity = rarityFilter === 'all' || 
								stickerRarity === rarityFilter.toLowerCase() ||
								(rarities[rarityFilter] && stickerRarity === rarities[rarityFilter].name.toLowerCase());
			
			sticker.style.display = matchesSearch && matchesRarity ? 'flex' : 'none';
		});
	}

	function applyStickersToItem(currentItem, inventoryItemIndex, inventoryItemElement, selectedStickers) {
		if (selectedStickers.length > 0) {
			currentItem.stickers = selectedStickers;
		} else {
			delete currentItem.stickers;
		}
		
		updateInventory();
		showToast(`Стикеры применены (${selectedStickers.length} шт.)`);
		
		if (elementEditor) {
			const fieldsContainer = document.getElementById('editor-fields');
			if (fieldsContainer) {
				createEditorFields(inventoryItemElement);
			}
		}
	}

	function openMedalSelectionModal() {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.8);
			z-index: 100001;
			display: flex;
			justify-content: center;
			align-items: center;
		`;

		modal.innerHTML = `
			<div class="modal-content" style="
				background: rgba(30, 30, 30, 0.95);
				border: 2px solid gold;
				border-radius: 8px;
				width: 90%;
				max-width: 800px;
				max-height: 80vh;
				overflow: hidden;
				display: flex;
				flex-direction: column;
			">
				<div class="modal-header" style="
					padding: 15px;
					background: rgba(0,0,0,0.5);
					border-bottom: 1px solid #555;
					display: flex;
					justify-content: space-between;
					align-items: center;
				">
					<h3 style="margin: 0; color: gold;">Выберите медаль</h3>
					<button id="close-medal-selector" style="
						background: #ff4444;
						color: white;
						border: none;
						border-radius: 4px;
						width: 30px;
						height: 30px;
						cursor: pointer;
						font-size: 18px;
					">×</button>
				</div>
				<div style="padding: 15px; display: flex; gap: 15px; margin-bottom: 15px;">
					<input type="text" id="medal-search" placeholder="Поиск медали..." style="
						flex: 1;
						padding: 10px;
						background: #2a2a2a;
						border: 1px solid #555;
						border-radius: 4px;
						color: white;
					">
					<button id="remove-medal-btn" style="
						padding: 10px 15px;
						background: #ff4444;
						color: white;
						border: none;
						border-radius: 4px;
						cursor: pointer;
						white-space: nowrap;
					">Снять медаль</button>
				</div>
				<div id="medals-grid" style="
					flex: 1;
					overflow-y: auto;
					padding: 15px;
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
					gap: 10px;
				">
					<!-- Медали будут загружены здесь -->
				</div>
				<div class="modal-footer" style="
					padding: 15px;
					background: rgba(0,0,0,0.5);
					border-top: 1px solid #555;
					text-align: center;
				">
					<button id="cancel-medal-select" style="
						padding: 10px 20px;
						background: #f44336;
						color: white;
						border: none;
						border-radius: 4px;
						cursor: pointer;
						margin-right: 10px;
					">Отмена</button>
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		loadMedalsIntoSelector(modal);

		document.getElementById('close-medal-selector').addEventListener('click', () => modal.remove());
		document.getElementById('cancel-medal-select').addEventListener('click', () => modal.remove());
		document.getElementById('remove-medal-btn').addEventListener('click', () => {
			openUnequipSelectionModal();
			modal.remove();
		});
		
		document.getElementById('medal-search').addEventListener('input', (e) => {
			filterMedalsInSelector(modal, e.target.value);
		});

		modal.addEventListener('click', (e) => {
			if (e.target === modal) {
				modal.remove();
			}
		});

		const closeOnEscape = (e) => {
			if (e.key === 'Escape') {
				modal.remove();
				document.removeEventListener('keydown', closeOnEscape);
			}
		};
		document.addEventListener('keydown', closeOnEscape);
	}

	function loadMedalsIntoSelector(modal) {
		const medalsGrid = modal.querySelector('#medals-grid');
		medalsGrid.innerHTML = '';

		const availableMedals = itemsDatabase.filter(item => 
			!item.id.endsWith('_rental') && 
			!item.isRental &&
			item.name.startsWith('Medal')
		);

		const sortedMedals = availableMedals.sort((a, b) => {
			const orderA = rarities[a.rarity]?.order || 0;
			const orderB = rarities[b.rarity]?.order || 0;
			return orderB - orderA;
		});

		if (sortedMedals.length === 0) {
			medalsGrid.innerHTML = `
				<div style="grid-column: 1 / -1; text-align: center; color: #aaa; padding: 40px;">
					Медали не найдены в базе данных.<br>
					Медали должны начинаться с "Medal" в названии.
				</div>
			`;
			return;
		}

		sortedMedals.forEach(medal => {
			const medalElement = document.createElement('div');
			medalElement.className = 'selector-item';
			medalElement.style.cssText = `
				background: #2a2a2a;
				border: 2px solid ${currentMedals.includes(medal.id) ? 'gold' : (rarities[medal.rarity]?.colorHex || '#555')};
				border-radius: 8px;
				padding: 10px;
				text-align: center;
				cursor: pointer;
				transition: all 0.2s;
				position: relative;
				min-height: 140px;
				display: flex;
				flex-direction: column;
				justify-content: space-between;
			`;
			
			const isApplied = currentMedals.includes(medal.id);
			if (isApplied) {
				medalElement.style.background = 'rgba(255, 215, 0, 0.2)';
				medalElement.style.border = '3px solid gold';
			}
			
			const appliedSlots = [];
			currentMedals.forEach((m, idx) => {
				if (m === medal.id) appliedSlots.push(idx + 1);
			});
			
			medalElement.innerHTML = `
				<div style="flex: 1; display: flex; align-items: center; justify-content: center;">
					<img src="${medal.image}" alt="${medal.name}" style="max-width: 60px; max-height: 60px; object-fit: contain; border-radius: 4px;">
				</div>
				<div style="margin-top: 8px;">
					<div style="font-size: 11px; font-weight: bold; height: 32px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.2;">${medal.name}</div>
					<div style="font-size: 10px; color: ${rarities[medal.rarity]?.colorHex || '#aaa'}; margin-top: 4px;">${rarities[medal.rarity]?.name || medal.rarity}</div>
					<div style="font-size: 9px; color: gold; margin-top: 2px;">${medal.price.toFixed(2)} ₽</div>
					${appliedSlots.length > 0 ? `<div style="font-size: 8px; color: #ffd700; margin-top: 2px;">Слоты: ${appliedSlots.join(', ')}</div>` : ''}
				</div>
				${isApplied ? 
					'<div style="position: absolute; top: 5px; right: 5px; background: gold; color: black; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">✓</div>' : 
					''
				}
			`;

			medalElement.addEventListener('click', () => {
				const freeSlotsCount = currentMedals.filter(slot => slot === null).length;
				
				if (freeSlotsCount === 0) {
					showToast('Все слоты для медалей заняты! Сначала снимите какую-нибудь медаль.');
					return;
				}
				
				const medalInInventory = inventory.find(item => item.id === medal.id);
				if (!medalInInventory) {
					showToast('У вас нет этой медали в инвентаре!');
					return;
				}
				
				openSlotSelectionModal(medal.id, medal);
				modal.remove();
			});

			medalElement.addEventListener('mouseenter', () => {
				medalElement.style.transform = 'scale(1.05)';
				medalElement.style.borderColor = 'gold';
			});

			medalElement.addEventListener('mouseleave', () => {
				medalElement.style.transform = 'scale(1)';
				if (isApplied) {
					medalElement.style.borderColor = 'gold';
				} else {
					medalElement.style.borderColor = rarities[medal.rarity]?.colorHex || '#555';
				}
			});

			medalsGrid.appendChild(medalElement);
		});
	}

	function filterMedalsInSelector(modal, searchTerm) {
		const medalsGrid = modal.querySelector('#medals-grid');
		const medals = medalsGrid.querySelectorAll('.selector-item');
		
		medals.forEach(medal => {
			const medalName = medal.querySelector('div div').textContent.toLowerCase();
			const matchesSearch = !searchTerm || medalName.includes(searchTerm.toLowerCase());
			medal.style.display = matchesSearch ? 'flex' : 'none';
		});
	}

	function setMedalForProfile(medalData) {
		const medalInInventory = inventory.find(item => item.id === medalData.id);
		if (!medalInInventory) {
			showToast(`Медали "${medalData.name}" нет в инвентаре!`);
			return false;
		}
		
		const freeSlot = currentMedals.findIndex(slot => slot === null);
		if (freeSlot === -1) {
			showToast('Все слоты для медалей заняты! Сначала снимите какую-нибудь медаль.');
			return false;
		}
		
		currentMedals[freeSlot] = medalData.id;
		
		showToast(`Медаль "${medalData.name}" применена в слот ${freeSlot + 1}`);
		saveGameState();
		updateProfileMedalDisplay();
		updateInventory();
		return true;
	}

	function updateProfileMedalDisplay() {
		const profileModal = document.querySelector('.modal-content h2');
		if (profileModal && profileModal.textContent.includes('Профиль')) {
			const closeBtn = document.querySelector('#close-profile-btn');
			if (closeBtn) {
				closeBtn.click();
				setTimeout(() => {
					openProfile();
				}, 100);
			}
		}
	}

	function openFrameSelectionModal() {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.8);
			z-index: 100001;
			display: flex;
			justify-content: center;
			align-items: center;
		`;

		modal.innerHTML = `
			<div class="modal-content" style="
				background: rgba(30, 30, 30, 0.95);
				border: 2px solid gold;
				border-radius: 8px;
				width: 90%;
				max-width: 800px;
				max-height: 80vh;
				overflow: hidden;
				display: flex;
				flex-direction: column;
			">
				<div class="modal-header" style="
					padding: 15px;
					background: rgba(0,0,0,0.5);
					border-bottom: 1px solid #555;
					display: flex;
					justify-content: space-between;
					align-items: center;
				">
					<h3 style="margin: 0; color: gold;">Выберите рамку</h3>
					<button id="close-frame-selector" style="
						background: #ff4444;
						color: white;
						border: none;
						border-radius: 4px;
						width: 30px;
						height: 30px;
						cursor: pointer;
						font-size: 18px;
					">×</button>
				</div>
				<div style="padding: 15px; display: flex; gap: 15px; margin-bottom: 15px;">
					<input type="text" id="frame-search" placeholder="Поиск рамки..." style="
						flex: 1;
						padding: 10px;
						background: #2a2a2a;
						border: 1px solid #555;
						border-radius: 4px;
						color: white;
					">
				</div>
				<div id="frames-grid" style="
					flex: 1;
					overflow-y: auto;
					padding: 15px;
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
					gap: 15px;
				">
					<!-- Рамки будут загружены здесь -->
				</div>
				<div class="modal-footer" style="
					padding: 15px;
					background: rgba(0,0,0,0.5);
					border-top: 1px solid #555;
					text-align: center;
				">
					<button id="cancel-frame-select" style="
						padding: 10px 20px;
						background: #f44336;
						color: white;
						border: none;
						border-radius: 4px;
						cursor: pointer;
						margin-right: 10px;
					">Отмена</button>
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		loadFramesIntoSelector(modal);

		document.getElementById('close-frame-selector').addEventListener('click', () => modal.remove());
		document.getElementById('cancel-frame-select').addEventListener('click', () => modal.remove());
		
		document.getElementById('frame-search').addEventListener('input', (e) => {
			filterFramesInSelector(modal, e.target.value);
		});

		modal.addEventListener('click', (e) => {
			if (e.target === modal) {
				modal.remove();
			}
		});

		const closeOnEscape = (e) => {
			if (e.key === 'Escape') {
				modal.remove();
				document.removeEventListener('keydown', closeOnEscape);
			}
		};
		document.addEventListener('keydown', closeOnEscape);
	}

	function loadFramesIntoSelector(modal) {
		const framesGrid = modal.querySelector('#frames-grid');
		framesGrid.innerHTML = '';

		const availableFrames = Object.values(framesDatabase);

		availableFrames.forEach(frame => {
			const frameElement = document.createElement('div');
			frameElement.className = 'selector-item';
			frameElement.style.cssText = `
				background: #2a2a2a;
				border: 2px solid ${currentFrame === frame.id ? 'gold' : '#555'};
				border-radius: 8px;
				padding: 15px;
				text-align: center;
				cursor: pointer;
				transition: all 0.2s;
				position: relative;
				min-height: 180px;
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
			`;
			
			if (currentFrame === frame.id) {
				frameElement.style.background = 'rgba(255, 215, 0, 0.1)';
			}
			
			frameElement.innerHTML = `
				<img src="${frame.image}" alt="${frame.name}" style="max-width: 100px; max-height: 100px; object-fit: contain; border-radius: 4px; margin-bottom: 10px;">
				<div style="font-size: 12px; font-weight: bold; margin-bottom: 5px;">${frame.name}</div>
				<div style="font-size: 10px; color: ${rarities[frame.rarity]?.colorHex || '#aaa'};">${rarities[frame.rarity]?.name || frame.rarity}</div>
				${frame.giveFromLevel > 0 ? `<div style="font-size: 9px; color: #aaa; margin-top: 5px;">Уровень: ${frame.giveFromLevel}+</div>` : ''}
				${currentFrame === frame.id ? '<div style="position: absolute; top: 5px; right: 5px; background: gold; color: black; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px;">✓</div>' : ''}
			`;

			frameElement.addEventListener('click', () => {
				setFrameForProfile(frame);
				modal.remove();
			});

			frameElement.addEventListener('mouseenter', () => {
				frameElement.style.transform = 'scale(1.05)';
				frameElement.style.borderColor = 'gold';
			});

			frameElement.addEventListener('mouseleave', () => {
				frameElement.style.transform = 'scale(1)';
				if (currentFrame === frame.id) {
					frameElement.style.borderColor = 'gold';
				} else {
					frameElement.style.borderColor = '#555';
				}
			});

			framesGrid.appendChild(frameElement);
		});
	}

	function filterFramesInSelector(modal, searchTerm) {
		const framesGrid = modal.querySelector('#frames-grid');
		const frames = framesGrid.querySelectorAll('.selector-item');
		
		frames.forEach(frame => {
			const frameName = frame.querySelector('div').textContent.toLowerCase();
			const matchesSearch = !searchTerm || frameName.includes(searchTerm.toLowerCase());
			frame.style.display = matchesSearch ? 'flex' : 'none';
		});
	}

	function setFrameForProfile(frameData) {
		Object.values(framesDatabase).forEach(f => f.equipped = false);
		
		framesDatabase[frameData.id].equipped = true;
		currentFrame = frameData.id;
		
		saveGameState();
		showToast(`Рамка "${frameData.name}" применена`);
		
		updateProfileFrameDisplay();
	}

	function updateProfileFrameDisplay() {
		const profileModal = document.querySelector('.modal-content h2');
		if (profileModal && profileModal.textContent.includes('Профиль')) {
			const closeBtn = document.querySelector('#close-profile-btn');
			if (closeBtn) {
				closeBtn.click();
				setTimeout(() => {
					openProfile();
				}, 100);
			}
		}
	}
	
	function validateItemType(item) {
		const conflicts = [];
		
		if (item.isCharm && item.isSticker) {
			conflicts.push('Предмет не может быть одновременно брелком и стикером');
			item.isSticker = false; // Сбрасываем один из типов
		}
		
		if (item.isCharm && item.isItemWithoutSlot) {
			conflicts.push('Брелок не может быть предметом без слота');
			item.isItemWithoutSlot = false;
		}
		
		if (item.isSticker && item.isItemWithoutSlot) {
			conflicts.push('Стикер не может быть предметом без слота');
			item.isItemWithoutSlot = false;
		}
		
		if (item.isCase) {
			conflicts.push('Кейс не может менять тип');
			item.isCharm = false;
			item.isSticker = false;
			item.isItemWithoutSlot = false;
		}
		
		if (conflicts.length > 0) {
			showToast('Конфликт типов: ' + conflicts.join(', '), true);
		}
		
		return conflicts.length === 0;
	}

	function convertToRental(inventoryItem, inventoryItemIndex) {
		const originalItem = itemsDatabase.find(item => item.id === inventoryItem.id);
		
		if (isItemRentalForbidden(inventoryItem, originalItem)) {
			showToast('Этот тип предмета нельзя сделать арендованным', true);
			return;
		}

		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.8);
			z-index: 100001;
			display: flex;
			justify-content: center;
			align-items: center;
		`;

		modal.innerHTML = `
			<div class="modal-content" style="
				background: rgba(30, 30, 30, 0.95);
				border: 2px solid gold;
				border-radius: 8px;
				width: 400px;
				max-height: 80vh;
				overflow: hidden;
				display: flex;
				flex-direction: column;
			">
				<div class="modal-header" style="
					padding: 15px;
					background: rgba(0,0,0,0.5);
					border-bottom: 1px solid #555;
					display: flex;
					justify-content: space-between;
					align-items: center;
				">
					<h3 style="margin: 0; color: gold;">Настройка аренды</h3>
					<button id="close-rental-modal" style="
						background: #ff4444;
						color: white;
						border: none;
						border-radius: 4px;
						width: 30px;
						height: 30px;
						cursor: pointer;
						font-size: 18px;
					">×</button>
				</div>
				<div style="padding: 20px;">
					<div style="margin-bottom: 15px;">
						<label style="display: block; margin-bottom: 8px; color: #ccc;">Длительность аренды (минуты):</label>
						<input type="number" id="rental-duration" min="1" max="10080" value="3" style="
							width: 100%;
							padding: 10px;
							background: #2a2a2a;
							border: 1px solid #555;
							border-radius: 4px;
							color: white;
						">
					</div>
					<div style="color: #aaa; font-size: 12px; margin-bottom: 15px;">
						Максимум: 10080 минут (7 дней)
					</div>
					<div style="color: #ffa500; font-size: 12px; padding: 10px; background: rgba(255,165,0,0.1); border-radius: 4px;">
						⚠️ Предмет будет помечен как "Арендованный"
					</div>
				</div>
				<div class="modal-footer" style="
					padding: 15px;
					background: rgba(0,0,0,0.5);
					border-top: 1px solid #555;
					text-align: center;
					display: flex;
					justify-content: space-between;
				">
					<button id="cancel-rental" style="
						padding: 10px 20px;
						background: #f44336;
						color: white;
						border: none;
						border-radius: 4px;
						cursor: pointer;
					">Отмена</button>
					<button id="confirm-rental" style="
						padding: 10px 20px;
						background: #4CAF50;
						color: white;
						border: none;
						border-radius: 4px;
						cursor: pointer;
					">Преобразовать</button>
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		document.getElementById('close-rental-modal').addEventListener('click', () => modal.remove());
		document.getElementById('cancel-rental').addEventListener('click', () => modal.remove());
		
		document.getElementById('confirm-rental').addEventListener('click', () => {
			const duration = parseInt(document.getElementById('rental-duration').value) || 3;
			
			if (isItemRentalForbidden(inventoryItem, originalItem)) {
				showToast('Этот тип предмета нельзя сделать арендованным', true);
				modal.remove();
				return;
			}
			
			inventoryItem.isRental = true;
			inventoryItem.rentalExpires = Date.now() + (duration * 60 * 1000);
			
			if (!inventoryItem.name.includes('(TimeLimited)')) {
				inventoryItem.name += ' (TimeLimited)';
			}
			
			if (!inventoryItem.id.endsWith('_rental')) {
				inventoryItem.id += '_rental';
			}
			
			updateInventory();
			showToast(`Предмет преобразован в арендованный (${duration} минут)`);
			modal.remove();
			
			if (elementEditor) {
				const fieldsContainer = document.getElementById('editor-fields');
				if (fieldsContainer) {
					createEditorFields(document.querySelector(`.inventory-item[data-index="${inventoryItemIndex}"]`));
				}
			}
		});

		modal.addEventListener('click', (e) => {
			if (e.target === modal) {
				modal.remove();
			}
		});

		const closeOnEscape = (e) => {
			if (e.key === 'Escape') {
				modal.remove();
				document.removeEventListener('keydown', closeOnEscape);
			}
		};
		document.addEventListener('keydown', closeOnEscape);
	}

	function isItemRentalForbidden(inventoryItem, originalItem) {
		if (originalItem) {
			if (originalItem.isCase) {
				return true;
			}
			
			if (originalItem.isCharm) {
				return true;
			}
			
			if (originalItem.isSticker) {
				return true;
			}
			
			if (originalItem.name.endsWith('Fragment') || inventoryItem.name.endsWith('Fragment')) {
				return true;
			}
		}
		
		return false;
	}

	function convertRentalToNormal(inventoryItem, inventoryItemIndex) {
		delete inventoryItem.isRental;
		delete inventoryItem.rentalExpires;
		
		inventoryItem.name = inventoryItem.name.replace(' (TimeLimited)', '');
		
		if (inventoryItem.id.endsWith('_rental')) {
			inventoryItem.id = inventoryItem.id.replace('_rental', '');
		}
		
		updateInventory();
		showToast('Предмет преобразован в обычный');
		
		if (elementEditor) {
			const fieldsContainer = document.getElementById('editor-fields');
			if (fieldsContainer) {
				createEditorFields(document.querySelector(`.inventory-item[data-index="${inventoryItemIndex}"]`));
			}
		}
	}
	
	function createEditorFields(element) {
		const fieldsContainer = document.getElementById('editor-fields');
		fieldsContainer.innerHTML = '';
		fieldsContainer.style.display = 'block';
		
		addTextField(fieldsContainer, 'Текст содержимого', element.textContent || '', (value) => {
			element.textContent = value;
		});
		
		addTextField(fieldsContainer, 'ID', element.id || '', (value) => {
			element.id = value;
		});
		
		addTextField(fieldsContainer, 'Классы', element.className || '', (value) => {
			element.className = value;
		});
		
		if (element.classList.contains('rang-container')) {
			const title = element.querySelector('h3').textContent;
			let rangType = '';
			
			if (title.includes('Соревновательный')) rangType = 'mm';
			else if (title.includes('Союзный')) rangType = 'souz';
			else if (title.includes('Дуэльный')) rangType = 'duel';
			
			if (rangType) {
				const currentRang = userRangs[rangType];
				const currentRangData = rangsDatabase[currentRang.current];
				
				const rangOptions = Object.values(rangsDatabase)
					.filter(rang => rang.type === rangType)
					.map(rang => rang.id);
					
				addSelectField(fieldsContainer, 'Ранг', rangOptions, currentRang.current, (value) => {
					userRangs[rangType].current = value;
					updateProfileRangDisplay(element, rangType);
					saveGameState();
					showToast(`Ранг ${rangType} изменен на: ${rangsDatabase[value].name}`);
				});
				
				addNumberField(fieldsContainer, 'ММР', currentRang.stars, (value) => {
					userRangs[rangType].stars = parseInt(value) || 0;
					updateProfileRangDisplay(element, rangType);
					saveGameState();
					showToast(`ММР ${rangType} установлено: ${userRangs[rangType].stars}`);
				});
				
				addInfoField(fieldsContainer, 'Текущий ранг', currentRangData.name);
				addInfoField(fieldsContainer, 'Требуется ММР для след. ранга', currentRangData.stars_for_up.toString());
				addInfoField(fieldsContainer, 'Следующий ранг', rangsDatabase[currentRangData.next_rang]?.name || 'Максимальный');
			}
		}
		
		if (element.classList.contains('rang-container') && element.querySelector('h3')?.textContent?.includes('Клан')) {
			addNumberField(fieldsContainer, 'ММР клана', userClan.stars, (value) => {
				userClan.stars = parseFloat(value);
				saveGameState();
				showToast('ММР клана обновлено');
			});
			
			const clanRangOptions = Object.values(rangsDatabase)
				.filter(rang => rang.type === 'clan')
				.map(rang => rang.id);
				
			addSelectField(fieldsContainer, 'Ранг клана', clanRangOptions, userClan.rank, (value) => {
				userClan.rank = value;
				saveGameState();
				showToast(`Ранг клана изменен на: ${rangsDatabase[value].name}`);
			});
		}
		
		if (element.id === 'balance-amount' || element.classList.contains('balance-amount')) {
			addNumberField(fieldsContainer, 'Баланс', balance, (value) => {
				balance = parseFloat(value);
				if (element.textContent !== undefined) {
					element.textContent = balance.toLocaleString('ru-RU');
				}
				UpdateStatrackFrame(balance);
				saveGameState();
				showToast('Баланс обновлен');
			});
		}
		
		if (element.classList.contains('item-card') && element.id) {
			const itemId = element.id;
			const item = itemsDatabase.find(item => item.id === itemId);
			
			if (item) {
				addTextField(fieldsContainer, 'Название предмета', item.name, (value) => {
					item.name = value;
					const nameElement = element.querySelector('.item-name');
					if (nameElement) nameElement.textContent = value;
					showToast('Название предмета обновлено');
				});
				
				addTextField(fieldsContainer, 'Изображение предмета (URL)', item.image, (value) => {
					item.image = value;
					const imgElement = element.querySelector('.item-img img');
					if (imgElement) {
						imgElement.src = value;
						imgElement.alt = item.name;
					}
					showToast('Изображение предмета обновлено');
				});
				
				addNumberField(fieldsContainer, 'Цена', item.price, (value) => {
					item.price = parseFloat(value);
					updateItemPriceInUI(item);
					showToast('Цена предмета обновлена');
				});
				
				addNumberField(fieldsContainer, 'Количество', item.stock, (value) => {
					item.stock = parseInt(value);
					const stockElement = element.querySelector('.available-stock');
					if (stockElement) stockElement.textContent = value;
					showToast('Количество предметов обновлено');
				});
				
				addNumberField(fieldsContainer, 'Коэффициент цены', item.priceMultiply || 0, (value) => {
					item.priceMultiply = parseFloat(value);
					showToast('Коэффициент цены обновлен');
				});
				
				const rarityOptions = Object.keys(rarities);
				addSelectField(fieldsContainer, 'Редкость', rarityOptions, item.rarity, (value) => {
					item.rarity = value;
					element.setAttribute('data-rarity', value);
					const rarityElement = element.querySelector('.item-rarity');
					if (rarityElement) {
						rarityElement.className = `item-rarity ${rarities[value].color}`;
					}
					showToast('Редкость предмета обновлена');
				});
				
				const collectionOptions = Object.keys(collectionsDatabase);
				addSelectField(fieldsContainer, 'Коллекция', collectionOptions, item.collection || '', (value) => {
					item.collection = value;
					const collectionElement = element.querySelector('.item-collection');
					if (collectionElement) {
						const collectionInfo = collectionsDatabase[value] || { name: value, image: '' };
						collectionElement.innerHTML = `
							${collectionInfo.image ? `<img src="${collectionInfo.image}" class="collection-icon" alt="${collectionInfo.name}" style="width: 30px; height: auto;">` : ''}
							${collectionInfo.name}
						`;
						collectionElement.dataset.collection = value;
					}
					showToast('Коллекция предмета обновлена');
				});
				
				const currentCollection = collectionsDatabase[item.collection];
				if (currentCollection) {
					addTextField(fieldsContainer, 'Название коллекции', currentCollection.name, (value) => {
						currentCollection.name = value;
						const collectionElement = element.querySelector('.item-collection');
						if (collectionElement) {
							collectionElement.innerHTML = `
								${currentCollection.image ? `<img src="${currentCollection.image}" class="collection-icon" alt="${value}" style="width: 30px; height: auto;">` : ''}
								${value}
							`;
						}
						showToast('Название коллекции обновлено');
					});
					
					addTextField(fieldsContainer, 'Изображение коллекции (URL)', currentCollection.image || '', (value) => {
						currentCollection.image = value;
						const collectionElement = element.querySelector('.item-collection');
						if (collectionElement) {
							collectionElement.innerHTML = `
								${value ? `<img src="${value}" class="collection-icon" alt="${currentCollection.name}" style="width: 30px; height: auto;">` : ''}
								${currentCollection.name}
							`;
						}
						showToast('Изображение коллекции обновлено');
					});
				}
				
				if (!item.isCase) {
					const itemTypeOptions = [
						{ value: 'normal', label: 'Обычный предмет' },
						{ value: 'charm', label: 'Брелок' },
						{ value: 'sticker', label: 'Стикер' },
						{ value: 'withoutSlot', label: 'Предмет без слота' }
					];
					
					let currentType = 'normal';
					if (item.isCharm) currentType = 'charm';
					else if (item.isSticker) currentType = 'sticker';
					else if (item.isItemWithoutSlot) currentType = 'withoutSlot';
					
					addSelectField(fieldsContainer, 'Тип предмета', itemTypeOptions.map(opt => opt.value), currentType, (value) => {
						item.isCharm = false;
						item.isSticker = false;
						item.isItemWithoutSlot = false;
						
						switch(value) {
							case 'charm':
								item.isCharm = true;
								showToast('Тип предмета изменен на: Брелок');
								break;
							case 'sticker':
								item.isSticker = true;
								showToast('Тип предмета изменен на: Стикер');
								break;
							case 'withoutSlot':
								item.isItemWithoutSlot = true;
								showToast('Тип предмета изменен на: Предмет без слота');
								break;
							default:
								showToast('Тип предмета изменен на: Обычный предмет');
								break;
						}
						
						validateItemType(item);
					}, itemTypeOptions.map(opt => opt.label));
				} else {
					addTextField(fieldsContainer, 'Тип предмета', 'Кейс (неизменяемо)', (value) => {
					});
				}
				
				const separator = document.createElement('div');
				separator.style.cssText = 'border-top: 1px solid #555; margin: 15px 0;';
				fieldsContainer.appendChild(separator);
			}
		}
		
		let inventoryItemElement = element;
		let inventoryItemIndex = null;
		
		while (inventoryItemElement && !inventoryItemElement.classList.contains('inventory-item')) {
			inventoryItemElement = inventoryItemElement.parentElement;
			if (!inventoryItemElement || inventoryItemElement === document.body) {
				inventoryItemElement = null;
				break;
			}
		}
		
		if (inventoryItemElement && inventoryItemElement.classList.contains('inventory-item')) {
			inventoryItemIndex = parseInt(inventoryItemElement.getAttribute('data-index'));
			const inventoryItem = inventory[inventoryItemIndex];
			
			if (inventoryItem) {
				if (inventoryItem.name && inventoryItem.name.startsWith('Medal')) {
					if (inventoryItem.slot !== undefined && inventoryItem.slot !== null) {
						return; // Примененную медаль не продаем
					}
				}
				addTextField(fieldsContainer, 'Название предмета', inventoryItem.name, (value) => {
					inventoryItem.name = value;
					const nameElement = inventoryItemElement.querySelector('.inventory-item-name');
					if (nameElement) {
						nameElement.textContent = value;
						nameElement.style.whiteSpace = 'normal';
						nameElement.style.wordWrap = 'break-word';
					}
					showToast('Название предмета в инвентаре обновлено');
				});
				
				addButtonField(fieldsContainer, '🔄 Заменить предмет', () => {
					openItemSelectionModal(inventoryItem, inventoryItemIndex, inventoryItemElement);
				}, 'replace');
				
				addButtonField(fieldsContainer, '🎨 Выбрать стикеры', () => {
					openStickersSelectionModal(inventoryItem, inventoryItemIndex, inventoryItemElement);
				}, 'duplicate');
				
				addButtonField(fieldsContainer, '🔗 Выбрать брелок', () => {
					openCharmSelectionModal(inventoryItem, inventoryItemIndex, inventoryItemElement);
				}, 'duplicate');
				
				const currentStickers = inventoryItem.stickers ? inventoryItem.stickers.map(s => s.id).join(', ') : '';
				addTextField(fieldsContainer, 'Стикеры (ID через запятую, резерв)', currentStickers, (value) => {
					if (value.trim()) {
						const stickerIds = value.split(',').map(id => id.trim()).filter(id => id);
						inventoryItem.stickers = stickerIds.map(stickerId => {
							const stickerItem = itemsDatabase.find(item => item.id === stickerId);
							return stickerItem ? {
								id: stickerItem.id,
								name: stickerItem.name,
								image: stickerItem.image
							} : null;
						}).filter(Boolean);
					} else {
						delete inventoryItem.stickers;
					}
					updateInventory();
					showToast('Стикеры обновлены');
				});
				
				const currentCharm = inventoryItem.charm ? inventoryItem.charm.id : '';
				addTextField(fieldsContainer, 'Брелок (ID, резерв)', currentCharm, (value) => {
					if (value.trim()) {
						const charmItem = itemsDatabase.find(item => item.id === value.trim());
						if (charmItem) {
							inventoryItem.charm = {
								id: charmItem.id,
								name: charmItem.name,
								image: charmItem.image
							};
							showToast('Брелок добавлен');
						}
					} else {
						delete inventoryItem.charm;
						showToast('Брелок удален');
					}
					updateInventory();
				});
				
				addTextField(fieldsContainer, '🔧 Заменить по ID (резерв)', inventoryItem.id, (value) => {
					if (value && value !== inventoryItem.id) {
						const newItemData = itemsDatabase.find(item => item.id === value);
						if (newItemData) {
							if (true) {
								const oldStickers = inventoryItem.stickers ? [...inventoryItem.stickers] : null;
								const oldCharm = inventoryItem.charm ? {...inventoryItem.charm} : null;
								
								inventoryItem.id = newItemData.id;
								inventoryItem.name = newItemData.name;
								inventoryItem.rarity = newItemData.rarity;
								inventoryItem.image = newItemData.image;
								
								/* if (!newItemData.isItemWithoutSlot && !newItemData.isCase && 
									!newItemData.isSticker && !newItemData.isCharm) */
								if (!newItemData.isCase) {
									if (oldStickers) inventoryItem.stickers = oldStickers;
									if (oldCharm) inventoryItem.charm = oldCharm;
								} else {
									if (oldStickers) {
										oldStickers.forEach(sticker => {
											inventory.push({
												id: sticker.id,
												name: sticker.name,
												rarity: itemsDatabase.find(i => i.id === sticker.id)?.rarity || 'none',
												image: sticker.image
											});
										});
										delete inventoryItem.stickers;
									}
									if (oldCharm) {
										inventory.push({
											id: oldCharm.id,
											name: oldCharm.name,
											rarity: itemsDatabase.find(i => i.id === oldCharm.id)?.rarity || 'none',
											image: oldCharm.image
										});
										delete inventoryItem.charm;
									}
								}
								
								updateInventory();
								showToast(`Предмет заменен на: ${newItemData.name}`);
								
								setTimeout(() => {
									createEditorFields(inventoryItemElement);
								}, 500);
							}
						} else {
							showToast(`Предмет с ID "${value}" не найден в базе данных`, true);
						}
					}
				});
				
				  const originalItem = itemsDatabase.find(item => item.id === inventoryItem.id);
				
				if (inventoryItem.isRental) {
					const remainingTime = inventoryItem.rentalExpires - Date.now();
					const minutesLeft = Math.max(0, Math.floor(remainingTime / (60 * 1000)));
					
					addNumberField(fieldsContainer, 'Осталось минут аренды', minutesLeft, (value) => {
						inventoryItem.rentalExpires = Date.now() + (parseInt(value) * 60 * 1000);
						showToast(`Время аренды установлено: ${value} минут`);
					});
					
					addButtonField(fieldsContainer, '🔄 Сделать обычным предметом', () => {
						convertRentalToNormal(inventoryItem, inventoryItemIndex);
					}, 'replace');
					
				} else {
					const canBeRented = !isItemRentalForbidden(inventoryItem, originalItem);
					
					if (canBeRented) {
						addButtonField(fieldsContainer, '⏰ Сделать арендованным', () => {
							convertToRental(inventoryItem, inventoryItemIndex);
						}, 'duplicate');
					} else {
						addInfoField(fieldsContainer, 'Тип предмета', 'Нельзя арендовать');
					}
				}
				
				addButtonField(fieldsContainer, '🔍 Найти ID предметов', () => {
					openItemIdFinder();
				}, 'duplicate');
				
				addButtonField(fieldsContainer, '🗑️ Удалить предмет', () => {
					if (true) {
						inventory.splice(inventoryItemIndex, 1);
						updateInventory();
						showToast('Предмет удален из инвентаря');
						createEditorFields(element);
					}
				}, 'delete');
				
				addButtonField(fieldsContainer, '📋 Дублировать предмет', () => {
					const duplicate = {...inventoryItem};
					if (duplicate.stickers) duplicate.stickers = [...duplicate.stickers];
					if (duplicate.charm) duplicate.charm = {...duplicate.charm};
					inventory.push(duplicate);
					updateInventory();
					showToast('Предмет продублирован');
				}, 'duplicate');
			}
		}
		
		if (element.closest('.player-profile') || element.textContent.includes('Уровень') || element.textContent.includes('Опыт') || element.id === 'profile-btn') {
			addNumberField(fieldsContainer, 'Уровень игрока', userLevel, (value) => {
				userLevel = parseInt(value);
				expToNextLevel = calculateExpToNextLevel(userLevel);
				saveGameState();
				showToast('Уровень игрока обновлен');
			});
			
			addNumberField(fieldsContainer, 'Опыт игрока', userExp, (value) => {
				userExp = parseInt(value);
				saveGameState();
				showToast('Опыт игрока обновлен');
			});
			
			addButtonField(fieldsContainer, '🖼️ Выбрать рамку', () => {
				openFrameSelectionModal();
			}, 'duplicate');
			
			if (currentFrame) {
				const frameItem = framesDatabase[currentFrame];
				if (frameItem) {
					addTextField(fieldsContainer, 'Текущая рамка (ID)', currentFrame, (value) => {});
					addTextField(fieldsContainer, 'Название рамки', frameItem.name, (value) => {});
				}
			}
		}
		
		if (element.closest('.modal-content') && document.querySelector('.modal-content h2')?.textContent?.includes('Клан')) {
			addNumberField(fieldsContainer, 'Баланс клана', userClan.balance, (value) => {
				userClan.balance = parseFloat(value);
				const balanceElement = document.querySelector('.clan-balance-display');
				if (balanceElement) balanceElement.textContent = `Баланс клана: ${userClan.balance.toLocaleString('ru-RU')} ₽`;
				saveGameState();
				showToast('Баланс клана обновлен');
			});
			
			addNumberField(fieldsContainer, 'ММР клана', userClan.stars, (value) => {
				userClan.stars = parseFloat(value);
				saveGameState();
				showToast('ММР клана обновлен');
			});
		}
		
		if (element.id === 'generate-promo-btn') {
			addNumberField(fieldsContainer, 'Задержка генерации (сек)', 30, (value) => {
				showToast(`Задержка установлена на ${value} секунд. Применится при следующей генерации.`);
			});
		}
		
		if (element.id === 'battle-pass-btn' || element.closest('.battle-pass')) {
			const battlePass = battlePassesDatabase['starter_pass'];
			if (battlePass) {
				addNumberField(fieldsContainer, 'Цена Gold Pass', battlePass.cost_gold_pass, (value) => {
					battlePass.cost_gold_pass = parseInt(value);
					showToast('Цена Gold Pass обновлена');
				});
				
				addNumberField(fieldsContainer, 'Цена 1 уровня', battlePass.levels_costs[1], (value) => {
					battlePass.levels_costs[1] = parseInt(value);
					showToast('Цена 1 уровня обновлена');
				});
			}
		}
	}
	
	function openItemIdFinder() {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.8);
			z-index: 100001;
			display: flex;
			justify-content: center;
			align-items: center;
		`;

		modal.innerHTML = `
			<div class="modal-content" style="
				background: rgba(30, 30, 30, 0.95);
				border: 2px solid gold;
				border-radius: 8px;
				width: 90%;
				max-width: 900px;
				max-height: 80vh;
				overflow: hidden;
				display: flex;
				flex-direction: column;
			">
				<div class="modal-header" style="
					padding: 15px;
					background: rgba(0,0,0,0.5);
					border-bottom: 1px solid #555;
					display: flex;
					justify-content: space-between;
					align-items: center;
				">
					<h3 style="margin: 0; color: gold;">Поиск ID предметов</h3>
					<button id="close-id-finder" style="
						background: #ff4444;
						color: white;
						border: none;
						border-radius: 4px;
						width: 30px;
						height: 30px;
						cursor: pointer;
						font-size: 18px;
					">×</button>
				</div>
				<div style="padding: 15px; display: flex; gap: 15px; margin-bottom: 15px;">
					<input type="text" id="id-search" placeholder="Поиск по названию или ID..." style="
						flex: 1;
						padding: 10px;
						background: #2a2a2a;
						border: 1px solid #555;
						border-radius: 4px;
						color: white;
					">
					<select id="id-rarity-filter" style="
						padding: 10px;
						background: #2a2a2a;
						border: 1px solid #555;
						border-radius: 4px;
						color: white;
						min-width: 150px;
					">
						<option value="all">Все редкости</option>
						${Object.keys(rarities)
							.filter(r => !['box-none', 'case-none'].includes(r))
							.map(r => `<option value="${r}">${rarities[r].name}</option>`)
							.join('')}
					</select>
				</div>
				<div style="padding: 0 15px; margin-bottom: 15px;">
					<div style="color: #aaa; font-size: 12px;">
						Нажмите на предмет чтобы скопировать его ID в буфер обмена
					</div>
				</div>
				<div id="id-items-grid" style="
					flex: 1;
					overflow-y: auto;
					padding: 15px;
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
					gap: 10px;
				">
					<!-- Предметы будут загружены здесь -->
				</div>
				<div class="modal-footer" style="
					padding: 15px;
					background: rgba(0,0,0,0.5);
					border-top: 1px solid #555;
					text-align: center;
				">
					<button id="cancel-id-finder" style="
						padding: 10px 20px;
						background: #f44336;
						color: white;
						border: none;
						border-radius: 4px;
						cursor: pointer;
						margin-right: 10px;
					">Закрыть</button>
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		loadItemsIntoIdFinder(modal);

		document.getElementById('close-id-finder').addEventListener('click', () => modal.remove());
		document.getElementById('cancel-id-finder').addEventListener('click', () => modal.remove());
		
		document.getElementById('id-search').addEventListener('input', (e) => {
			filterItemsInIdFinder(modal, e.target.value, document.getElementById('id-rarity-filter').value);
		});
		
		document.getElementById('id-rarity-filter').addEventListener('change', (e) => {
			filterItemsInIdFinder(modal, document.getElementById('id-search').value, e.target.value);
		});

		modal.addEventListener('click', (e) => {
			if (e.target === modal) {
				modal.remove();
			}
		});

		const closeOnEscape = (e) => {
			if (e.key === 'Escape') {
				modal.remove();
				document.removeEventListener('keydown', closeOnEscape);
			}
		};
		document.addEventListener('keydown', closeOnEscape);
	}

	function loadItemsIntoIdFinder(modal) {
		const itemsGrid = modal.querySelector('#id-items-grid');
		itemsGrid.innerHTML = '';

		const availableItems = itemsDatabase.filter(item => 
			!item.id.endsWith('_rental') && 
			!item.isRental && 
			item.itemInStore !== false
		);

		const sortedItems = availableItems.sort((a, b) => {
			const orderA = rarities[a.rarity]?.order || 0;
			const orderB = rarities[b.rarity]?.order || 0;
			return orderB - orderA;
		});

		sortedItems.forEach(item => {
			const itemElement = document.createElement('div');
			itemElement.className = 'selector-item';
			itemElement.style.cssText = `
				background: #2a2a2a;
				border: 2px solid ${rarities[item.rarity]?.colorHex || '#555'};
				border-radius: 8px;
				padding: 10px;
				text-align: center;
				cursor: pointer;
				transition: all 0.2s;
				min-height: 120px;
				display: flex;
				flex-direction: column;
				justify-content: space-between;
			`;
			
			itemElement.innerHTML = `
				<div style="flex: 1; display: flex; align-items: center; justify-content: center;">
					<img src="${item.image}" alt="${item.name}" style="max-width: 50px; max-height: 50px; object-fit: contain; border-radius: 4px;">
				</div>
				<div style="margin-top: 8px;">
					<div style="font-size: 11px; font-weight: bold; height: 20px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.name}</div>
					<div style="font-size: 9px; color: ${rarities[item.rarity]?.colorHex || '#aaa'}; margin-top: 2px;">${rarities[item.rarity]?.name || item.rarity}</div>
					<div style="font-size: 8px; color: gold; margin-top: 2px; font-family: monospace; background: rgba(0,0,0,0.3); padding: 2px 4px; border-radius: 2px;">${item.id}</div>
				</div>
			`;

			itemElement.addEventListener('click', () => {
				navigator.clipboard.writeText(item.id).then(() => {
					showToast(`ID "${item.id}" скопирован в буфер обмена`);
					
					itemElement.style.background = 'rgba(76, 175, 80, 0.3)';
					itemElement.style.borderColor = '#4CAF50';
					setTimeout(() => {
						itemElement.style.background = '#2a2a2a';
						itemElement.style.borderColor = rarities[item.rarity]?.colorHex || '#555';
					}, 1000);
				}).catch(() => {
					showToast('Не удалось скопировать ID', true);
				});
			});

			itemElement.addEventListener('mouseenter', () => {
				itemElement.style.transform = 'scale(1.05)';
				itemElement.style.borderColor = 'gold';
			});

			itemElement.addEventListener('mouseleave', () => {
				itemElement.style.transform = 'scale(1)';
				itemElement.style.borderColor = rarities[item.rarity]?.colorHex || '#555';
			});

			itemsGrid.appendChild(itemElement);
		});
	}

	function filterItemsInIdFinder(modal, searchTerm, rarityFilter) {
		const itemsGrid = modal.querySelector('#id-items-grid');
		const items = itemsGrid.querySelectorAll('.selector-item');
		
		items.forEach(item => {
			const itemName = item.querySelector('div').textContent.toLowerCase();
			const itemId = item.querySelector('div:nth-child(3)').textContent.toLowerCase();
			const itemRarityElement = item.querySelector('div:nth-child(2)');
			const fullText = itemRarityElement ? itemRarityElement.textContent : '';
			const lines = fullText.split('\n').map(line => line.trim()).filter(line => line);
			const itemRarity = lines.length >= 2 ? lines[1].toLowerCase().trim() : '';
			
			const matchesSearch = !searchTerm || 
								itemName.includes(searchTerm.toLowerCase()) || 
								itemId === searchTerm.toLowerCase();
			const matchesRarity = rarityFilter === 'all' || itemRarity === rarityFilter.toLowerCase();
			
			item.style.display = matchesSearch && matchesRarity ? 'flex' : 'none';
		});
	}

	function addButtonField(container, label, onClick, type = 'default') {
		const div = document.createElement('div');
		div.className = 'editor-field';
		
		let buttonClass = 'editor-button';
		if (type === 'replace') buttonClass += ' editor-button-replace';
		if (type === 'delete') buttonClass += ' editor-button-delete';
		if (type === 'duplicate') buttonClass += ' editor-button-duplicate';
		
		div.innerHTML = `
			<button class="${buttonClass}">${label}</button>
		`;
		
		const button = div.querySelector('button');
		button.addEventListener('click', onClick);
		
		container.appendChild(div);
	}

	function addTextField(container, label, value, onChange) {
		const div = document.createElement('div');
		div.className = 'editor-field';
		
		const safeValue = String(value).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		
		div.innerHTML = `
			<label>${label}:</label>
			<input type="text" value="${safeValue}" class="editor-input">
		`;
		
		const input = div.querySelector('input');
		let timeout;
		input.addEventListener('input', (e) => {
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				const processedValue = e.target.value.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
				onChange(processedValue);
			}, 500);
		});
		input.addEventListener('change', (e) => {
			const processedValue = e.target.value.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
			onChange(processedValue);
		});
		
		container.appendChild(div);
	}

	function addNumberField(container, label, value, onChange) {
		const div = document.createElement('div');
		div.className = 'editor-field';
		div.innerHTML = `
			<label>${label}:</label>
			<input type="number" value="${value}" class="editor-input">
		`;
		
		const input = div.querySelector('input');
		let timeout;
		input.addEventListener('input', (e) => {
			clearTimeout(timeout);
			timeout = setTimeout(() => onChange(parseFloat(e.target.value) || 0), 500);
		});
		input.addEventListener('change', (e) => onChange(parseFloat(e.target.value) || 0));
		
		container.appendChild(div);
	}

	function addSelectField(container, label, options, currentValue, onChange) {
		const div = document.createElement('div');
		div.className = 'editor-field';
		div.innerHTML = `
			<label>${label}:</label>
			<select class="editor-input">
				${options.map(opt => `<option value="${opt}" ${opt === currentValue ? 'selected' : ''}>${opt}</option>`).join('')}
			</select>
		`;
		
		const select = div.querySelector('select');
		select.addEventListener('change', (e) => onChange(e.target.value));
		
		container.appendChild(div);
	}

	function closeElementEditor() {
		if (elementEditor) {
			elementEditor.remove();
			elementEditor = null;
		}
		elementEditorActive = false;
		
		const tooltip = document.getElementById('selection-tooltip');
		if (tooltip) tooltip.remove();
		
		document.querySelectorAll('*').forEach(el => {
			if (el._originalOutline !== undefined) {
				el.style.outline = el._originalOutline;
				el.style.backgroundColor = el._originalBackground;
				el.style.zIndex = el._originalZIndex;
				el.style.position = el._originalPosition;
				el.style.cursor = el._originalCursor;
				delete el._originalOutline;
				delete el._originalBackground;
				delete el._originalZIndex;
				delete el._originalPosition;
				delete el._originalCursor;
			}
		});
		
		document.body.style.cursor = '';
		
		document.removeEventListener('mouseover', handleMouseOver);
		document.removeEventListener('click', handleClick);
		document.removeEventListener('keydown', handleCancel);
	}

	let handleMouseOver, handleClick, handleCancel;

	function toggleElementEditor() {
		if (elementEditorActive) {
			closeElementEditor();
		} else {
			createElementEditor();
			elementEditorActive = true;
		}
	}

	document.addEventListener('keydown', function(e) {
		if (e.altKey && (e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф')) {
			e.preventDefault();
			toggleElementEditor();
		}
		
		if (e.key === 'Escape' && elementEditorActive) {
			e.preventDefault();
			closeElementEditor();
		}
	});
	
	addRemoveStickersButtonToInventory();
	addQuickOpenButtonToInventory();

	console.log('Element Editor loaded. Press Alt+A to open editor.');
});