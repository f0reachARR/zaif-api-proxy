let nonce = localStorage.getItem('ext_nonce') || 1000;

function check() {
    if (!localStorage.getItem('api_key') || !localStorage.getItem('api_secret')) {
        alert('You must set API key & secret');
        return false;
    }
    return true;
}

function makeParam(data) {
    return Object.keys(data).sort().map(key => `${key}=${data[key]}`).join('&');
}

function calcSignature(data) {
    const hmac = new jsSHA('SHA-512', 'TEXT');
    hmac.setHMACKey(localStorage.getItem('api_secret'), 'TEXT');
    hmac.update(data);
    localStorage.setItem('ext_nonce', nonce);
    return hmac.getHMAC('HEX');
}

trade.exchange_ajax_trade_form = (endpoint, button, pair) => {
    if (!check()) return;
    const form = $(button.form).addClass('sending');
    button.disabled = true;
    var comBoxes = $(".nav-tabs > li > a", ".commission-box");
    comBoxes.each(function () {
        $(this).addClass("disabled").on("click", function (a) {
            return false;
        });
    });
    const price = $('[name="price"]', form).val();
    const action = $('[name="action"]', form).val();
    const amount = $('[name="amount"]', form).val();
    const limit = $('[name="limit"]', form).val();
    const currency_pair = $('[name="currency_pair"]', form).val();
    let tradeParam = { nonce: ++nonce, method: 'trade', price, action, currency_pair, amount };
    if (limit) tradeParam['limit'] = limit;
    const body = makeParam(tradeParam);
    const signature = calcSignature(body);
    console.log(body, signature);
    fetch('https://api.zaif.jp/tapi', {
        method: 'POST', body, headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Key': localStorage.getItem('api_key'),
            'Sign': signature
        }
    }).then(res => res.json()).then(json => {
        trade.exchange_show_toast(json.success === 1 ? "success" : "danger", trade.translation_order, json.error || `Success: ID=${json.return.order_id}`);
        trade.exchange_update_user_status(pair);
        form.removeClass("sending");
        button.disabled = false;
        comBoxes.each(function () {
            $(this).removeClass("disabled").off("click");
        });
    }).catch(() => {
        form.removeClass("sending");
        button.disabled = false;
        comBoxes.each(function () {
            $(this).removeClass("disabled").off("click");
        });
    });
}

(() => {
    setInterval(() => {
        $('.cancel-order-btn:not(.ext)').each((i, elem) => {
            $(elem).addClass('ext').parent().append($('<button>').addClass('btn btn-danger btn-xs').attr({
                'data-id': $(elem).attr('data-id')
            }).text('取消2').click(function () {
                if (!check()) return;
                console.log($(this).attr('data-id'));
                if (!confirm('Are you sure?')) return;
                const orderId = parseInt($(this).attr('data-id'), 10);
                let tradeParam = { nonce: ++nonce, method: 'cancel_order', order_id: orderId };
                const body = makeParam(tradeParam);
                const signature = calcSignature(body);
                console.log(body, signature);
                fetch('https://api.zaif.jp/tapi', {
                    method: 'POST', body, headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Key': localStorage.getItem('api_key'),
                        'Sign': signature
                    }
                }).then(res => res.json()).then(json => {
                    trade.exchange_update_user_status(trade.currency_pair)
                    trade.exchange_show_toast_fixed(json.success === 1 ? "success" : "danger", trade.translation_order, json.error || 'Canceled');
                }).catch(data => {
                    alert('ERROR ' + data);
                });
            }));
        });
    }, 100);
    $('.nav.navbar-nav').append($('<li>').append($('<a href="#">').text('Set Keys(E)').click(() => {
        const modal = `
<div class='modal fade'>
<div class='modal-dialog'>
<div class='modal-content'>
<div class='modal-body'>
<label>API Key</label>
<input id='api_key' class='form-control'/>
<label>API Secret</label>
<input id='api_secret' class='form-control'/>
<button class='btn btn-success'>OK</button>
</div>
</div>
</div>
</div>`;
        const elem = $(modal).appendTo($('body')).modal('show');
        $('button', elem).click(() => {
            localStorage.setItem('api_key', $('#api_key', elem).val());
            localStorage.setItem('api_secret', $('#api_secret', elem).val());
            $(elem).modal('hide');
        });
    })));
})();