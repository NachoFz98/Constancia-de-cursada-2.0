const form = document.getElementById("certificateForm");
const preview = document.getElementById("preview");
const programTypeField = document.getElementById("programType");
const classDaysWrapper = document.getElementById("classDaysWrapper");
const classDaysInputs = Array.from(
  document.querySelectorAll("input[name='classDays']"),
);

const COMPANY_CONFIG = {
  companyName: "EMPRESA_PLACEHOLDER",
  directorName: "Nombre y apellido del Director",
  websiteUrl: "https://www.empresa-placeholder.com",
  addressLine: "Direccion de empresa placeholder 123, Buenos Aires, Argentina",
  logoPath: "./banner-argentina.png",
  signaturePath: "",
  pdfLayout: {
    marginX: 52,
    bannerHeight: 100,
    bannerWidthRatio: 0.75,
    signatureWidth: 180,
    signatureHeight: 28,
  },
};

const monthNames = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function formatDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} de ${month} de ${year}`;
}

function getProgramIntro(programType, programName) {
  if (programType === "carrera") {
    return `la Carrera de ${programName}`;
  }
  if (programType === "diplomatura") {
    return `la Diplomatura de ${programName}`;
  }
  if (programType === "workshop") {
    return `el Workshop de ${programName}`;
  }
  return `el Curso de ${programName}`;
}

function getStudentNoun(gender) {
  return gender === "femenino" ? "nuestra estudiante" : "nuestro estudiante";
}

function getEnrolledWord(gender) {
  return gender === "femenino" ? "inscripta" : "inscripto";
}

function getDaysSentence(programType, classDays) {
  const normalizedDays = formatDaysForSentence(classDays);
  if (programType === "diplomatura") {
    return `con días de cursada los ${normalizedDays}`;
  }
  return `con día de cursada los ${normalizedDays}`;
}

function formatDaysForSentence(classDays) {
  const pluralMap = {
    sabado: "sábados",
    sábado: "sábados",
    domingo: "domingos",
  };

  return classDays
    .split(",")
    .map((day) => day.trim().toLowerCase())
    .filter(Boolean)
    .map((day) => pluralMap[day] || day)
    .join(", ");
}

function formatTimeWithHour(timeValue) {
  return `${timeValue}h`;
}

function isActiveEnrollment(issueDate, endDate) {
  const issue = new Date(`${issueDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(issue.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }
  return end >= issue;
}

function buildCertificateText(data) {
  const studentNoun = getStudentNoun(data.gender);
  const enrolledWord = getEnrolledWord(data.gender);
  const programIntro = getProgramIntro(data.programType, data.programName);
  const daysSentence = getDaysSentence(data.programType, data.classDays);
  const activeEnrollment = isActiveEnrollment(data.issueDate, data.endDate);

  const bodyText = activeEnrollment
    ? `Por medio de la presente, se deja constancia de que ${studentNoun} ${data.fullName}, con número de ${data.idType} ${data.idNumber}, se encuentra ${enrolledWord} en ${programIntro}, con fecha de inicio el ${formatDate(data.startDate)} y finalización el ${formatDate(data.endDate)}, ${daysSentence} en el horario de ${formatTimeWithHour(data.classStartTime)} a ${formatTimeWithHour(data.classEndTime)} (hora argentina).`
    : `Por medio de la presente, se deja constancia de que ${studentNoun} ${data.fullName}, con número de ${data.idType} ${data.idNumber}, realizó ${programIntro} con fecha de inicio el ${formatDate(data.startDate)} y finalización el ${formatDate(data.endDate)}, ${daysSentence} en el horario de ${formatTimeWithHour(data.classStartTime)} a ${formatTimeWithHour(data.classEndTime)} (hora argentina).`;

  return [
    `Buenos Aires, ${formatDate(data.issueDate)}`,
    "",
    bodyText,
  ].join("\n");
}

function getFormData() {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  data.classDays = getSelectedClassDays(data.programType);
  return data;
}

function getSelectedClassDays(programType) {
  const selectedDays = classDaysInputs
    .filter((item) => item.checked)
    .map((item) => item.value);
  if (programType !== "diplomatura") {
    return selectedDays.slice(0, 1).join(", ");
  }
  return selectedDays.join(", ");
}

function updateDaysLegend() {
  const currentType = programTypeField.value;
  const legend = classDaysWrapper.querySelector("legend");
  legend.textContent =
    currentType === "diplomatura"
      ? "Días de cursada (podés elegir varios)"
      : "Día de cursada (podés elegir solo uno)";
}

function enforceDaySelectionRules(lastChangedInput) {
  if (programTypeField.value === "diplomatura") {
    return;
  }

  const checked = classDaysInputs.filter((input) => input.checked);
  if (checked.length > 1 && lastChangedInput?.checked) {
    classDaysInputs.forEach((input) => {
      if (input !== lastChangedInput) {
        input.checked = false;
      }
    });
  }
}

function updatePreview() {
  const data = getFormData();
  if (!data.fullName || !data.issueDate) {
    preview.textContent = "Completá el formulario para ver la vista previa.";
    return;
  }
  preview.textContent = buildCertificateText(data);
}

function safeFileName(email) {
  return (email || "constancia")
    .toLowerCase()
    .replace(/[^a-z0-9@._-]+/g, "_")
    .replace(/_+/g, "_");
}

async function loadImageDataUrl(imagePath) {
  const response = await fetch(imagePath);
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getImageFormatFromDataUrl(dataUrl) {
  if (typeof dataUrl !== "string") {
    return "PNG";
  }
  if (dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg")) {
    return "JPEG";
  }
  return "PNG";
}

async function generatePdf(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  const marginX = COMPANY_CONFIG.pdfLayout.marginX;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 40;

  try {
    const logoDataUrl = await loadImageDataUrl(COMPANY_CONFIG.logoPath);
    const bannerWidth = pageWidth * COMPANY_CONFIG.pdfLayout.bannerWidthRatio;
    const bannerHeight = COMPANY_CONFIG.pdfLayout.bannerHeight;
    const bannerX = (pageWidth - bannerWidth) / 2;
    doc.addImage(
      logoDataUrl,
      getImageFormatFromDataUrl(logoDataUrl),
      bannerX,
      y,
      bannerWidth,
      bannerHeight,
    );
  } catch (err) {
    // Si no carga el logo, seguimos para no bloquear la generacion.
  }

  y += 130;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  const text = buildCertificateText(data);
  const wrapped = doc.splitTextToSize(text, 495);
  const lineHeight = 17;
  doc.text(wrapped, marginX, y);

  const textBottomY = y + (wrapped.length - 1) * lineHeight;
  const signatureLineY = Math.min(textBottomY + 44, 690);
  const signatureWidth = COMPANY_CONFIG.pdfLayout.signatureWidth;
  const signatureX = (pageWidth - signatureWidth) / 2;
  const directorY = signatureLineY + 36;
  const footerY = 760;

  try {
    if (COMPANY_CONFIG.signaturePath) {
      const signatureDataUrl = await loadImageDataUrl(COMPANY_CONFIG.signaturePath);
      doc.addImage(
        signatureDataUrl,
        getImageFormatFromDataUrl(signatureDataUrl),
        pageWidth / 2 - COMPANY_CONFIG.pdfLayout.signatureWidth / 2,
        signatureLineY - COMPANY_CONFIG.pdfLayout.signatureHeight - 8,
        COMPANY_CONFIG.pdfLayout.signatureWidth,
        COMPANY_CONFIG.pdfLayout.signatureHeight,
      );
    } else {
      doc.setDrawColor(150);
      doc.line(signatureX, signatureLineY, signatureX + signatureWidth, signatureLineY);
    }
  } catch (err) {
    doc.setDrawColor(150);
    doc.line(signatureX, signatureLineY, signatureX + signatureWidth, signatureLineY);
  }

  doc.text(COMPANY_CONFIG.directorName, pageWidth / 2, directorY, {
    align: "center",
  });
  doc.text(`${COMPANY_CONFIG.companyName}`, pageWidth / 2, footerY, {
    align: "center",
  });
  doc.text(`${COMPANY_CONFIG.addressLine}`, pageWidth / 2, footerY + 16, {
    align: "center",
  });
  doc.setTextColor(21, 94, 239);
  const websiteWidth = doc.getTextWidth(COMPANY_CONFIG.websiteUrl);
  const websiteX = (pageWidth - websiteWidth) / 2;
  doc.textWithLink(COMPANY_CONFIG.websiteUrl, websiteX, footerY + 32, {
    url: COMPANY_CONFIG.websiteUrl,
  });

  doc.save(`${safeFileName(data.email)}.pdf`);
}

programTypeField.addEventListener("change", () => {
  updateDaysLegend();
  enforceDaySelectionRules();
  updatePreview();
});

classDaysInputs.forEach((input) => {
  input.addEventListener("change", (event) => {
    enforceDaySelectionRules(event.target);
    updatePreview();
  });
});

form.addEventListener("input", updatePreview);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = getFormData();
  if (!data.classDays) {
    alert("Seleccioná al menos un día de cursada.");
    return;
  }
  if (data.programType !== "diplomatura" && data.classDays.includes(",")) {
    alert("Para curso, carrera o workshop solo podés seleccionar un día.");
    return;
  }
  if (data.classStartTime >= data.classEndTime) {
    alert("El horario de fin debe ser posterior al horario de inicio.");
    return;
  }
  await generatePdf(data);
});

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");
form.issueDate.value = `${yyyy}-${mm}-${dd}`;
form.classStartTime.value = "19:00";
form.classEndTime.value = "21:00";

updateDaysLegend();
updatePreview();
