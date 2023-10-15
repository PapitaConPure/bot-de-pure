
namespace CommandBuilder {
	partial class FPrincipal {
		/// <summary>
		/// Variable del diseñador necesaria.
		/// </summary>
		private System.ComponentModel.IContainer components = null;

		/// <summary>
		/// Limpiar los recursos que se estén usando.
		/// </summary>
		/// <param name="disposing">true si los recursos administrados se deben desechar; false en caso contrario.</param>
		protected override void Dispose(bool disposing) {
			if(disposing && (components != null)) {
				components.Dispose();
			}
			base.Dispose(disposing);
		}

		#region Código generado por el Diseñador de Windows Forms

		/// <summary>
		/// Método necesario para admitir el Diseñador. No se puede modificar
		/// el contenido de este método con el editor de código.
		/// </summary>
		private void InitializeComponent() {
			System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle26 = new System.Windows.Forms.DataGridViewCellStyle();
			System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle30 = new System.Windows.Forms.DataGridViewCellStyle();
			System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle27 = new System.Windows.Forms.DataGridViewCellStyle();
			System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle28 = new System.Windows.Forms.DataGridViewCellStyle();
			System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle29 = new System.Windows.Forms.DataGridViewCellStyle();
			this.pnlMetadatos = new System.Windows.Forms.Panel();
			this.pnlContenidoMetadatos = new System.Windows.Forms.Panel();
			this.panel1 = new System.Windows.Forms.Panel();
			this.pnlEtiquetas = new System.Windows.Forms.Panel();
			this.tlpEtiquetas = new System.Windows.Forms.TableLayoutPanel();
			this.cbEtiquetaMeme = new System.Windows.Forms.CheckBox();
			this.cbEtiquetaCommon = new System.Windows.Forms.CheckBox();
			this.cbEtiquetaMod = new System.Windows.Forms.CheckBox();
			this.cbEtiquetaEmote = new System.Windows.Forms.CheckBox();
			this.cbEtiquetaPapa = new System.Windows.Forms.CheckBox();
			this.lblEtiquetas = new System.Windows.Forms.Label();
			this.pnlOpciones = new System.Windows.Forms.Panel();
			this.dgvOpciones = new System.Windows.Forms.DataGridView();
			this.Opción = new System.Windows.Forms.DataGridViewTextBoxColumn();
			this.Nombre = new System.Windows.Forms.DataGridViewTextBoxColumn();
			this.Tipo = new System.Windows.Forms.DataGridViewTextBoxColumn();
			this.tlpBotonesOpciones = new System.Windows.Forms.TableLayoutPanel();
			this.btnAgregarBandera = new ControLib.SleekButton();
			this.btnAgregarParámetro = new ControLib.SleekButton();
			this.lblOpciones = new System.Windows.Forms.Label();
			this.pnlDescripción = new System.Windows.Forms.Panel();
			this.tbDescripción = new ControLib.SleekTextBox();
			this.lblDescripción = new System.Windows.Forms.Label();
			this.pnlAlias = new System.Windows.Forms.Panel();
			this.tbNuevoAlias = new ControLib.SleekTextBox();
			this.btnNuevoAlias = new ControLib.SleekButton();
			this.pnlNombre = new System.Windows.Forms.Panel();
			this.tbNombre = new ControLib.SleekTextBox();
			this.lblNombre = new System.Windows.Forms.Label();
			this.pnlTítuloMetadatos = new System.Windows.Forms.Panel();
			this.lblMetadatos = new System.Windows.Forms.Label();
			this.btnGenerar = new ControLib.SleekButton();
			this.sflComando = new System.Windows.Forms.SaveFileDialog();
			this.cbEtiquetaChaos = new System.Windows.Forms.CheckBox();
			this.cbEtiquetaGame = new System.Windows.Forms.CheckBox();
			this.cbEtiquetaOutdated = new System.Windows.Forms.CheckBox();
			this.cbEtiquetaMaintenance = new System.Windows.Forms.CheckBox();
			this.cbEtiquetaGuide = new System.Windows.Forms.CheckBox();
			this.cbEtiquetaHourai = new System.Windows.Forms.CheckBox();
			this.pnlMetadatos.SuspendLayout();
			this.pnlContenidoMetadatos.SuspendLayout();
			this.pnlEtiquetas.SuspendLayout();
			this.tlpEtiquetas.SuspendLayout();
			this.pnlOpciones.SuspendLayout();
			((System.ComponentModel.ISupportInitialize)(this.dgvOpciones)).BeginInit();
			this.tlpBotonesOpciones.SuspendLayout();
			this.pnlDescripción.SuspendLayout();
			this.pnlAlias.SuspendLayout();
			this.pnlNombre.SuspendLayout();
			this.pnlTítuloMetadatos.SuspendLayout();
			this.SuspendLayout();
			// 
			// pnlMetadatos
			// 
			this.pnlMetadatos.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(18)))), ((int)(((byte)(18)))), ((int)(((byte)(18)))));
			this.pnlMetadatos.Controls.Add(this.pnlContenidoMetadatos);
			this.pnlMetadatos.Controls.Add(this.pnlTítuloMetadatos);
			this.pnlMetadatos.Dock = System.Windows.Forms.DockStyle.Left;
			this.pnlMetadatos.Location = new System.Drawing.Point(0, 0);
			this.pnlMetadatos.Name = "pnlMetadatos";
			this.pnlMetadatos.Size = new System.Drawing.Size(297, 544);
			this.pnlMetadatos.TabIndex = 0;
			// 
			// pnlContenidoMetadatos
			// 
			this.pnlContenidoMetadatos.AutoScroll = true;
			this.pnlContenidoMetadatos.Controls.Add(this.panel1);
			this.pnlContenidoMetadatos.Controls.Add(this.pnlEtiquetas);
			this.pnlContenidoMetadatos.Controls.Add(this.pnlOpciones);
			this.pnlContenidoMetadatos.Controls.Add(this.pnlDescripción);
			this.pnlContenidoMetadatos.Controls.Add(this.pnlAlias);
			this.pnlContenidoMetadatos.Controls.Add(this.pnlNombre);
			this.pnlContenidoMetadatos.Dock = System.Windows.Forms.DockStyle.Fill;
			this.pnlContenidoMetadatos.Location = new System.Drawing.Point(0, 45);
			this.pnlContenidoMetadatos.Name = "pnlContenidoMetadatos";
			this.pnlContenidoMetadatos.Padding = new System.Windows.Forms.Padding(12, 8, 12, 8);
			this.pnlContenidoMetadatos.Size = new System.Drawing.Size(297, 499);
			this.pnlContenidoMetadatos.TabIndex = 3;
			// 
			// panel1
			// 
			this.panel1.Dock = System.Windows.Forms.DockStyle.Top;
			this.panel1.Location = new System.Drawing.Point(12, 601);
			this.panel1.Name = "panel1";
			this.panel1.Size = new System.Drawing.Size(256, 6);
			this.panel1.TabIndex = 5;
			// 
			// pnlEtiquetas
			// 
			this.pnlEtiquetas.Controls.Add(this.tlpEtiquetas);
			this.pnlEtiquetas.Controls.Add(this.lblEtiquetas);
			this.pnlEtiquetas.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlEtiquetas.Location = new System.Drawing.Point(12, 434);
			this.pnlEtiquetas.Name = "pnlEtiquetas";
			this.pnlEtiquetas.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlEtiquetas.Size = new System.Drawing.Size(256, 167);
			this.pnlEtiquetas.TabIndex = 4;
			// 
			// tlpEtiquetas
			// 
			this.tlpEtiquetas.ColumnCount = 2;
			this.tlpEtiquetas.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 50F));
			this.tlpEtiquetas.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 50F));
			this.tlpEtiquetas.Controls.Add(this.cbEtiquetaHourai, 1, 4);
			this.tlpEtiquetas.Controls.Add(this.cbEtiquetaMaintenance, 0, 3);
			this.tlpEtiquetas.Controls.Add(this.cbEtiquetaOutdated, 0, 3);
			this.tlpEtiquetas.Controls.Add(this.cbEtiquetaMeme, 1, 1);
			this.tlpEtiquetas.Controls.Add(this.cbEtiquetaCommon, 0, 0);
			this.tlpEtiquetas.Controls.Add(this.cbEtiquetaMod, 1, 0);
			this.tlpEtiquetas.Controls.Add(this.cbEtiquetaEmote, 0, 1);
			this.tlpEtiquetas.Controls.Add(this.cbEtiquetaChaos, 0, 2);
			this.tlpEtiquetas.Controls.Add(this.cbEtiquetaGame, 1, 2);
			this.tlpEtiquetas.Controls.Add(this.cbEtiquetaGuide, 0, 5);
			this.tlpEtiquetas.Controls.Add(this.cbEtiquetaPapa, 0, 4);
			this.tlpEtiquetas.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tlpEtiquetas.Location = new System.Drawing.Point(0, 15);
			this.tlpEtiquetas.Name = "tlpEtiquetas";
			this.tlpEtiquetas.RowCount = 6;
			this.tlpEtiquetas.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Percent, 16.66583F));
			this.tlpEtiquetas.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Percent, 16.66583F));
			this.tlpEtiquetas.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Percent, 16.66583F));
			this.tlpEtiquetas.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Percent, 16.66583F));
			this.tlpEtiquetas.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Percent, 16.67083F));
			this.tlpEtiquetas.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Percent, 16.66583F));
			this.tlpEtiquetas.Size = new System.Drawing.Size(256, 146);
			this.tlpEtiquetas.TabIndex = 0;
			// 
			// cbEtiquetaMeme
			// 
			this.cbEtiquetaMeme.AutoSize = true;
			this.cbEtiquetaMeme.Font = new System.Drawing.Font("Segoe UI Semibold", 9F);
			this.cbEtiquetaMeme.Location = new System.Drawing.Point(131, 27);
			this.cbEtiquetaMeme.Name = "cbEtiquetaMeme";
			this.cbEtiquetaMeme.Size = new System.Drawing.Size(60, 18);
			this.cbEtiquetaMeme.TabIndex = 3;
			this.cbEtiquetaMeme.Text = "MEME";
			this.cbEtiquetaMeme.UseVisualStyleBackColor = true;
			// 
			// cbEtiquetaCommon
			// 
			this.cbEtiquetaCommon.AutoSize = true;
			this.cbEtiquetaCommon.Checked = true;
			this.cbEtiquetaCommon.CheckState = System.Windows.Forms.CheckState.Checked;
			this.cbEtiquetaCommon.Font = new System.Drawing.Font("Segoe UI Semibold", 9F);
			this.cbEtiquetaCommon.Location = new System.Drawing.Point(3, 3);
			this.cbEtiquetaCommon.Name = "cbEtiquetaCommon";
			this.cbEtiquetaCommon.Size = new System.Drawing.Size(82, 18);
			this.cbEtiquetaCommon.TabIndex = 0;
			this.cbEtiquetaCommon.Text = "COMMON";
			this.cbEtiquetaCommon.UseVisualStyleBackColor = true;
			// 
			// cbEtiquetaMod
			// 
			this.cbEtiquetaMod.AutoSize = true;
			this.cbEtiquetaMod.Font = new System.Drawing.Font("Segoe UI Semibold", 9F);
			this.cbEtiquetaMod.Location = new System.Drawing.Point(131, 3);
			this.cbEtiquetaMod.Name = "cbEtiquetaMod";
			this.cbEtiquetaMod.Size = new System.Drawing.Size(55, 18);
			this.cbEtiquetaMod.TabIndex = 1;
			this.cbEtiquetaMod.Text = "MOD";
			this.cbEtiquetaMod.UseVisualStyleBackColor = true;
			// 
			// cbEtiquetaEmote
			// 
			this.cbEtiquetaEmote.AutoSize = true;
			this.cbEtiquetaEmote.Font = new System.Drawing.Font("Segoe UI Semibold", 9F);
			this.cbEtiquetaEmote.Location = new System.Drawing.Point(3, 27);
			this.cbEtiquetaEmote.Name = "cbEtiquetaEmote";
			this.cbEtiquetaEmote.Size = new System.Drawing.Size(64, 18);
			this.cbEtiquetaEmote.TabIndex = 2;
			this.cbEtiquetaEmote.Text = "EMOTE";
			this.cbEtiquetaEmote.UseVisualStyleBackColor = true;
			// 
			// cbEtiquetaPapa
			// 
			this.cbEtiquetaPapa.AutoSize = true;
			this.cbEtiquetaPapa.Font = new System.Drawing.Font("Segoe UI Semibold", 9F);
			this.cbEtiquetaPapa.Location = new System.Drawing.Point(3, 99);
			this.cbEtiquetaPapa.Name = "cbEtiquetaPapa";
			this.cbEtiquetaPapa.Size = new System.Drawing.Size(54, 18);
			this.cbEtiquetaPapa.TabIndex = 8;
			this.cbEtiquetaPapa.Text = "PAPA";
			this.cbEtiquetaPapa.UseVisualStyleBackColor = true;
			// 
			// lblEtiquetas
			// 
			this.lblEtiquetas.AutoSize = true;
			this.lblEtiquetas.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblEtiquetas.Font = new System.Drawing.Font("Lato Black", 9F);
			this.lblEtiquetas.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.lblEtiquetas.Location = new System.Drawing.Point(0, 0);
			this.lblEtiquetas.Name = "lblEtiquetas";
			this.lblEtiquetas.Size = new System.Drawing.Size(73, 15);
			this.lblEtiquetas.TabIndex = 1;
			this.lblEtiquetas.Text = "ETIQUETAS";
			this.lblEtiquetas.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlOpciones
			// 
			this.pnlOpciones.Controls.Add(this.dgvOpciones);
			this.pnlOpciones.Controls.Add(this.tlpBotonesOpciones);
			this.pnlOpciones.Controls.Add(this.lblOpciones);
			this.pnlOpciones.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlOpciones.Location = new System.Drawing.Point(12, 273);
			this.pnlOpciones.Name = "pnlOpciones";
			this.pnlOpciones.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlOpciones.Size = new System.Drawing.Size(256, 161);
			this.pnlOpciones.TabIndex = 3;
			// 
			// dgvOpciones
			// 
			this.dgvOpciones.AllowUserToAddRows = false;
			this.dgvOpciones.AllowUserToDeleteRows = false;
			this.dgvOpciones.AllowUserToResizeColumns = false;
			this.dgvOpciones.AllowUserToResizeRows = false;
			this.dgvOpciones.BackgroundColor = System.Drawing.Color.FromArgb(((int)(((byte)(20)))), ((int)(((byte)(27)))), ((int)(((byte)(33)))));
			this.dgvOpciones.BorderStyle = System.Windows.Forms.BorderStyle.None;
			this.dgvOpciones.CellBorderStyle = System.Windows.Forms.DataGridViewCellBorderStyle.None;
			this.dgvOpciones.ColumnHeadersBorderStyle = System.Windows.Forms.DataGridViewHeaderBorderStyle.None;
			dataGridViewCellStyle26.Alignment = System.Windows.Forms.DataGridViewContentAlignment.MiddleCenter;
			dataGridViewCellStyle26.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			dataGridViewCellStyle26.Font = new System.Drawing.Font("Segoe UI", 11F);
			dataGridViewCellStyle26.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(80)))), ((int)(((byte)(105)))), ((int)(((byte)(133)))));
			dataGridViewCellStyle26.SelectionBackColor = System.Drawing.SystemColors.Highlight;
			dataGridViewCellStyle26.SelectionForeColor = System.Drawing.SystemColors.HighlightText;
			this.dgvOpciones.ColumnHeadersDefaultCellStyle = dataGridViewCellStyle26;
			this.dgvOpciones.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
			this.dgvOpciones.Columns.AddRange(new System.Windows.Forms.DataGridViewColumn[] {
            this.Opción,
            this.Nombre,
            this.Tipo});
			dataGridViewCellStyle30.Alignment = System.Windows.Forms.DataGridViewContentAlignment.MiddleCenter;
			dataGridViewCellStyle30.BackColor = System.Drawing.SystemColors.Window;
			dataGridViewCellStyle30.Font = new System.Drawing.Font("Segoe UI", 11F);
			dataGridViewCellStyle30.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			dataGridViewCellStyle30.SelectionBackColor = System.Drawing.SystemColors.Highlight;
			dataGridViewCellStyle30.SelectionForeColor = System.Drawing.SystemColors.HighlightText;
			dataGridViewCellStyle30.WrapMode = System.Windows.Forms.DataGridViewTriState.False;
			this.dgvOpciones.DefaultCellStyle = dataGridViewCellStyle30;
			this.dgvOpciones.Dock = System.Windows.Forms.DockStyle.Fill;
			this.dgvOpciones.EditMode = System.Windows.Forms.DataGridViewEditMode.EditProgrammatically;
			this.dgvOpciones.EnableHeadersVisualStyles = false;
			this.dgvOpciones.GridColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.dgvOpciones.Location = new System.Drawing.Point(0, 57);
			this.dgvOpciones.MultiSelect = false;
			this.dgvOpciones.Name = "dgvOpciones";
			this.dgvOpciones.ReadOnly = true;
			this.dgvOpciones.RowHeadersVisible = false;
			this.dgvOpciones.RowHeadersWidthSizeMode = System.Windows.Forms.DataGridViewRowHeadersWidthSizeMode.DisableResizing;
			this.dgvOpciones.Size = new System.Drawing.Size(256, 98);
			this.dgvOpciones.StandardTab = true;
			this.dgvOpciones.TabIndex = 1;
			// 
			// Opción
			// 
			this.Opción.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
			dataGridViewCellStyle27.Font = new System.Drawing.Font("Lato Black", 8F);
			this.Opción.DefaultCellStyle = dataGridViewCellStyle27;
			this.Opción.FillWeight = 25F;
			this.Opción.HeaderText = "Opción";
			this.Opción.Name = "Opción";
			this.Opción.ReadOnly = true;
			// 
			// Nombre
			// 
			this.Nombre.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
			dataGridViewCellStyle28.Font = new System.Drawing.Font("Lato Black", 8F);
			this.Nombre.DefaultCellStyle = dataGridViewCellStyle28;
			this.Nombre.FillWeight = 45F;
			this.Nombre.HeaderText = "Nombre";
			this.Nombre.Name = "Nombre";
			this.Nombre.ReadOnly = true;
			// 
			// Tipo
			// 
			this.Tipo.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
			dataGridViewCellStyle29.Font = new System.Drawing.Font("Lato Black", 8F);
			this.Tipo.DefaultCellStyle = dataGridViewCellStyle29;
			this.Tipo.FillWeight = 30F;
			this.Tipo.HeaderText = "Tipo";
			this.Tipo.Name = "Tipo";
			this.Tipo.ReadOnly = true;
			// 
			// tlpBotonesOpciones
			// 
			this.tlpBotonesOpciones.ColumnCount = 2;
			this.tlpBotonesOpciones.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 50F));
			this.tlpBotonesOpciones.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 50F));
			this.tlpBotonesOpciones.Controls.Add(this.btnAgregarBandera, 1, 0);
			this.tlpBotonesOpciones.Controls.Add(this.btnAgregarParámetro, 0, 0);
			this.tlpBotonesOpciones.Dock = System.Windows.Forms.DockStyle.Top;
			this.tlpBotonesOpciones.Location = new System.Drawing.Point(0, 15);
			this.tlpBotonesOpciones.Name = "tlpBotonesOpciones";
			this.tlpBotonesOpciones.RowCount = 1;
			this.tlpBotonesOpciones.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Percent, 50F));
			this.tlpBotonesOpciones.Size = new System.Drawing.Size(256, 42);
			this.tlpBotonesOpciones.TabIndex = 0;
			// 
			// btnAgregarBandera
			// 
			this.btnAgregarBandera.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(23)))), ((int)(((byte)(35)))), ((int)(((byte)(48)))));
			this.btnAgregarBandera.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.btnAgregarBandera.BorderRadius = 100F;
			this.btnAgregarBandera.BorderSize = 0F;
			this.btnAgregarBandera.Dock = System.Windows.Forms.DockStyle.Fill;
			this.btnAgregarBandera.FlatAppearance.BorderSize = 0;
			this.btnAgregarBandera.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
			this.btnAgregarBandera.Font = new System.Drawing.Font("Segoe UI Semibold", 11F);
			this.btnAgregarBandera.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(246)))), ((int)(((byte)(246)))), ((int)(((byte)(246)))));
			this.btnAgregarBandera.Location = new System.Drawing.Point(128, 0);
			this.btnAgregarBandera.Margin = new System.Windows.Forms.Padding(0, 0, 0, 3);
			this.btnAgregarBandera.Name = "btnAgregarBandera";
			this.btnAgregarBandera.PercentualRadius = true;
			this.btnAgregarBandera.Size = new System.Drawing.Size(128, 39);
			this.btnAgregarBandera.TabIndex = 1;
			this.btnAgregarBandera.Text = "Nueva Bandera";
			this.btnAgregarBandera.UseVisualStyleBackColor = false;
			// 
			// btnAgregarParámetro
			// 
			this.btnAgregarParámetro.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(23)))), ((int)(((byte)(35)))), ((int)(((byte)(48)))));
			this.btnAgregarParámetro.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.btnAgregarParámetro.BorderRadius = 100F;
			this.btnAgregarParámetro.BorderSize = 0F;
			this.btnAgregarParámetro.Dock = System.Windows.Forms.DockStyle.Fill;
			this.btnAgregarParámetro.FlatAppearance.BorderSize = 0;
			this.btnAgregarParámetro.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
			this.btnAgregarParámetro.Font = new System.Drawing.Font("Segoe UI Semibold", 11F);
			this.btnAgregarParámetro.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(246)))), ((int)(((byte)(246)))), ((int)(((byte)(246)))));
			this.btnAgregarParámetro.Location = new System.Drawing.Point(0, 0);
			this.btnAgregarParámetro.Margin = new System.Windows.Forms.Padding(0, 0, 0, 3);
			this.btnAgregarParámetro.Name = "btnAgregarParámetro";
			this.btnAgregarParámetro.PercentualRadius = true;
			this.btnAgregarParámetro.Size = new System.Drawing.Size(128, 39);
			this.btnAgregarParámetro.TabIndex = 0;
			this.btnAgregarParámetro.Text = "Nuevo Parám.";
			this.btnAgregarParámetro.UseVisualStyleBackColor = false;
			// 
			// lblOpciones
			// 
			this.lblOpciones.AutoSize = true;
			this.lblOpciones.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblOpciones.Font = new System.Drawing.Font("Lato Black", 9F);
			this.lblOpciones.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.lblOpciones.Location = new System.Drawing.Point(0, 0);
			this.lblOpciones.Name = "lblOpciones";
			this.lblOpciones.Size = new System.Drawing.Size(70, 15);
			this.lblOpciones.TabIndex = 1;
			this.lblOpciones.Text = "OPCIONES";
			this.lblOpciones.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlDescripción
			// 
			this.pnlDescripción.Controls.Add(this.tbDescripción);
			this.pnlDescripción.Controls.Add(this.lblDescripción);
			this.pnlDescripción.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlDescripción.Location = new System.Drawing.Point(12, 113);
			this.pnlDescripción.Name = "pnlDescripción";
			this.pnlDescripción.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlDescripción.Size = new System.Drawing.Size(256, 160);
			this.pnlDescripción.TabIndex = 2;
			// 
			// tbDescripción
			// 
			this.tbDescripción.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.tbDescripción.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.tbDescripción.BorderRadius = 16F;
			this.tbDescripción.BorderSize = 0F;
			this.tbDescripción.Cursor = System.Windows.Forms.Cursors.IBeam;
			this.tbDescripción.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tbDescripción.FocusColor = System.Drawing.Color.Empty;
			this.tbDescripción.Font = new System.Drawing.Font("Microsoft Sans Serif", 11F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.tbDescripción.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbDescripción.InputColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbDescripción.InputText = "";
			this.tbDescripción.Location = new System.Drawing.Point(0, 15);
			this.tbDescripción.MinimumSize = new System.Drawing.Size(20, 20);
			this.tbDescripción.Multiline = true;
			this.tbDescripción.Name = "tbDescripción";
			this.tbDescripción.PasswordChar = '\0';
			this.tbDescripción.PercentualRadius = false;
			this.tbDescripción.PlaceHolder = "Descripción";
			this.tbDescripción.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbDescripción.ReadOnly = false;
			this.tbDescripción.SelectAllOnClick = true;
			this.tbDescripción.Size = new System.Drawing.Size(256, 139);
			this.tbDescripción.Style = ControLib.SleekTextBox.TextBoxStyle.RoundRect;
			this.tbDescripción.TabIndex = 0;
			this.tbDescripción.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
			this.tbDescripción.WordWrap = true;
			// 
			// lblDescripción
			// 
			this.lblDescripción.AutoSize = true;
			this.lblDescripción.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblDescripción.Font = new System.Drawing.Font("Lato Black", 9F);
			this.lblDescripción.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.lblDescripción.Location = new System.Drawing.Point(0, 0);
			this.lblDescripción.Name = "lblDescripción";
			this.lblDescripción.Size = new System.Drawing.Size(89, 15);
			this.lblDescripción.TabIndex = 1;
			this.lblDescripción.Text = "DESCRIPCIÓN";
			this.lblDescripción.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlAlias
			// 
			this.pnlAlias.Controls.Add(this.tbNuevoAlias);
			this.pnlAlias.Controls.Add(this.btnNuevoAlias);
			this.pnlAlias.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlAlias.Location = new System.Drawing.Point(12, 68);
			this.pnlAlias.Name = "pnlAlias";
			this.pnlAlias.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlAlias.Size = new System.Drawing.Size(256, 45);
			this.pnlAlias.TabIndex = 1;
			// 
			// tbNuevoAlias
			// 
			this.tbNuevoAlias.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.tbNuevoAlias.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.tbNuevoAlias.BorderRadius = 100F;
			this.tbNuevoAlias.BorderSize = 0F;
			this.tbNuevoAlias.Cursor = System.Windows.Forms.Cursors.IBeam;
			this.tbNuevoAlias.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tbNuevoAlias.FocusColor = System.Drawing.Color.Empty;
			this.tbNuevoAlias.Font = new System.Drawing.Font("Microsoft Sans Serif", 11F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.tbNuevoAlias.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbNuevoAlias.InputColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbNuevoAlias.InputText = "";
			this.tbNuevoAlias.Location = new System.Drawing.Point(0, 0);
			this.tbNuevoAlias.MinimumSize = new System.Drawing.Size(20, 20);
			this.tbNuevoAlias.Multiline = false;
			this.tbNuevoAlias.Name = "tbNuevoAlias";
			this.tbNuevoAlias.PasswordChar = '\0';
			this.tbNuevoAlias.PercentualRadius = true;
			this.tbNuevoAlias.PlaceHolder = "Alias";
			this.tbNuevoAlias.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbNuevoAlias.ReadOnly = false;
			this.tbNuevoAlias.SelectAllOnClick = true;
			this.tbNuevoAlias.Size = new System.Drawing.Size(217, 39);
			this.tbNuevoAlias.Style = ControLib.SleekTextBox.TextBoxStyle.RoundRect;
			this.tbNuevoAlias.TabIndex = 0;
			this.tbNuevoAlias.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
			this.tbNuevoAlias.WordWrap = true;
			// 
			// btnNuevoAlias
			// 
			this.btnNuevoAlias.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.btnNuevoAlias.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.btnNuevoAlias.BorderRadius = 100F;
			this.btnNuevoAlias.BorderSize = 0F;
			this.btnNuevoAlias.Dock = System.Windows.Forms.DockStyle.Right;
			this.btnNuevoAlias.FlatAppearance.BorderSize = 0;
			this.btnNuevoAlias.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
			this.btnNuevoAlias.Font = new System.Drawing.Font("Arial Black", 16F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.btnNuevoAlias.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(64)))), ((int)(((byte)(196)))), ((int)(((byte)(130)))));
			this.btnNuevoAlias.Location = new System.Drawing.Point(217, 0);
			this.btnNuevoAlias.Name = "btnNuevoAlias";
			this.btnNuevoAlias.PercentualRadius = true;
			this.btnNuevoAlias.Size = new System.Drawing.Size(39, 39);
			this.btnNuevoAlias.TabIndex = 1;
			this.btnNuevoAlias.Text = "+";
			this.btnNuevoAlias.TextAlign = System.Drawing.ContentAlignment.TopRight;
			this.btnNuevoAlias.UseVisualStyleBackColor = false;
			// 
			// pnlNombre
			// 
			this.pnlNombre.Controls.Add(this.tbNombre);
			this.pnlNombre.Controls.Add(this.lblNombre);
			this.pnlNombre.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlNombre.Location = new System.Drawing.Point(12, 8);
			this.pnlNombre.Name = "pnlNombre";
			this.pnlNombre.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlNombre.Size = new System.Drawing.Size(256, 60);
			this.pnlNombre.TabIndex = 0;
			// 
			// tbNombre
			// 
			this.tbNombre.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.tbNombre.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.tbNombre.BorderRadius = 100F;
			this.tbNombre.BorderSize = 0F;
			this.tbNombre.Cursor = System.Windows.Forms.Cursors.IBeam;
			this.tbNombre.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tbNombre.FocusColor = System.Drawing.Color.Empty;
			this.tbNombre.Font = new System.Drawing.Font("Microsoft Sans Serif", 11F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.tbNombre.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbNombre.InputColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbNombre.InputText = "";
			this.tbNombre.Location = new System.Drawing.Point(0, 15);
			this.tbNombre.MinimumSize = new System.Drawing.Size(20, 20);
			this.tbNombre.Multiline = false;
			this.tbNombre.Name = "tbNombre";
			this.tbNombre.PasswordChar = '\0';
			this.tbNombre.PercentualRadius = true;
			this.tbNombre.PlaceHolder = "Nombre";
			this.tbNombre.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbNombre.ReadOnly = false;
			this.tbNombre.SelectAllOnClick = true;
			this.tbNombre.Size = new System.Drawing.Size(256, 39);
			this.tbNombre.Style = ControLib.SleekTextBox.TextBoxStyle.RoundRect;
			this.tbNombre.TabIndex = 0;
			this.tbNombre.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
			this.tbNombre.WordWrap = true;
			// 
			// lblNombre
			// 
			this.lblNombre.AutoSize = true;
			this.lblNombre.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblNombre.Font = new System.Drawing.Font("Lato Black", 9F);
			this.lblNombre.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.lblNombre.Location = new System.Drawing.Point(0, 0);
			this.lblNombre.Name = "lblNombre";
			this.lblNombre.Size = new System.Drawing.Size(60, 15);
			this.lblNombre.TabIndex = 1;
			this.lblNombre.Text = "NOMBRE";
			this.lblNombre.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlTítuloMetadatos
			// 
			this.pnlTítuloMetadatos.AutoSize = true;
			this.pnlTítuloMetadatos.Controls.Add(this.lblMetadatos);
			this.pnlTítuloMetadatos.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlTítuloMetadatos.Location = new System.Drawing.Point(0, 0);
			this.pnlTítuloMetadatos.Name = "pnlTítuloMetadatos";
			this.pnlTítuloMetadatos.Size = new System.Drawing.Size(297, 45);
			this.pnlTítuloMetadatos.TabIndex = 3;
			// 
			// lblMetadatos
			// 
			this.lblMetadatos.AutoSize = true;
			this.lblMetadatos.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblMetadatos.Font = new System.Drawing.Font("Segoe UI Black", 24F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.lblMetadatos.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(159)))), ((int)(((byte)(39)))), ((int)(((byte)(39)))));
			this.lblMetadatos.Location = new System.Drawing.Point(0, 0);
			this.lblMetadatos.Name = "lblMetadatos";
			this.lblMetadatos.Size = new System.Drawing.Size(188, 45);
			this.lblMetadatos.TabIndex = 3;
			this.lblMetadatos.Text = "Metadatos";
			// 
			// btnGenerar
			// 
			this.btnGenerar.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Right)));
			this.btnGenerar.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(159)))), ((int)(((byte)(39)))), ((int)(((byte)(39)))));
			this.btnGenerar.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.btnGenerar.BorderRadius = 100F;
			this.btnGenerar.BorderSize = 0F;
			this.btnGenerar.FlatAppearance.BorderSize = 0;
			this.btnGenerar.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
			this.btnGenerar.Font = new System.Drawing.Font("Segoe UI Semibold", 12F);
			this.btnGenerar.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(246)))), ((int)(((byte)(246)))), ((int)(((byte)(246)))));
			this.btnGenerar.Location = new System.Drawing.Point(558, 498);
			this.btnGenerar.Name = "btnGenerar";
			this.btnGenerar.PercentualRadius = true;
			this.btnGenerar.Size = new System.Drawing.Size(154, 34);
			this.btnGenerar.TabIndex = 3;
			this.btnGenerar.Text = "Generar";
			this.btnGenerar.UseVisualStyleBackColor = false;
			// 
			// cbEtiquetaChaos
			// 
			this.cbEtiquetaChaos.AutoSize = true;
			this.cbEtiquetaChaos.Font = new System.Drawing.Font("Segoe UI Semibold", 9F);
			this.cbEtiquetaChaos.Location = new System.Drawing.Point(3, 51);
			this.cbEtiquetaChaos.Name = "cbEtiquetaChaos";
			this.cbEtiquetaChaos.Size = new System.Drawing.Size(66, 18);
			this.cbEtiquetaChaos.TabIndex = 4;
			this.cbEtiquetaChaos.Text = "CHAOS";
			this.cbEtiquetaChaos.UseVisualStyleBackColor = true;
			// 
			// cbEtiquetaGame
			// 
			this.cbEtiquetaGame.AutoSize = true;
			this.cbEtiquetaGame.Font = new System.Drawing.Font("Segoe UI Semibold", 9F);
			this.cbEtiquetaGame.Location = new System.Drawing.Point(131, 51);
			this.cbEtiquetaGame.Name = "cbEtiquetaGame";
			this.cbEtiquetaGame.Size = new System.Drawing.Size(59, 18);
			this.cbEtiquetaGame.TabIndex = 5;
			this.cbEtiquetaGame.Text = "GAME";
			this.cbEtiquetaGame.UseVisualStyleBackColor = true;
			// 
			// cbEtiquetaOutdated
			// 
			this.cbEtiquetaOutdated.AutoSize = true;
			this.cbEtiquetaOutdated.Font = new System.Drawing.Font("Segoe UI Semibold", 9F);
			this.cbEtiquetaOutdated.Location = new System.Drawing.Point(3, 75);
			this.cbEtiquetaOutdated.Name = "cbEtiquetaOutdated";
			this.cbEtiquetaOutdated.Size = new System.Drawing.Size(88, 18);
			this.cbEtiquetaOutdated.TabIndex = 6;
			this.cbEtiquetaOutdated.Text = "OUTDATED";
			this.cbEtiquetaOutdated.UseVisualStyleBackColor = true;
			// 
			// cbEtiquetaMaintenance
			// 
			this.cbEtiquetaMaintenance.AutoSize = true;
			this.cbEtiquetaMaintenance.Font = new System.Drawing.Font("Segoe UI Semibold", 9F);
			this.cbEtiquetaMaintenance.Location = new System.Drawing.Point(131, 75);
			this.cbEtiquetaMaintenance.Name = "cbEtiquetaMaintenance";
			this.cbEtiquetaMaintenance.Size = new System.Drawing.Size(110, 18);
			this.cbEtiquetaMaintenance.TabIndex = 7;
			this.cbEtiquetaMaintenance.Text = "MAINTENANCE";
			this.cbEtiquetaMaintenance.UseVisualStyleBackColor = true;
			// 
			// cbEtiquetaGuide
			// 
			this.cbEtiquetaGuide.AutoSize = true;
			this.cbEtiquetaGuide.Font = new System.Drawing.Font("Segoe UI Semibold", 9F);
			this.cbEtiquetaGuide.Location = new System.Drawing.Point(3, 123);
			this.cbEtiquetaGuide.Name = "cbEtiquetaGuide";
			this.cbEtiquetaGuide.Size = new System.Drawing.Size(61, 19);
			this.cbEtiquetaGuide.TabIndex = 10;
			this.cbEtiquetaGuide.Text = "GUIDE";
			this.cbEtiquetaGuide.UseVisualStyleBackColor = true;
			// 
			// cbEtiquetaHourai
			// 
			this.cbEtiquetaHourai.AutoSize = true;
			this.cbEtiquetaHourai.Font = new System.Drawing.Font("Segoe UI Semibold", 9F);
			this.cbEtiquetaHourai.Location = new System.Drawing.Point(131, 99);
			this.cbEtiquetaHourai.Name = "cbEtiquetaHourai";
			this.cbEtiquetaHourai.Size = new System.Drawing.Size(71, 18);
			this.cbEtiquetaHourai.TabIndex = 9;
			this.cbEtiquetaHourai.Text = "HOURAI";
			this.cbEtiquetaHourai.UseVisualStyleBackColor = true;
			// 
			// FPrincipal
			// 
			this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 20F);
			this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
			this.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(26)))), ((int)(((byte)(26)))), ((int)(((byte)(26)))));
			this.ClientSize = new System.Drawing.Size(724, 544);
			this.Controls.Add(this.btnGenerar);
			this.Controls.Add(this.pnlMetadatos);
			this.Font = new System.Drawing.Font("Segoe UI", 11F);
			this.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.KeyPreview = true;
			this.Margin = new System.Windows.Forms.Padding(4, 5, 4, 5);
			this.MinimumSize = new System.Drawing.Size(490, 210);
			this.Name = "FPrincipal";
			this.ShowIcon = false;
			this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
			this.Text = "Command Builder";
			this.KeyPress += new System.Windows.Forms.KeyPressEventHandler(this.FPrincipal_KeyPress);
			this.pnlMetadatos.ResumeLayout(false);
			this.pnlMetadatos.PerformLayout();
			this.pnlContenidoMetadatos.ResumeLayout(false);
			this.pnlEtiquetas.ResumeLayout(false);
			this.pnlEtiquetas.PerformLayout();
			this.tlpEtiquetas.ResumeLayout(false);
			this.tlpEtiquetas.PerformLayout();
			this.pnlOpciones.ResumeLayout(false);
			this.pnlOpciones.PerformLayout();
			((System.ComponentModel.ISupportInitialize)(this.dgvOpciones)).EndInit();
			this.tlpBotonesOpciones.ResumeLayout(false);
			this.pnlDescripción.ResumeLayout(false);
			this.pnlDescripción.PerformLayout();
			this.pnlAlias.ResumeLayout(false);
			this.pnlNombre.ResumeLayout(false);
			this.pnlNombre.PerformLayout();
			this.pnlTítuloMetadatos.ResumeLayout(false);
			this.pnlTítuloMetadatos.PerformLayout();
			this.ResumeLayout(false);

		}

		#endregion
		private System.Windows.Forms.Panel pnlMetadatos;
		private ControLib.SleekButton btnGenerar;
		private System.Windows.Forms.SaveFileDialog sflComando;
		private System.Windows.Forms.Panel pnlTítuloMetadatos;
		private System.Windows.Forms.Panel pnlContenidoMetadatos;
		private System.Windows.Forms.Label lblMetadatos;
		private System.Windows.Forms.Panel pnlNombre;
		private ControLib.SleekTextBox tbNombre;
		private System.Windows.Forms.Label lblNombre;
		private System.Windows.Forms.Panel pnlAlias;
		private ControLib.SleekTextBox tbNuevoAlias;
		private System.Windows.Forms.Panel pnlDescripción;
		private ControLib.SleekTextBox tbDescripción;
		private System.Windows.Forms.Label lblDescripción;
		private ControLib.SleekButton btnNuevoAlias;
		private System.Windows.Forms.Panel pnlOpciones;
		private System.Windows.Forms.Label lblOpciones;
		private System.Windows.Forms.TableLayoutPanel tlpBotonesOpciones;
		private ControLib.SleekButton btnAgregarParámetro;
		private ControLib.SleekButton btnAgregarBandera;
		private System.Windows.Forms.DataGridView dgvOpciones;
		private System.Windows.Forms.Panel pnlEtiquetas;
		private System.Windows.Forms.Label lblEtiquetas;
		private System.Windows.Forms.DataGridViewTextBoxColumn Opción;
		private System.Windows.Forms.DataGridViewTextBoxColumn Nombre;
		private System.Windows.Forms.DataGridViewTextBoxColumn Tipo;
		private System.Windows.Forms.Panel panel1;
		private System.Windows.Forms.CheckBox cbEtiquetaCommon;
		private System.Windows.Forms.CheckBox cbEtiquetaPapa;
		private System.Windows.Forms.CheckBox cbEtiquetaMod;
		private System.Windows.Forms.CheckBox cbEtiquetaEmote;
		private System.Windows.Forms.TableLayoutPanel tlpEtiquetas;
		private System.Windows.Forms.CheckBox cbEtiquetaMeme;
		private System.Windows.Forms.CheckBox cbEtiquetaChaos;
		private System.Windows.Forms.CheckBox cbEtiquetaGame;
		private System.Windows.Forms.CheckBox cbEtiquetaOutdated;
		private System.Windows.Forms.CheckBox cbEtiquetaMaintenance;
		private System.Windows.Forms.CheckBox cbEtiquetaGuide;
		private System.Windows.Forms.CheckBox cbEtiquetaHourai;
	}
}

