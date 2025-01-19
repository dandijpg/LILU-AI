/**
 * Script JavaScript untuk Chatbot AI
 *
 * Versi: 2.5
 * Tanggal: 2024-01-17
 * Penulis: Lilu.AI - Dandijpg
 */

let chatHistory = [];
let botData = null;
let currentMessage = null;
let fontSize = 14;
let fontDescription = document.getElementById('font-size-description');
const chatInput = document.getElementById('chat-input');
let userPreferences = {
  'sports': 0.3,
  'technology': 0.2,
  'weather': 0.1,
  'food': 0.1
};

document.addEventListener('DOMContentLoaded', function() {
  loadBotData().then(() => {
    loadChatHistory();
    updateFontSizeDescription();
    animateLogo();
  }).catch(error => {
    console.error('Gagal memuat data bot:', error);
    alert('Terjadi kesalahan saat memuat data chatbot. Silakan coba lagi nanti. Detail error: ' + error);
  });

  // Event listener untuk menutup welcome note
  const closeButton = document.getElementById('close-welcome');
  if (closeButton) {
    closeButton.addEventListener('click', closeWelcomeNote);
  }

  // Event listener untuk tombol kirim pesan
  document.querySelector('.chat-input-area button').addEventListener('click', sendMessage);

  // Event listener untuk tombol reset history
  document.getElementById('reset-history').addEventListener('click', resetChatHistory);

  // Event listener untuk tombol about
  document.getElementById('about-btn').addEventListener('click', showAbout);

  // Event listener untuk tombol font
  const changeFontSizeButton = document.getElementById('change-font-size');
  if (changeFontSizeButton) {
    changeFontSizeButton.addEventListener('click', toggleFontSize);
  }

  // Event untuk menangani klik pesan
  document.getElementById('chat-messages').addEventListener('click', handleMessageClick);

  // Menyembunyikan message-options saat klik di luar area pesan
  document.addEventListener('click', handleOutsideClick);

  // Event listeners untuk tombol-tombol di message-options
  document.getElementById('copy-message').addEventListener('click', copyMessage);
  document.getElementById('delete-message').addEventListener('click', deleteMessage);

  // Event listener untuk menekan "Enter"
  document.getElementById('chat-input').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  });

  // Atur ukuran font awal pada semua bubble chat
  const chatMessages = document.getElementById('chat-messages');
  const messages = chatMessages.querySelectorAll('.message');
  messages.forEach(message => {
    message.querySelector('.user, .bot').style.fontSize = fontSize + 'px';
  });

  // Event listener untuk mengubah input secara real-time
});

function closeWelcomeNote() {
  const welcomeNote = document.getElementById('welcome-note');
  if (welcomeNote) {
    welcomeNote.style.display = 'none';
  }
}

function sendMessage() {
  const input = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  let message = input.value.trim();

  if (message === '') return;

  addMessage(chatMessages, 'user', message);
  saveChatHistory();
  input.value = '';

  const typingIndicator = createTypingIndicator();
  chatMessages.appendChild(typingIndicator);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  setTimeout(() => {
    typingIndicator.remove();
    const messageWithoutPunctuation = removePunctuation(message.toLowerCase());
    const botResponse = getBotResponse(messageWithoutPunctuation);
    addMessage(chatMessages, 'bot', botResponse);
  }, 1500);
}

function getBotResponse(userMessage) {
  if (!botData) return "Saya sedang mengalami masalah dengan data saya, coba lagi nanti.";

  const normalizedMessage = normalizeString(userMessage);

  // Mengecek apakah user sedang curhat dengan menambahkan lebih banyak kata ganti
  const isCurhat = /(^|\s)(aku|saya|gue|gw|diriku|saran\s+darimu)(\s|$)/.test(normalizedMessage);

  let bestMatches = [];
  let highestSimilarity = 0;

  for (const item of botData.responses) {
    // Jika user sedang curhat, hanya proses jika tipe jawaban adalah "curhat"
    if (isCurhat && item.type === "curhat") {
      let maxSimilarity = 0;
      for (const trigger of item.trigger) {
        const cleanTrigger = normalizeString(removePunctuation(trigger.toLowerCase()));
        let similarity = calculateSimilarityWithWordOrder(normalizedMessage, cleanTrigger);

        // Sesuaikan similarity berdasarkan preferensi pengguna jika ada
        if (item.category && userPreferences[item.category]) {
          similarity *= (1 + userPreferences[item.category]);
        }
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }

      if (maxSimilarity > highestSimilarity) {
        highestSimilarity = maxSimilarity;
        bestMatches = [item];
      } else if (maxSimilarity === highestSimilarity) {
        bestMatches.push(item);
      }
    }
    // Jika user tidak sedang curhat, proses semua jenis jawaban
    else if (!isCurhat) {
      let maxSimilarity = 0;
      for (const trigger of item.trigger) {
        const cleanTrigger = normalizeString(removePunctuation(trigger.toLowerCase()));
        let similarity = calculateSimilarityWithWordOrder(normalizedMessage, cleanTrigger);

        // Sesuaikan similarity berdasarkan preferensi pengguna jika ada
        if (item.category && userPreferences[item.category]) {
          similarity *= (1 + userPreferences[item.category]);
        }
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }

      if (maxSimilarity > highestSimilarity) {
        highestSimilarity = maxSimilarity;
        bestMatches = [item];
      } else if (maxSimilarity === highestSimilarity) {
        bestMatches.push(item);
      }
    }
  }

  // Jika ada kecocokan yang ditemukan
  if (bestMatches.length > 0) {
    // Pilih jawaban secara acak jika ada lebih dari satu kecocokan
    if (bestMatches.length > 1) {
      const randomIndex = Math.floor(Math.random() * bestMatches.length);
      return bestMatches[randomIndex].content[Math.floor(Math.random() * bestMatches[randomIndex].content.length)];
    } else {
      // Jika hanya satu kecocokan, pilih satu dari beberapa content jika ada
      const match = bestMatches[0];
      return match.content[Math.floor(Math.random() * match.content.length)];
    }
  }

  // Jika tidak ada kecocokan atau user tidak curhat, gunakan jawaban dinamis
  return getDynamicResponse(userMessage);
}

function getDynamicResponse(userMessage) {
  if (userMessage.includes('halo') || userMessage.includes('hi')) {
    const greetings = [
      "Halo! Apa kabar?",
      "Selamat datang! Ada yang bisa saya bantu?",
      "Hai! Bagaimana hari ini?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  // Tambahkan lebih banyak logika untuk jawaban dinamis lainnya
  return "Maaf, saya tidak mengerti. Bisakah Anda mengulang pertanyaan Anda? atau jika nanti jawaban saya masih ngelantur berarti saya belum dilatih untuk pertanyaan yang anda ajukan. saya akan terus belajar kata-kata baru dan terus meningkatkan pengetahuan saya.";
}

function normalizeString(str) {
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

function calculateSimilarityWithWordOrder(str1, str2) {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);

  // Jika jumlah kata hanya 1, lakukan perhitungan seperti biasa
  if (words1.length === 1) {
    const similarityScore = calculateSimilarity(str1, str2);
    return similarityScore * 100; // Skala 0-100%
  }
  // Jika jumlah kata hanya 2, periksa keberadaan kata dan return 0 jika tidak ada
  else if (words1.length === 2 && words2.length === 2) {
    const word1Exists = botData.responses.some(item => item.trigger.some(trigger => normalizeString(removePunctuation(trigger.toLowerCase())).includes(words1[0])));
    const word2Exists = botData.responses.some(item => item.trigger.some(trigger => normalizeString(removePunctuation(trigger.toLowerCase())).includes(words1[1])));

    if (!word1Exists || !word2Exists) return 0;
    else { // Jika kedua kata ada, lakukan perbandingan yang lebih tepat
      //cek apakah kalimat persis sama
      if (str1 === str2) return 100;
      //jika tidak persis sama, hitung similarity
      else return calculateSimilarity(str1, str2) * 100;
    }
  }
  // Jika jumlah kata lebih dari 2 ATAU jika kalimat dua kata dan kedua kata ada, lakukan perhitungan
  else if (words1.length > 2 || (words1.length === 2 && words2.length === 2)) {
    const similarityScore = calculateSimilarity(str1, str2);
    let sequenceSimilarity = 0;
    const minLength = Math.min(words1.length, words2.length);
    for (let i = 0; i < minLength; i++) {
      if (words1[i] === words2[i]) {
        sequenceSimilarity++;
      }
    }
    const sequencePercentage = minLength > 0 ? (sequenceSimilarity / minLength) * 100 : 0;
    return (similarityScore * 0.6) + (sequencePercentage * 0.4);
  } else {
    return 0; // Jika jumlah kata kurang dari 1, return 0
  }
}

function calculateSimilarity(str1, str2) {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);

  const intersection = words1.filter(word => words2.includes(word)).length;
  const union = new Set([...words1, ...words2]).size;
  if (union === 0) return 0;
  return intersection / union;
}

function addMessage(chat, sender, message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  messageElement.id = `message-${Date.now()}`;

  const bubble = document.createElement('div');
  bubble.className = sender;
  bubble.style.fontSize = `${fontSize}px`;

  // Membuat elemen untuk pesan
  const messageContent = document.createElement('span');

  // Membuat elemen untuk timestamp
  const now = new Date();
  const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const timestampElement = document.createElement('span');
  timestampElement.className = 'timestamp';
  timestampElement.textContent = formattedTime;

  // Menambahkan pesan dan timestamp ke dalam bubble
  bubble.appendChild(messageContent);
  bubble.appendChild(timestampElement);

  messageElement.appendChild(bubble);
  chat.appendChild(messageElement);

  const previousMessage = chat.querySelector('.message:last-child');
  if (previousMessage && previousMessage.querySelector(`.${sender}`)) {
    previousMessage.classList.add('stacked');
  }

  // Jika pesan dari bot, gunakan efek mengetik dan simpan history setelah selesai
  if (sender === 'bot') {
    messageContent.textContent = ''; // Pastikan elemen kosong sebelum efek mengetik dimulai
    typingEffect(messageContent, message, () => {
      // Simpan pesan penuh ke dalam chatHistory setelah efek mengetik selesai
      chatHistory.push({ sender: sender, message: message });
      saveChatHistory(); // Simpan ke localStorage
      chat.scrollTop = chat.scrollHeight;
    });
  } else {
    // Untuk pesan pengguna, langsung set teks dan simpan history
    messageContent.textContent = message;
    chatHistory.push({ sender: sender, message: message });
    saveChatHistory(); // Simpan ke localStorage
    chat.scrollTop = chat.scrollHeight;
  }
}

function typingEffect(element, text, callback) {
  let index = 0;
  element.textContent = ''; // Mengosongkan elemen sebelum memulai efek

  function type() {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      index++;
      setTimeout(type, 50); // Kecepatan mengetik, dalam milidetik
    } else {
      if (callback) callback(); // Eksekusi callback setelah selesai mengetik
    }
  }

  type();
}

function createTypingIndicator() {
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'typing-indicator';
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    typingIndicator.appendChild(dot);
  }
  return typingIndicator;
}

function removePunctuation(str) {
  return str.replace(/[.,;!?]/g, '');
}

async function loadBotData() {
  console.log("Memulai memuat data...");
  try {
    // Menambahkan fetch untuk curhat.json
    const [response2, response3, response4, responseCurhat] = await Promise.all([
      fetch('data2.json'),
      fetch('data3.json'),
      fetch('data4.json'),
      fetch('curhat.json')
    ]);

    // Check if all responses are ok before proceeding
    if (!response2.ok || !response3.ok || !response4.ok || !responseCurhat.ok) {
      const errorMessages = [];
      if (!response2.ok) errorMessages.push(`data2.json: ${response2.status} ${response2.statusText}`);
      if (!response3.ok) errorMessages.push(`data3.json: ${response3.status} ${response3.statusText}`);
      if (!response4.ok) errorMessages.push(`data4.json: ${response4.status} ${response4.statusText}`);
      if (!responseCurhat.ok) errorMessages.push(`curhat.json: ${responseCurhat.status} ${responseCurhat.statusText}`);
      const errorMessage = errorMessages.join('\n');
      console.error('Error loading bot data:', errorMessage);
      throw new Error(errorMessage);
    }

    // Menguraikan data JSON dari masing-masing response dan menggabungkannya
    const data2 = await response2.json();
    const data3 = await response3.json();
    const data4 = await response4.json();
    const dataCurhat = await responseCurhat.json();
    botData = {
      responses: data2.responses.concat(data3.responses, data4.responses, dataCurhat.responses)
    };
    console.log("Data berhasil dimuat:", botData);
  } catch (error) {
    console.error('Error loading bot data:', error);
    alert('Terjadi kesalahan saat memuat data chatbot. Silakan coba lagi nanti. Detail error: ' + error.message);
  }
}

function loadChatHistory() {
  const chatMessages = document.getElementById('chat-messages');
  chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];

  // Hapus semua pesan yang ada di DOM sebelum memuat ulang dari localStorage
  chatMessages.innerHTML = '';

  // Loop melalui setiap item chatHistory dan tambahkan ke DOM
  chatHistory.forEach(item => {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.id = `message-${Date.now()}`;

    const bubble = document.createElement('div');
    bubble.className = item.sender;
    bubble.style.fontSize = `${fontSize}px`;

    // Membuat elemen untuk pesan
    const messageContent = document.createElement('span');
    messageContent.textContent = item.message;

    // Membuat elemen untuk timestamp
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const timestampElement = document.createElement('span');
    timestampElement.className = 'timestamp';
    timestampElement.textContent = formattedTime;

    // Menambahkan pesan dan timestamp ke dalam bubble
    bubble.appendChild(messageContent);
    bubble.appendChild(timestampElement);

    messageElement.appendChild(bubble);
    chatMessages.appendChild(messageElement);

    const previousMessage = chatMessages.querySelector('.message:last-child');
    if (previousMessage && previousMessage.querySelector(`.${item.sender}`)) {
      previousMessage.classList.add('stacked');
    }
  });

  // Jika ada pesan, tambahkan kelas 'active' ke pesan terakhir
  if (chatHistory.length > 0) {
    const lastMessage = chatMessages.querySelector('.message:last-child');
    if (lastMessage) {
      lastMessage.classList.add('active');
    }
  }
  // Scroll ke paling bawah setelah semua pesan dimuat
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function saveChatHistory() {
  const chatMessages = document.getElementById('chat-messages');
  const messages = chatMessages.querySelectorAll('.message');
  chatHistory = Array.from(messages).map(message => {
    const bubble = message.querySelector('.user, .bot');
    const messageContent = bubble.querySelector('span:not(.timestamp)').textContent.trim();
    return {
      sender: bubble.classList.contains('user') ? 'user' : 'bot',
      message: messageContent
    };
  });
  localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

function resetChatHistory() {
  if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat chat?')) {
    localStorage.removeItem('chatHistory');
    chatHistory = [];
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '';
    addMessage(chatMessages, 'bot', 'Chat history telah direset.');
    saveChatHistory();
  }
}

function showAbout() {
  const modal = document.getElementById('about-modal');
  const closeBtn = modal.querySelector('.close');
  const stars = modal.querySelectorAll('.star');
  let rating = 0;

  modal.style.display = 'block';

  stars.forEach(star => {
    star.addEventListener('click', function() {
      const value = parseInt(this.getAttribute('data-value'), 10);
      rating = value;
      stars.forEach((s, index) => {
        s.classList.toggle('selected', index < value);
      });
      document.getElementById('rating-value').textContent = rating;
    });
  });

  closeBtn.onclick = function() {
    modal.style.display = 'none';
  };

  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  };

  document.getElementById('send-feedback').addEventListener('click', function() {
    const feedback = document.getElementById('feedback-area').value;
    if (feedback && rating > 0) {
      sendEmail(feedback, rating);
    } else {
      alert('Silakan berikan feedback dan rating sebelum mengirim.');
    }
  });
}

function sendEmail(feedback, rating) {
  // Konstruksi subjek dan isi email
  const subject = encodeURIComponent(`Feedback untuk Lilu.AI - Rating: ${rating}`);
  const body = encodeURIComponent(`Rating: ${rating}\nFeedback:\n${feedback}`);

  // Buat tautan mailto
  const mailtoLink = `mailto:dandipro02@gmail.com?subject=${subject}&body=${body}`;

  // Buka klien email dengan membuat elemen anchor yang tidak terlihat dan klik pada elemen tersebut
  const a = document.createElement('a');
  a.href = mailtoLink;
  a.target = '_blank'; // Buka di tab baru
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function handleMessageClick(e) {
  const messageElement = e.target.closest('.message');
  if (messageElement) {
    currentMessage = {
      element: messageElement,
      message: messageElement.querySelector('.user, .bot').textContent
    };
    const messageOptions = document.querySelector('.message-options');
    messageOptions.style.display = 'flex';
    focusOnMessage(messageElement);
  }
}

function handleOutsideClick(e) {
  const messageOptions = document.querySelector('.message-options');
  if (!e.target.closest('.message') && !e.target.closest('.message-options')) {
    messageOptions.style.display = 'none';
    currentMessage = null;
    removeBlur();
  }
}

function focusOnMessage(focusedMessage) {
  const allMessages = document.querySelectorAll('.message');
  const chatMessages = document.getElementById('chat-messages');
  allMessages.forEach(message => {
    if (message !== focusedMessage) {
      message.classList.add('blurred');
    } else {
      message.classList.remove('blurred');
    }
  });
  chatMessages.classList.add('no-scroll');
}

function removeBlur() {
  const allMessages = document.querySelectorAll('.message');
  const chatMessages = document.getElementById('chat-messages');
  allMessages.forEach(message => {
    message.classList.remove('blurred');
  });
  chatMessages.classList.remove('no-scroll');
}

function copyMessage() {
  if (currentMessage) {
    navigator.clipboard.writeText(currentMessage.message).then(() => {
      alert('Pesan telah disalin ke clipboard.');
    });
  }
}

function deleteMessage() {
  if (currentMessage) {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.removeChild(currentMessage.element);
    saveChatHistory();
    currentMessage = null;
    document.querySelector('.message-options').style.display = 'none';
    removeBlur();
  }
}

function toggleFontSize() {
  fontSize += 2;
  if (fontSize > 20) {
    fontSize = 10;
  }
  updateFontSizeDescription();
  const chatMessages = document.getElementById('chat-messages');
  const messages = chatMessages.querySelectorAll('.message');
  messages.forEach(message => {
    message.querySelector('.user, .bot').style.fontSize = fontSize + 'px';
  });
}

function updateFontSizeDescription() {
  if (fontDescription) {
    switch (fontSize) {
      case 10:
        fontDescription.textContent = 'Font 1';
        break;
      case 12:
        fontDescription.textContent = 'Font 2';
        break;
      case 14:
        fontDescription.textContent = 'Font 3';
        break;
      case 16:
        fontDescription.textContent = 'Font 4';
        break;
      case 18:
        fontDescription.textContent = 'Font 5';
        break;
      case 20:
        fontDescription.textContent = 'Font 6';
        break;
    }
  }
}

function animateLogo() {
  const liluSvg = document.getElementById('lilu-svg');
  const colors = ['white', '#D21F3C'];
  let currentGradient = 0;

  function changeGradient() {
    const gradient = `linear-gradient(to bottom, ${colors[currentGradient]}, ${colors[1 - currentGradient]})`;
    liluSvg.style.fill = gradient;
    currentGradient = 1 - currentGradient;
  }

  setInterval(changeGradient, 1000);
}