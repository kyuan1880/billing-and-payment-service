const log = require('../../logging')
const { Invoice, PaymentInfo } = require('../../domain/invoice')
const db = require('../../db')
module.exports = require('express').Router()

  .post('/ethereum/sync', async (req, res) => {
    const comfirms = req.query.minimumConfirms
    const timeout = req.query.waitingFor
    const o = req.body
    log.debug({ req, reqBody: req.body }, 'new purchase request')

    if (!o.paymentInfo.txId) return res.sendStatus(400).send('transaction id is missing')

    let invoice = null
    let id = null

    const exist = await db.invoice.findOneByTxId(o.paymentInfo.txId)
    if (!exist) {
      const paymentInfo = new PaymentInfo(o.paymentInfo.txId, 'ethereum', o.paymentInfo.currency, o.paymentInfo.unit, o.paymentInfo.amount, o.paymentInfo.from, o.paymentInfo.to)
      invoice = new Invoice(paymentInfo, o.items, o.totalAmountPaid, o.note)
      id = await db.invoice.save(invoice)
    } else {
      log.info('invoice of transaction id: $s already exist, confirming payment status')
      invoice = Invoice.from(exist)
      id = exist._id
    }

    log.info('new invoice charging: %s', invoice)
    if (await invoice.confirms(comfirms, timeout) && await db.invoice.updateById(id, invoice)) {
      return res.send(await db.invoice.findOneById(id))
    } else {
      return res.status(400).send({
        invoice,
        error: 'Invoice created but transaction confirmation failed'
      })
    }
  })