(function (win, doc) {

    'use strict';

    var cv = doc.getElementById('cv'),
        gl = $gl.getGLContext(cv),
        w = win.innerWidth,
        h = win.innerHeight;

    cv.width = w;
    cv.height = h;

    $gl.setViewport(0, 0, w, h);
    $gl.setClearColor(0.1, 0.1, 0.1, 1.0);

    var prg = $gl.setupProgram({
        vertexShader: $gl.getShaderSourceFromDOM('vs'),
        fragmentShader: $gl.getShaderSourceFromDOM('fs') 
    });

    var position = [
        -1.0,  1.0, 0.0, //v0
        -1.0, -1.0, 0.0, //v1
         1.0, -1.0, 0.0, //v2
         1.0,  1.0, 0.0  //v3
    ];
    var colors = [
        1.0, 0.0, 0.0, 1.0, //v0
        0.0, 1.0, 0.0, 1.0, //v1
        0.0, 0.0, 1.0, 1.0, //v2
        1.0, 0.0, 0.0, 1.0  //v3
    ];
    var tex_coords = [
        0.0, 0.0, //v0
        0.0, 1.0, //v1
        1.0, 1.0, //v2
        1.0, 0.0  //v0
    ];

    var indecies = [
        0, 1, 2, 0, 2, 3
    ];

    var vbo = $gl.createBuffer($gl.ARRAY_BUFFER, position);
    var ibo = $gl.createBuffer($gl.ELEMENT_ARRAY_BUFFER, indecies);
    var color_vbo = $gl.createBuffer($gl.ARRAY_BUFFER, colors);
    var tex_coord_vbo = $gl.createBuffer($gl.ARRAY_BUFFER, tex_coords);

    var texture = $gl.setupTexture('texture.jpg');

    var attLoc = gl.getAttribLocation(prg, 'a_position');
    var attLoc2 = gl.getAttribLocation(prg, 'a_color');
    var attLoc3 = gl.getAttribLocation(prg, 'a_texCoord');

    var uniLoc = gl.getUniformLocation(prg, 'u_mvpMatrix');
    var uniLoc2 = gl.getUniformLocation(prg, 'u_texture');

    gl.enableVertexAttribArray(attLoc);
    gl.enableVertexAttribArray(attLoc2);
    gl.enableVertexAttribArray(attLoc3);

    var angle = 0;
    var z = 10;

    var mouse = {
        x: 0,
        y: 0
    };

    var cnt = 0;

    var SCREEN_WIDTH = win.innerWidth;
    var SCREEN_HEIGHT = win.innerHeight;

    cv.addEventListener('mousemove', function (e) {
        mouse.x =  (e.pageX / w) * 2 - 1;
        mouse.y = -(e.pageY / h) * 2 + 1;
    });

    //プロジェクション変換マトリクスの生成
    var projMatrix = mat4.perspective(60, w / h, 1, 100, mat4());

    //ビュー座標変換マトリクスの生成
    var viewMatrix = mat4.lookAt(vec3(0, 0, z), vec3(0, 0, 0), vec3(0, 1, 0));

    var autoPlay = true;
    function loop() {
        //モデル変換マトリクスを生成
        var modelMatrix = mat4();

        //最終的に使用されるMVP用マトリクスを生成
        var mvpMatrix   = mat4();

        angle = (angle + 1) % 360;
        //var qt = quat.rotate(angle * Math.PI / 180, vec3(0, 1, 0));
        //var qt2 = quat.rotate(angle * Math.PI / 180, vec3(1, 0, 0));
        //quat.multiply(qt, qt2, qt);
        //quat.toMat(qt, modelMatrix);
        //mat4.scale(modelMatrix, vec3(5, 5, 5), modelMatrix);
        mat4.multiply(projMatrix, viewMatrix, mvpMatrix);
        mat4.multiply(mvpMatrix, modelMatrix, mvpMatrix);

        var pos = vec3(mouse.x, mouse.y, 0);
        var invProjMatrix = mat4.inverse(projMatrix);
        var invViewMatrix = mat4.inverse(viewMatrix);
        var pvmMatrix = mat4();

        mat4.multiply(invViewMatrix, invProjMatrix, pvmMatrix);
        vec3.applyProjection(pos, pvmMatrix, pos);


        /*! ----------------------------------------------------------------------------------
         * draw**を呼び出す前に、そのdrawメソッドで使用するバッファ、
         * テクスチャなどをすべて有効化、バインドしておく。
         * ---------------------------------------------------------------------------------- */

        position[0] = pos[0];
        position[1] = pos[1];
        position[2] = pos[2];
        vbo = $gl.createBuffer($gl.ARRAY_BUFFER, position);

        //頂点位置バッファをバインド
        $gl.setupBuffer({
            buffer: vbo,
            index: attLoc,
            size: 3
        }); 

        //頂点色バッファをバインド
        $gl.setupBuffer({
            buffer: color_vbo,
            index: attLoc2,
            size: 4
        });

        //頂点テクスチャ座標バッファをバインド
        $gl.setupBuffer({
            buffer: tex_coord_vbo,
            index: attLoc3,
            size: 2
        });

        //インデックスバッファをバインド
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

        //使用するテクスチャをバインド・有効化
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uniLoc2, texture);

        //最終的なMVPマトリクスをアップロード
        gl.uniformMatrix4fv(uniLoc, false, mvpMatrix);

        //色をクリア
        gl.clear(gl.COLOR_BUFFER_BIT);

        //上記で設定された情報を使ってドロー
        //gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.drawElements(gl.TRIANGLES, indecies.length, gl.UNSIGNED_SHORT, 0);
        gl.flush();

        //アニメーションを実行するためにループ呼び出し
        autoPlay && requestAnimFrame(loop);
    }

    doc.addEventListener('click', loop, false);

    loop();

    doc.addEventListener('mousewheel', function (e) {
        z += e.wheelDelta / 100;
    }, false);

    doc.addEventListener('DOMMouseScroll', function (e) {
        z += e.detail / 10;
    }, false);

}(window, document));

