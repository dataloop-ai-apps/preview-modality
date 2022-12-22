import { isVNode, ref } from "vue";

import * as PDFJSlib from "pdfjs-dist/build/pdf";
import PDFJSWorker from "pdfjs-dist/build/pdf.worker.entry";

PDFJSlib.GlobalWorkerOptions.workerSrc = PDFJSWorker;

/** 
 * @typedef {Object} UsePDFParameters 
 * @property {string} password
 * Document password to unlock content
 * @property {function} onProgress
 * Callback to request a password if a wrong or no password was provided. The callback receives two parameters: a function that should be called with the new password, and a reason (see PasswordResponses). 
 * @property {function} onPassword 
 * Callback to be able to monitor the loading progress of the PDF file (necessary to implement e.g. a loading bar). The callback receives an OnProgressParameters argument. if this function is used option.password is ignored
 * @property {function} onError
 * Callback to be able to handle errors during loading 
 * */

/**
 * 
 * @param {string | URL | TypedArray | PDFDataRangeTransport | DocumentInitParameters} src
 * Can be a URL where a PDF file is located, a typed array (Uint8Array) already populated with data, or a parameter object.
 * @param {UsePDFParameters} options
 * UsePDF object parameters
 */
export default function usePDF(src, options = {
  onProgress: undefined,
  onPassword: undefined,
  onError: undefined,
  password: ''
}) {
  const pdf = ref();
  const pages = ref(0);
  const info = ref({
    metadata: {},
    attachments: {},
    javascript: {}
  })

  // Add httpHeader options for fetching pdf from dataloop.ai
  // See, https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html#~DocumentInitParameters
  const options = {}

  const loadingTask = PDFJSlib.getDocument(src, options)
  loadingTask.onProgress = options?.onProgress
  loadingTask.onPassword = options?.onPassword
    ? options.onPassword : options.password
      ? (updatePassword, _) => {
        updatePassword(options.password)
      } : undefined

  loadingTask.promise.then((doc) => {
    pdf.value = doc.loadingTask;
    pages.value = doc.numPages;
    doc.getMetadata().then(data => {
      info.value.metadata = data
    })
    doc.getAttachments().then(data => {
      info.value.attachments = data
    })
    doc.getJavaScript().then(data => {
      info.value.javascript = data
    })
  }, (reason) => {
    // PDF loading error
    if (typeof options.onError === 'function') {
      options.onError(reason)
    }
  });

  return {
    pdf,
    pages,
    info
  };
}